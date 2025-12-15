import pool, { query } from '../config/db.js';
import { WalletService } from './WalletService.js';
import { FinancialService } from './FinancialService.js';
import { Queue } from 'bullmq';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const config = require('../config/plan_config.json');

const walletService = new WalletService();
const financialService = new FinancialService();

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

    // BFS Placement Logic (Self Pool - Sponsor Tree)
    // Uses 'self_pool_parent_id'
    private async findSelfPoolPlacement(sponsorNodeId: number, client: any = null): Promise<{ parentId: number | null }> {
        if (!sponsorNodeId) return { parentId: null };

        const q = client ? client.query.bind(client) : query;

        const queue = [sponsorNodeId];

        while (queue.length > 0) {
            const currentId = queue.shift()!;

            // Check how many children this node has in Self Pool
            const res = await q('SELECT COUNT(*) as count FROM Nodes WHERE self_pool_parent_id = $1', [currentId]);
            const count = parseInt(res.rows[0].count);

            if (count < config.matrix.width) {
                return { parentId: currentId };
            }

            // If full, add children to queue to search next level
            const childrenRes = await q('SELECT id FROM Nodes WHERE self_pool_parent_id = $1 ORDER BY created_at ASC', [currentId]);
            for (const row of childrenRes.rows) {
                queue.push(row.id);
            }
        }

        throw new Error('Placement failed: Tree is full or infinite loop detected');
    }

    async purchaseNode(userId: number, sponsorCode: string) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // 1. Validate Sponsor (Can be outside transaction, but safer inside if we want to lock it? No need to lock sponsor yet unless we fear deletion)
            // Just read is fine.
            const sponsorRes = await client.query('SELECT id, owner_user_id, direct_referrals_count, status FROM Nodes WHERE referral_code = $1', [sponsorCode]);
            if (sponsorRes.rows.length === 0) {
                throw new Error('Invalid Sponsor Code');
            }
            const sponsorNodeId = sponsorRes.rows[0].id;
            // const sponsorUserId = sponsorRes.rows[0].owner_user_id; // Unused variable warning usually, but kept for context

            // 2. Check Balance & Deduct Funds
            // Pass client to share transaction context (and locks)
            await walletService.deductFunds(userId, config.fees.joining_fee, client);

            // 3. Distribute Funds (Financial System Integration)
            // Rs 500 goes to Level 1 Logic (Sponsor's Level 1 Progress)
            const MATRIX_FEE = config.fees.distributions.self_pool_fee;
            const DIRECT_BONUS = config.fees.distributions.direct_referral_bonus;
            // auto_pool_fee = 1000 (implicitly held by system)

            // Financial Service handles the "Waterfall" for the Matrix Fee
            await financialService.processIncome(sponsorNodeId, MATRIX_FEE, 1, 'SELF', client);

            // Credit Direct Referral Bonus to Sponsor's Node Wallet
            await walletService.creditNodeWallet(
                sponsorNodeId,
                DIRECT_BONUS,
                `Direct Referral Bonus from ${sponsorCode}`,
                client
            );

            // Increment Direct Referrals Count for Sponsor
            await client.query(
                'UPDATE Nodes SET direct_referrals_count = direct_referrals_count + 1 WHERE id = $1',
                [sponsorNodeId]
            );

            // Check if Sponsor should become ACTIVE (3 Referrals Condition)
            const sponsorCheck = await client.query('SELECT direct_referrals_count, status FROM Nodes WHERE id = $1', [sponsorNodeId]);
            if (sponsorCheck.rows[0].direct_referrals_count >= 3 && sponsorCheck.rows[0].status === 'INACTIVE') {
                await client.query("UPDATE Nodes SET status = 'ACTIVE' WHERE id = $1", [sponsorNodeId]);
            }

            // 4. Find Placement (Self Pool)
            // Using updated findSelfPoolPlacement with client
            const { parentId: selfPoolParentId } = await this.findSelfPoolPlacement(sponsorNodeId, client);

            // 5. Create Node
            const referralCode = `JSE-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
            const nodeRes = await client.query(
                `INSERT INTO Nodes (referral_code, owner_user_id, sponsor_node_id, self_pool_parent_id, auto_pool_parent_id, status, wallet_balance)
                 VALUES ($1, $2, $3, $4, NULL, 'INACTIVE', 0.00) RETURNING id`,
                [referralCode, userId, sponsorNodeId, selfPoolParentId]
            );
            const nodeId = nodeRes.rows[0].id;

            // 6. Log Transaction
            await client.query(
                `INSERT INTO Transactions (wallet_owner_id, amount, type, description, status) 
                 VALUES ($1, $2, 'DEBIT', 'Node Purchase', 'COMPLETED')`,
                [userId, config.fees.joining_fee]
            );

            await client.query('COMMIT');

            // 7. Trigger Auto Pool Placement (Async)
            await getQueue().add('NEW_REGISTRATION', { nodeId });

            return { nodeId, referralCode, message: 'Node purchased successfully. Financial Distribution Initiated.' };

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async getUserNodes(userId: number) {
        const res = await query('SELECT * FROM Nodes WHERE owner_user_id = $1 ORDER BY created_at DESC', [userId]);
        return res.rows;
    }

    async getNodeStats(nodeId: number) {
        const nodeRes = await query('SELECT * FROM Nodes WHERE id = $1', [nodeId]);
        if (nodeRes.rows.length === 0) throw new Error('Node not found');
        const node = nodeRes.rows[0];

        // Self Pool Count (Children in Self Pool Tree)
        const selfPoolRes = await query('SELECT COUNT(*) as count FROM Nodes WHERE self_pool_parent_id = $1', [nodeId]);
        const selfPoolCount = parseInt(selfPoolRes.rows[0].count);

        // Auto Pool Count (Children in Auto Pool Tree)
        const autoPoolRes = await query('SELECT COUNT(*) as count FROM Nodes WHERE auto_pool_parent_id = $1', [nodeId]);
        const autoPoolCount = parseInt(autoPoolRes.rows[0].count);

        return {
            id: node.id,
            referralCode: node.referral_code,
            status: node.status,
            walletBalance: node.wallet_balance, // "Local Node Wallet" locked asset
            selfPoolTeam: selfPoolCount,
            autoPoolTeam: autoPoolCount
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
                // Fallback or error? For now, fallback to generic Root if Auto Root missing, or just keep current (but that defeats purpose)
                // Let's assume JSE-AUTO-ROOT exists as per seed. If not, try JSE-ROOT.
                const fallbackRes = await query("SELECT id FROM Nodes WHERE referral_code = 'JSE-ROOT'");
                if (fallbackRes.rows.length > 0) {
                    anchorNodeId = fallbackRes.rows[0].id;
                }
            }
        }

        // Recursive CTE to fetch 3 levels down
        const res = await query(
            `WITH RECURSIVE genealogy AS (
                SELECT 
                    id, referral_code, owner_user_id, sponsor_node_id, self_pool_parent_id, auto_pool_parent_id, 
                    direct_referrals_count, status, created_at, 
                    1 as level, 
                    CAST(id AS VARCHAR) as path
                FROM Nodes
                WHERE id = $1
                UNION ALL
                SELECT 
                    n.id, n.referral_code, n.owner_user_id, n.sponsor_node_id, n.self_pool_parent_id, n.auto_pool_parent_id, 
                    n.direct_referrals_count, n.status, n.created_at, 
                    g.level + 1,
                    CAST(g.path || '->' || n.id AS VARCHAR)
                FROM Nodes n
                INNER JOIN genealogy g ON n.${parentColumn} = g.id
                WHERE g.level < 4 
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
}
