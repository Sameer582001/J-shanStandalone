
import { query } from '../config/db.js';
import { WalletService } from './WalletService.js';


const walletService = new WalletService();
// NodeService will be instantiated inside methods or passed to avoid circular dependency if possible.
// Or we accept we need it for Rebirths. 

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Config loaded lazily
const loadConfig = () => {
    const configPath = path.resolve(__dirname, '../config/plan_config.json');
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class FinancialService {
    public createdRebirthIds: number[] = [];

    private getConfig(level: number) {
        const lvlStr = level.toString();
        const config = loadConfig();
        const levelData = config.waterfall_levels[lvlStr];
        if (!levelData) throw new Error(`Invalid level configuration: ${level}`);

        // Calculate Total Expected Revenue for this level
        // Revenue = Layers * (Width^Layer) * Incoming PER NODE? 
        // Wait, 'incoming_per_node' is defined.
        // And 'layers' array defines which layers pay.
        // L1: Layer 1 pays. Count = 3^1 = 3. Total = 3 * 500 = 1500.
        // L2: Layer 2 pays to you? If 3x10, L2 has 9 nodes. 9 * 1000 = 9000.
        // Total Required matches 1500 and 9000 in previous static config.

        // 40. Construct buckets from config
        // The config file structure has changed to use a 'buckets' array directly.
        // We should use that if available, otherwise fallback (or just error out if schema is strict).

        let buckets = [];
        if (levelData.buckets && Array.isArray(levelData.buckets)) {
            buckets = levelData.buckets;
        } else {
            // Fallback for old schema (if any)
            buckets = [
                { name: 'upgrade', amount: levelData.upgrade_fee || 0, priority: 1 },
                { name: 'rebirth', amount: (levelData.rebirth?.cost || 0) * (levelData.rebirth?.count || 0), priority: 2 },
                { name: 'system', amount: levelData.system_fee || 0, priority: 3 },
                { name: 'upline', amount: levelData.upline_share || 0, priority: 4 },
                { name: 'gifts', amount: levelData.gifts || 0, priority: 5 },
            ];
        }

        // Calculate Total Revenue
        const width = config.matrix.width;
        let totalNodes = 0;

        if (levelData.layers && Array.isArray(levelData.layers)) {
            totalNodes = levelData.layers.reduce((sum: number, layerDepth: number) => {
                return sum + Math.pow(width, layerDepth);
            }, 0);
        } else {
            totalNodes = Math.pow(width, level);
        }

        const totalRequired = totalNodes * levelData.incoming_per_node;

        // Calculate expected profit based on definitions
        // (Just for internal validation, really we just pass the buckets back)

        // Special Case: Level 4 "Gifts". 
        // If profit is massive (e.g. L4), previous code split it.
        // For dynamic refactor, let's keep it simple: Everything else is Profit.

        // Calculate Profit Bucket
        const committed = buckets.reduce((acc: number, b: any) => acc + b.amount, 0);
        const profit = totalRequired - committed;

        if (profit > 0) {
            buckets.push({ name: 'profit', amount: profit, priority: 100 });
        }

        console.log(`[DEBUG] getConfig Level ${level}: Expected Revenue ${totalRequired}. Buckets:`, buckets);

        return { buckets, totalRequired };
    }

    /**
     * Core Waterfall Engine
     * @param nodeId The node receiving the income
     * @param amount The incoming amount (e.g., 500)
     * @param level The level for which this income is destined (e.g. Level 1 income)
     * @param client Database client for transaction
     */
    async processIncome(nodeId: number, amount: number, level: number, poolType: 'SELF' | 'AUTO', client: any, depth: number = 0) {
        if (!client) throw new Error('Transaction client required');
        const q = client.query.bind(client);

        // 1. Get or Init Level Progress
        let progress = await this.getLevelProgress(nodeId, level, poolType, client);

        // 2. Add to Revenue
        const newRevenue = Number(progress.total_revenue) + amount;

        let remaining = amount;

        // 3. Process Buckets (Calculate & Update State FIRST)
        const buckets = progress.buckets || {};
        const config = this.getConfig(level);
        if (!config) throw new Error(`Invalid level configuration: ${level}`);

        const actions: { bucketName: string, fillAmount: number }[] = [];

        for (const bucket of config.buckets) {
            if (remaining <= 0) break;
            if (bucket.amount === 0) continue;

            const currentFilled = Number(buckets[bucket.name] || 0);
            const target = bucket.amount;

            if (currentFilled >= target) continue;

            const spaceRemaining = target - currentFilled;
            const fillAmount = Math.min(remaining, spaceRemaining);

            // Update State (In-Memory)
            const newFilled = currentFilled + fillAmount;
            buckets[bucket.name] = newFilled;
            remaining -= fillAmount;

            // ATOMIC PAYOUT LOGIC:
            // Only trigger action if the bucket JUST completed (reached target).
            // We verify this because valid buckets pass the `if (currentFilled >= target) continue` check above.
            if (newFilled >= target && fillAmount > 0) {
                console.log(`[DEBUG] Bucket ${bucket.name} Completed! Queueing Full Action: ${target}`);
                // Payout the FULL target amount in one go
                // This ensures "Gold Upline" is 1000 in one transaction, not 4x250.
                actions.push({ bucketName: bucket.name, fillAmount: target });
            } else {
                console.log(`[DEBUG] Bucket ${bucket.name} Filling... (${newFilled}/${target}). Deferring Payout.`);
            }
        }

        console.log(`[DEBUG] Actions to Execute:`, actions);

        // 4. Update Progress Record (COMMIT STATE BEFORE SIDE EFFECTS)
        // This prevents infinite recursion where re-entrant calls see old empty buckets
        await q(
            `UPDATE LevelProgress 
             SET total_revenue = $1, buckets = $2, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $3`,
            [newRevenue, JSON.stringify(buckets), progress.id]
        );

        // 5. Execute Side Effects
        for (const action of actions) {
            await this.executeBucketAction(nodeId, action.bucketName, action.fillAmount, level, poolType, client, depth);
        }

        // 6. Check Completion
        if (newRevenue >= config.totalRequired) {
            // Level Complete!
            await q('UPDATE LevelProgress SET is_completed = TRUE WHERE id = $1', [progress.id]);

            const levelCol = 'current_level'; // Temp
            const nodeCheck = await q(`SELECT ${levelCol} as current_level FROM Nodes WHERE id = $1`, [nodeId]);
            const currentLevel = nodeCheck.rows[0].current_level;

            if (currentLevel <= level) {
                await q(`UPDATE Nodes SET ${levelCol} = $1 WHERE id = $2`, [level + 1, nodeId]);
            }
        }
    }

    private async executeBucketAction(nodeId: number, bucketName: string, amount: number, level: number, poolType: 'SELF' | 'AUTO', client: any, depth: number) {
        const q = client.query.bind(client);

        // Fetch Node Info (for owner/upline/rebirth status)
        const nodeRes = await q('SELECT * FROM Nodes WHERE id = $1', [nodeId]);
        const node = nodeRes.rows[0];

        switch (bucketName) {
            case 'upgrade': {
                // Custom Upgrade Logic (L1->2nd Upline, L2->5th Upline, etc.)
                const upgradeConfig = loadConfig();
                // We need the config for the CURRENT level to know the "Upgrade Rules"
                // But usually, upgrades pay into the "Next Level".
                // Wait, if I am L1 upgrading to L2, I pay L2 fee.
                // Does 'upgrade_depth' live on Level 1 config or Level 2 config?
                // Spec: "Silver Level... 1000 passed to 2nd upline".
                // So Silver (L1) defines the rule: "When upgrading, pay 2nd upline".
                // My plan_config has 'upgrade_depth' on the CURRENT level. Correct.

                const levelConfig = upgradeConfig.waterfall_levels[level.toString()];
                const targetUplineDepth = levelConfig.upgrade_depth || (level + 1); // Fallback to L+1 if undefined

                // Identify Target Upline
                const targetUplineId = await this.findUpline(nodeId, targetUplineDepth, poolType, client);

                if (targetUplineId) {
                    await this.processIncome(targetUplineId, amount, level + 1, poolType, client, depth);
                } else {
                    // No upline found (Root case or detached). System Profit?
                    // console.log(`[Financial] No upline found for L${level} Upgrade. Amount: ${amount}`);
                }
                break;
            }

            case 'upline':
                // Commission Split (50/50 Parent/Grandparent)
                // L1: 200 (100/100)
                await this.distributeUplineCommission(nodeId, node.referral_code, amount, poolType, client);
                break;

            case 'profit':
                // Wallet Profit (Goes to NODE WALLET)
                // Sterile Rule: If Rebirth, goes to Origin Node's Wallet
                const targetNodeId = node.is_rebirth ? node.origin_node_id : nodeId;

                if (node.is_rebirth && !targetNodeId) {
                    throw new Error(`Rebirth Node ${nodeId} missing origin_node_id`);
                }

                const profitConfig = loadConfig();
                const levelName = profitConfig.waterfall_levels[level.toString()]?.name || `Level ${level}`;
                await walletService.creditNodeWallet(targetNodeId!, amount, `${levelName} (${poolType}) Profit from Node ${node.referral_code}`, client);
                break;

            case 'rebirth':
                // Auto-Creation
                // If Rebirth Node: "Deduct fee but keep as System Profit" (Sterile).
                if (node.is_rebirth) {
                    // Burn/System Profit
                    const adminId = 1;
                    if (amount > 0) {
                        await walletService.creditFunds(adminId, amount, `System Profit from Sterile Rebirth Node ${node.referral_code}`, client);
                    }
                } else {
                    // Create Rebirths
                    // We need to calculate how many based on amount?
                    // E.g. L2 Rebirth is 1000 total (2 IDs). 
                    // Let's assume unit price 500.
                    const count = Math.floor(amount / 500);

                    if (count > 0) {
                        await this.spawnRebirths(nodeId, count, poolType, client, depth);
                    }
                }
                break;

            case 'system':
                // Credit Admin (User 1)
                // We assume User 1 is the system admin.
                // In a real system, we might query WHERE role='ADMIN'.
                const adminId = 1;
                if (amount > 0) {
                    await walletService.creditFunds(adminId, amount, `System Fee from Node ${node.referral_code} (Level ${level})`, client);
                }
                break;

            case 'gifts':
                // Gifts are physical rewards given by Admin (not cash to user).
                // The money is deducted and sent to the System/Admin to fund the gift purchase.
                const systemDistId = 1; // Admin User ID
                if (amount > 0) {
                    await walletService.creditFunds(systemDistId, amount, `Level ${level} Gift Fund Deduction from Node ${node.referral_code}`, client);
                }
                break;

            case 'profit':
                // Profit goes to the Node's Wallet
                if (amount > 0) {
                    await walletService.creditNodeWallet(nodeId, amount, `Level ${level} (${poolType}) Profit`, client);
                }
                break;
        }
    }

    // --- Helpers ---

    private async getLevelProgress(nodeId: number, level: number, poolType: 'SELF' | 'AUTO', client: any) {
        const q = client.query.bind(client);
        const res = await q('SELECT * FROM LevelProgress WHERE node_id = $1 AND level = $2 AND pool_type = $3', [nodeId, level, poolType]);
        if (res.rows.length > 0) return res.rows[0];

        // Create if not exists
        const insert = await q(
            'INSERT INTO LevelProgress (node_id, level, pool_type) VALUES ($1, $2, $3) RETURNING *',
            [nodeId, level, poolType]
        );
        return insert.rows[0];
    }

    private async passUpUpgradeFee(fromNodeId: number, amount: number, targetLevel: number, poolType: 'SELF' | 'AUTO', client: any, depth: number) {
        // Logic: Level 2 Fee (targetLevel 2) goes to 2nd Upline.
        // Level 3 Fee goes to 3rd Upline.
        // Target Upline Index = targetLevel.

        // IMPORTANT: The upline definition depends on poolType.
        // SELF -> Use Self Pool Tree.
        // AUTO -> Use Auto Pool Tree.
        const uplineId = await this.findUpline(fromNodeId, targetLevel, poolType, client);

        if (uplineId) {
            // Recursive Pass-Up
            // The 2nd Upline receives this as "Level 2 Income" in the SAME POOL.
            await this.processIncome(uplineId, amount, targetLevel, poolType, client, depth);
        } else {
            // No upline (e.g. Root), goes to System?
        }
    }

    private async findUpline(nodeId: number, generations: number, poolType: 'SELF' | 'AUTO', client: any): Promise<number | null> {
        const q = client.query.bind(client);
        let currentId = nodeId;
        const parentCol = poolType === 'AUTO' ? 'auto_pool_parent_id' : 'self_pool_parent_id';

        for (let i = 0; i < generations; i++) {
            const res = await q(`SELECT ${parentCol} FROM Nodes WHERE id = $1`, [currentId]);
            if (res.rows.length === 0 || !res.rows[0][parentCol]) return null;
            currentId = res.rows[0][parentCol];
        }
        return currentId;
    }

    private async distributeUplineCommission(nodeId: number, sourceCode: string, amount: number, poolType: 'SELF' | 'AUTO', client: any) {
        // As per user clarification: Parent = Direct Referrer (Sponsor), Grandparent = Sponsor's Sponsor.
        // This applies regardless of poolType.
        const parent = await this.findSponsor(nodeId, 1, client);
        const grandparent = await this.findSponsor(nodeId, 2, client);

        const split = amount / 2;

        if (parent) await this.creditCommission(parent, split, `Upline Comm (Parent) - ${poolType} from Node ${sourceCode}`, client);
        if (grandparent) await this.creditCommission(grandparent, split, `Upline Comm (GP) - ${poolType} from Node ${sourceCode}`, client);
    }

    private async findSponsor(nodeId: number, generations: number, client: any): Promise<number | null> {
        const q = client.query.bind(client);
        let currentId = nodeId;

        for (let i = 0; i < generations; i++) {
            const res = await q('SELECT sponsor_node_id FROM Nodes WHERE id = $1', [currentId]);
            if (res.rows.length === 0 || !res.rows[0].sponsor_node_id) return null;
            currentId = res.rows[0].sponsor_node_id;
        }
        return currentId;
    }

    private async creditCommission(nodeId: number, amount: number, desc: string, client: any) {
        // Commission goes to the Upline Node's WALLET, not the User's Master Wallet
        await walletService.creditNodeWallet(nodeId, amount, desc, client);
    }

    private async getOriginOwner(originNodeId: number, client: any) {
        const q = client.query.bind(client);
        const res = await q('SELECT owner_user_id FROM Nodes WHERE id = $1', [originNodeId]);
        return res.rows[0]?.owner_user_id; // Validation needed?
    }

    private async spawnRebirths(originalNodeId: number, count: number, poolType: 'SELF' | 'AUTO', client: any, depth: number) {
        const q = client.query.bind(client);
        const nodeRes = await q('SELECT owner_user_id FROM Nodes WHERE id = $1', [originalNodeId]);
        const ownerId = nodeRes.rows[0].owner_user_id;

        for (let i = 0; i < count; i++) {
            const refCode = `RB-${poolType}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

            let selfParentId = null;
            let autoParentId = null;

            if (poolType === 'SELF') {
                console.log(`[DEBUG] Finding Lock Placement (SELF) for ${originalNodeId}...`);
                // LOCK & PLACE in Self Pool
                selfParentId = await this.findPlacementWithLock(originalNodeId, 'SELF', client);
            } else {
                console.log(`[DEBUG] Finding Lock Placement (AUTO)...`);
                // LOCK & PLACE in Auto Pool
                autoParentId = await this.findPlacementWithLock(null, 'AUTO', client);
            }

            console.log(`[DEBUG] Inserting Rebirth Node ${refCode}...`);
            // Insert with CONFIRMED parent (No orphans)
            const insertRes = await q(
                `INSERT INTO Nodes (referral_code, owner_user_id, sponsor_node_id, self_pool_parent_id, auto_pool_parent_id, status, wallet_balance, is_rebirth, origin_node_id)
                 VALUES ($1, $2, $3, $4, $5, 'ACTIVE', 0.00, TRUE, $6) RETURNING id`,
                [refCode, ownerId, originalNodeId, selfParentId, autoParentId, originalNodeId]
            );
            const newNodeId = insertRes.rows[0].id;

            console.log(`[DEBUG] Distributing Comm for Rebirth ${newNodeId}... (Depth ${depth})`);
            // RECURSIVE DISTRIBUTION (Synchronous)
            await this.distributeNewNodeCommissions(newNodeId, poolType, client, depth + 1);
        }
    }

    private async findPlacementWithLock(rootId: number | null, type: 'SELF' | 'AUTO', client: any): Promise<number> {
        const q = client.query.bind(client);
        let startNodeId = rootId;

        if (type === 'AUTO') {
            const rootRes = await q("SELECT id FROM Nodes WHERE referral_code = 'JSE-ROOT'");
            if (rootRes.rows.length > 0) startNodeId = rootRes.rows[0].id;
            else {
                const altRes = await q("SELECT id FROM Nodes WHERE referral_code = 'JSE-AUTO-ROOT'");
                if (altRes.rows.length > 0) startNodeId = altRes.rows[0].id;
                else throw new Error("No Global Root found for Auto Pool Rebirth");
            }
        }

        if (!startNodeId) throw new Error("Invalid Root for Placement");

        const queue = [startNodeId];
        const parentCol = type === 'AUTO' ? 'auto_pool_parent_id' : 'self_pool_parent_id';

        while (queue.length > 0) {
            const currentId = queue.shift()!;

            // LOCK PARENT ROW
            await q('SELECT id FROM Nodes WHERE id = $1 FOR UPDATE', [currentId]);

            const res = await q(`SELECT COUNT(*) as count FROM Nodes WHERE ${parentCol} = $1`, [currentId]);
            const count = parseInt(res.rows[0].count);

            if (count < 3) return currentId;

            const childrenRes = await q(`SELECT id FROM Nodes WHERE ${parentCol} = $1 ORDER BY created_at ASC, id ASC`, [currentId]);
            for (const row of childrenRes.rows) queue.push(row.id);
        }
        throw new Error('Placement failed: Tree is full or infinite loop detected');
    }

    /**
     * Distributes entry fee when a new node is added.
     * CRITICAL: Each node pays ONLY ₹500 to its immediate parent (Gen 1) for Silver level.
     * The upgrade cascade (Silver→Gold→Platinum→Diamond) handles all upward flow automatically.
     * 
     * @param newNodeId The new node ID
     * @param poolType 'SELF' or 'AUTO'
     * @param client Database client
     */
    async distributeNewNodeCommissions(newNodeId: number, poolType: 'SELF' | 'AUTO', client: any, depth: number = 0) {
        if (!client) throw new Error('Client required');

        console.error(`[DEBUG] Distribute Entry Fee for Node ${newNodeId} (${poolType})`);

        // Every node entry pays ₹500 to immediate parent for Silver level (Level 1)
        // The rest flows naturally through upgrade cascade:
        // Silver complete → pays to 2nd upline (Gold)
        // Gold complete → pays to 5th upline (Platinum)
        // Platinum complete → pays to 9th upline (Diamond)

        const immediateParent = await this.findUpline(newNodeId, 1, poolType, client);

        if (immediateParent) {
            // Credit ₹500 to parent's Silver level (Level 1) bucket
            await this.processIncome(immediateParent, 500, 1, poolType, client, depth + 1);
        } else {
            // No parent found (root node case) - entry fee goes to system
            console.error(`[Financial] No parent found for Node ${newNodeId}. Entry fee absorbed by system.`);
        }
    }
}
