import pool, { query } from '../config/db.js';
import { WalletService } from './WalletService.js';
import { FinancialService } from './FinancialService.js';
import { Queue } from 'bullmq';
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const require = createRequire(import.meta.url);
// Removed top-level config require to prevent caching issues
// const config = require('../config/plan_config.json');

const walletService = new WalletService();
// const financialService = new FinancialService(); // Removed global instance for isolation

// Lazy Init Queue
let autoPoolQueue: Queue | null = null;
const getQueue = () => {
    if (!autoPoolQueue) {
        autoPoolQueue = new Queue('auto-pool-queue', {
            connection: {
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379')
            }
        });
    }
    return autoPoolQueue;
};

export class NodeService {

    // Verify Sponsor Code and Return Owner Name
    async verifySponsor(referralCode: string) {
        const res = await query(
            `SELECT n.id, u.full_name, n.status, n.direct_referrals_count 
             FROM Nodes n 
             JOIN Users u ON n.owner_user_id = u.id 
             WHERE n.referral_code = $1`,
            [referralCode]
        );

        if (res.rows.length === 0) {
            throw new Error('Invalid Sponsor Code');
        }

        const node = res.rows[0];
        return {
            valid: true,
            sponsorName: node.full_name,
            nodeId: node.id,
            status: node.status
        };
    }

    // BFS Placement Logic (Self Pool - Sponsor Tree)
    // Uses 'self_pool_parent_id'
    private async findSelfPoolPlacement(sponsorNodeId: number, client: any = null): Promise<{ parentId: number | null }> {
        if (!sponsorNodeId) return { parentId: null };
        const q = client ? client.query.bind(client) : query;
        const queue = [sponsorNodeId];

        while (queue.length > 0) {
            const currentId = queue.shift()!;

            // LOCK the parent row to prevent race conditions
            if (client) {
                await q('SELECT id FROM Nodes WHERE id = $1 FOR UPDATE', [currentId]);
            }

            // Check how many children this node has in Self Pool
            const res = await q('SELECT COUNT(*) as count FROM Nodes WHERE self_pool_parent_id = $1', [currentId]);
            const count = parseInt(res.rows[0].count);

            // Load Config
            const configPath = path.resolve(__dirname, '../config/plan_config.json');
            const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

            if (count < config.matrix.width) {
                return { parentId: currentId };
            }

            // If full, add children to queue to search next level
            const childrenRes = await q('SELECT id FROM Nodes WHERE self_pool_parent_id = $1 ORDER BY created_at ASC, id ASC', [currentId]);
            for (const row of childrenRes.rows) {
                queue.push(row.id);
            }
        }
        throw new Error('Placement failed: Tree is full or infinite loop detected');
    }


    // BFS to find the next available spot in the Global Auto Pool (Synchronous & Locked)
    private async findGlobalPlacement(client: any): Promise<number> {
        const q = client.query.bind(client);

        // 1. Get the Root Node (Anchor)
        let rootId;
        const rootRes = await q("SELECT id FROM Nodes WHERE referral_code = 'JSE-ROOT'");
        if (rootRes.rows.length > 0) rootId = rootRes.rows[0].id;
        else {
            const altRes = await q("SELECT id FROM Nodes WHERE referral_code = 'JSE-AUTO-ROOT'");
            if (altRes.rows.length > 0) rootId = altRes.rows[0].id;
            else throw new Error("No Global Root found");
        }

        const queue = [rootId];

        while (queue.length > 0) {
            const currentId = queue.shift()!;

            // LOCK the parent row to prevent race conditions during check-and-insert
            // We lock 'currentId' to ensure its children count doesn't change while we decide
            // check: FOR UPDATE might be too heavy? 
            // Better: We are checking children count.
            // If we lock 'currentId', nobody else can add a child involving 'currentId' if they also lock it?
            // Actually, inserting a child doesn't modify Parent Row unless we update a counter.
            // But we DO update 'auto_pool_parent_id' on the Child.
            // To block others, we should probably lock the Parent Row for update, 
            // effectively serializing access to this Parent's slot availability.
            await q('SELECT id FROM Nodes WHERE id = $1 FOR UPDATE', [currentId]);

            // Count children in Auto Pool
            const res = await q('SELECT COUNT(*) as count FROM Nodes WHERE auto_pool_parent_id = $1', [currentId]);
            const count = parseInt(res.rows[0].count);

            if (count < 3) { // Hardcoded 3 for Auto Pool Width
                return currentId;
            }

            // If full, add children to queue
            const childrenRes = await q('SELECT id FROM Nodes WHERE auto_pool_parent_id = $1 ORDER BY created_at ASC, id ASC', [currentId]);
            for (const row of childrenRes.rows) {
                queue.push(row.id);
            }
        }

        throw new Error('Global Matrix full or critical error');
    }

    async purchaseNode(userId: number, sponsorCode: string) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const financialService = new FinancialService(); // Local instance


            // Load Config Dynamically
            const configPath = path.resolve(__dirname, '../config/plan_config.json');
            const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

            // 1. Validate Sponsor
            const sponsorRes = await client.query('SELECT id, owner_user_id, direct_referrals_count, status FROM Nodes WHERE referral_code = $1', [sponsorCode]);
            if (sponsorRes.rows.length === 0) {
                throw new Error('Invalid Sponsor Code');
            }
            const sponsorNodeId = sponsorRes.rows[0].id;

            // 2. Check Balance & Deduct Funds
            await walletService.deductFunds(userId, config.fees.joining_fee, client);

            // 3. Distribute Funds (Self Pool + Direct Bonus)
            const DIRECT_BONUS = config.fees.distributions.direct_referral_bonus;
            console.log(`[DEBUG] Direct Bonus: ${DIRECT_BONUS} (Config: ${config.fees.distributions.direct_referral_bonus})`);

            await walletService.creditNodeWallet(
                sponsorNodeId,
                DIRECT_BONUS,
                `Direct Referral Bonus from ${sponsorCode}`,
                client
            );

            await client.query(
                'UPDATE Nodes SET direct_referrals_count = direct_referrals_count + 1 WHERE id = $1',
                [sponsorNodeId]
            );

            const sponsorCheck = await client.query('SELECT direct_referrals_count, status FROM Nodes WHERE id = $1', [sponsorNodeId]);
            if (sponsorCheck.rows[0].direct_referrals_count >= 3 && sponsorCheck.rows[0].status === 'INACTIVE') {
                await client.query("UPDATE Nodes SET status = 'ACTIVE' WHERE id = $1", [sponsorNodeId]);
            }

            // 4. Find Placement (Self Pool) - Existing Logic
            const { parentId: selfPoolParentId } = await this.findSelfPoolPlacement(sponsorNodeId, client);

            // 5. Find Placement (Auto Pool) - NEW SYNCHRONOUS LOGIC
            // This is the "Strong Logic" requested by user.
            const autoPoolParentId = await this.findGlobalPlacement(client);

            // 6. Create Node (With BOTH Parents set immediately)
            const referralCode = `JSE-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
            const nodeRes = await client.query(
                `INSERT INTO Nodes (referral_code, owner_user_id, sponsor_node_id, self_pool_parent_id, auto_pool_parent_id, status, wallet_balance)
                 VALUES ($1, $2, $3, $4, $5, 'INACTIVE', 0.00) RETURNING id`,
                [referralCode, userId, sponsorNodeId, selfPoolParentId, autoPoolParentId]
            );
            const nodeId = nodeRes.rows[0].id;

            // 7. Log Transaction
            await client.query(
                `INSERT INTO Transactions (wallet_owner_id, amount, type, description, status) 
                 VALUES ($1, $2, 'DEBIT', 'Node Purchase', 'COMPLETED')`,
                [userId, config.fees.joining_fee]
            );

            // 8. Process Financials (SELF POOL + AUTO POOL)
            // Distribute Self Pool Commissions
            await financialService.distributeNewNodeCommissions(nodeId, 'SELF', client);
            // Distribute Auto Pool Commissions (Immediate)
            await financialService.distributeNewNodeCommissions(nodeId, 'AUTO', client);

            await client.query('COMMIT');

            // 9. Process Rebirths - Handled Synchronously by FinancialService now.
            // No background queue needed.

            return { nodeId, referralCode, message: 'Node purchased successfully.' };

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async getDirectReferrals(nodeId: number) {
        const res = await query(
            `SELECT n.id, n.referral_code, u.full_name, n.status, n.created_at 
             FROM Nodes n 
             JOIN Users u ON n.owner_user_id = u.id 
             WHERE n.sponsor_node_id = $1 
             ORDER BY n.created_at DESC`,
            [nodeId]
        );
        return res.rows;
    }


    async getUserNodes(userId: number) {
        const res = await query('SELECT * FROM Nodes WHERE owner_user_id = $1 ORDER BY created_at DESC', [userId]);
        return res.rows;
    }

    async getNodeStats(nodeId: number) {
        const nodeRes = await query('SELECT * FROM Nodes WHERE id = $1', [nodeId]);
        if (nodeRes.rows.length === 0) throw new Error('Node not found');
        const node = nodeRes.rows[0];

        // Level Logic: Fetch highest level from LevelProgress or default to 1
        const selfLevelRes = await query(
            "SELECT MAX(level) as lvl FROM LevelProgress WHERE node_id = $1 AND pool_type = 'SELF'",
            [nodeId]
        );
        const selfPoolLevel = selfLevelRes.rows[0].lvl || 1;

        const autoLevelRes = await query(
            "SELECT MAX(level) as lvl FROM LevelProgress WHERE node_id = $1 AND pool_type = 'AUTO'",
            [nodeId]
        );
        const autoPoolLevel = autoLevelRes.rows[0].lvl || 1;

        return {
            id: node.id,
            referralCode: node.referral_code,
            status: node.status,
            walletBalance: node.wallet_balance,
            selfPoolLevel: parseInt(selfPoolLevel),
            autoPoolLevel: parseInt(autoPoolLevel),
            // Deprecated counts (kept for safety if needed elsewhere, but user wants Levels)
            // selfPoolTeam: ...
        };
    }
    async getGenealogy(nodeId: number, type: 'SELF' | 'AUTO' = 'SELF', fetchGlobalRoot: boolean = false) {
        const parentColumn = type === 'AUTO' ? 'auto_pool_parent_id' : 'self_pool_parent_id';

        let anchorNodeId = nodeId;

        if (fetchGlobalRoot && type === 'AUTO') {
            // Find the Auto Pool Root Node
            const rootRes = await query("SELECT id FROM Nodes WHERE referral_code = 'JSE-AUTO-ROOT'");
            if (rootRes.rows.length > 0) {
                anchorNodeId = rootRes.rows[0].id;
            } else {
                const fallbackRes = await query("SELECT id FROM Nodes WHERE referral_code = 'JSE-ROOT'");
                if (fallbackRes.rows.length > 0) {
                    anchorNodeId = fallbackRes.rows[0].id;
                }
            }
        }

        // Use standard current_level for now (Schema update for split levels pending)
        const levelColumn = 'current_level';

        // Recursive CTE to fetch 3 levels down

        const res = await query(
            `WITH RECURSIVE genealogy AS (
                SELECT 
                    id, referral_code, owner_user_id, sponsor_node_id, self_pool_parent_id, auto_pool_parent_id, 
                    direct_referrals_count, status, created_at, ${levelColumn} as current_level, is_rebirth, origin_node_id,
                    1 as level, 
                    CAST(id AS VARCHAR) as path
                FROM Nodes
                WHERE id = $1
                UNION ALL
                SELECT 
                    n.id, n.referral_code, n.owner_user_id, n.sponsor_node_id, n.self_pool_parent_id, n.auto_pool_parent_id, 
                    n.direct_referrals_count, n.status, n.created_at, n.${levelColumn} as current_level, n.is_rebirth, n.origin_node_id,
                    g.level + 1,
                    CAST(g.path || '->' || n.id AS VARCHAR)
                FROM Nodes n
                INNER JOIN genealogy g ON n.${parentColumn} = g.id
            )
            SELECT * FROM genealogy ORDER BY level, created_at`,
            [anchorNodeId]
        );

        const nodes = res.rows;
        if (nodes.length === 0) throw new Error('Node not found');

        // Build Tree Structure
        const nodeMap = new Map();
        let root = null;

        // Initialize Map
        nodes.forEach(node => {
            node.children = [];
            nodeMap.set(node.id, node);
        });

        // Link Children
        nodes.forEach(node => {
            if (node.id === anchorNodeId) {
                root = node;
            } else {
                // IMPORTANT: Link based on the requested tree type's parent
                const parentId = type === 'AUTO' ? node.auto_pool_parent_id : node.self_pool_parent_id;
                const parent = nodeMap.get(parentId);
                if (parent) {
                    parent.children.push(node);
                }
            }
        });

        return root;
    }

    // Admin: Transfer Node Ownership
    async transferNode(targetNodeId: number, newOwnerId: number, adminId: number) {
        if (!targetNodeId || !newOwnerId) throw new Error('Target Node ID and New Owner ID are required');

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Verify New Owner Exists
            const userRes = await client.query('SELECT id, email FROM Users WHERE id = $1', [newOwnerId]);
            if (userRes.rows.length === 0) throw new Error('New Owner User not found');
            const newOwnerEmail = userRes.rows[0].email;

            // 2. Verify Target Node & Current Ownership
            // We LOCK the row to prevent concurrent modifications
            const nodeRes = await client.query('SELECT id, referral_code, owner_user_id, is_rebirth, wallet_balance FROM Nodes WHERE id = $1 FOR UPDATE', [targetNodeId]);
            if (nodeRes.rows.length === 0) throw new Error('Target Node not found');

            const node = nodeRes.rows[0];
            const oldOwnerId = node.owner_user_id;

            if (node.is_rebirth) {
                // We disallow transferring a Rebirth Node individually because it breaks the "Origin linkage" logic.
                // Rebirths must stay with their Mother.
                throw new Error('Cannot transfer a Rebirth Node strictly. Please transfer the Mother/Origin Node instead.');
            }

            if (oldOwnerId === newOwnerId) {
                throw new Error('Node is already owned by this user');
            }

            // 3. Update Target Node Owner
            await client.query('UPDATE Nodes SET owner_user_id = $1 WHERE id = $2', [newOwnerId, targetNodeId]);

            // 4. Update ALL Rebirths of this Node
            // We assume rebirths are linked via origin_node_id
            const rebirthUpdateRes = await client.query(
                'UPDATE Nodes SET owner_user_id = $1 WHERE origin_node_id = $2 AND is_rebirth = TRUE',
                [newOwnerId, targetNodeId]
            );
            const rebirthsCount = rebirthUpdateRes.rowCount;

            // 5. Audit Logging (Transactions or SystemLogs)
            // Log for Old Owner (DEBIT 0 - Asset Lost)
            await client.query(
                `INSERT INTO Transactions (wallet_owner_id, amount, type, description, status) 
                 VALUES ($1, 0, 'DEBIT', $2, 'COMPLETED')`,
                [oldOwnerId, `Node ${node.referral_code} transferred OUT to User ${newOwnerId} by Admin`]
            );

            // Log for New Owner (CREDIT 0 - Asset Gained)
            await client.query(
                `INSERT INTO Transactions (wallet_owner_id, amount, type, description, status) 
                 VALUES ($1, 0, 'CREDIT', $2, 'COMPLETED')`,
                [newOwnerId, `Node ${node.referral_code} transferred IN from User ${oldOwnerId} by Admin`]
            );

            // Log Admin Action (System Log) - Using CREDIT 0 as general system record
            await client.query(
                `INSERT INTO Transactions (wallet_owner_id, amount, type, description, status) 
                 VALUES ($1, 0, 'CREDIT', $2, 'COMPLETED')`,
                [adminId, `Admin transferred Node ${node.referral_code} (Balance: ${node.wallet_balance}) from ${oldOwnerId} to ${newOwnerId}. Rebirths moved: ${rebirthsCount}`]
            );

            await client.query('COMMIT');

            return {
                success: true,
                message: `Transferred Node ${node.referral_code} and ${rebirthsCount} Rebirths to User ${newOwnerEmail}`,
                rebirthsTransferred: rebirthsCount,
                nodeBalance: node.wallet_balance
            };

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}
