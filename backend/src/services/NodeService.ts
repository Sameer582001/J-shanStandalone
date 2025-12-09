import { query } from '../config/db.js';
import { WalletService } from './WalletService.js';
import { Queue } from 'bullmq';

const walletService = new WalletService();

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
    private async findSelfPoolPlacement(sponsorNodeId: number): Promise<{ parentId: number | null }> {
        if (!sponsorNodeId) return { parentId: null };

        const queue = [sponsorNodeId];

        while (queue.length > 0) {
            const currentId = queue.shift()!;

            // Check how many children this node has in Self Pool
            const res = await query('SELECT COUNT(*) as count FROM Nodes WHERE self_pool_parent_id = $1', [currentId]);
            const count = parseInt(res.rows[0].count);

            if (count < 3) {
                return { parentId: currentId };
            }

            // If full, add children to queue to search next level
            const childrenRes = await query('SELECT id FROM Nodes WHERE self_pool_parent_id = $1 ORDER BY created_at ASC', [currentId]);
            for (const row of childrenRes.rows) {
                queue.push(row.id);
            }
        }

        throw new Error('Placement failed: Tree is full or infinite loop detected');
    }

    async purchaseNode(userId: number, sponsorCode: string) {
        const NODE_PRICE = 1750;

        // 1. Validate Sponsor
        const sponsorRes = await query('SELECT id, owner_user_id FROM Nodes WHERE referral_code = $1', [sponsorCode]);
        if (sponsorRes.rows.length === 0) {
            throw new Error('Invalid Sponsor Code');
        }
        const sponsorNodeId = sponsorRes.rows[0].id;
        const sponsorUserId = sponsorRes.rows[0].owner_user_id;

        // 2. Check Balance & Deduct Funds
        try {
            await walletService.deductFunds(userId, NODE_PRICE);

            // 3. Distribute Funds (Simplify for now, detailed split in spec)
            // Credit Sponsor Bonus directly to the Sponsor Node's Wallet
            // 3. Credit Sponsor Bonus & Update Referral Logic
            await walletService.creditNodeWallet(sponsorNodeId, 250, 'Sponsor Bonus for new Node');

            // Increment Direct Referrals Count for Sponsor
            await query(
                'UPDATE Nodes SET direct_referrals_count = direct_referrals_count + 1 WHERE id = $1',
                [sponsorNodeId]
            );

            // Check if Sponsor should become ACTIVE (3 Referrals Condition)
            const sponsorCheck = await query('SELECT direct_referrals_count, status FROM Nodes WHERE id = $1', [sponsorNodeId]);
            if (sponsorCheck.rows[0].direct_referrals_count >= 3 && sponsorCheck.rows[0].status === 'INACTIVE') {
                await query("UPDATE Nodes SET status = 'ACTIVE' WHERE id = $1", [sponsorNodeId]);
            }

            // 4. Find Placement (Self Pool)
            const { parentId: selfPoolParentId } = await this.findSelfPoolPlacement(sponsorNodeId);

            // 5. Create Node
            // Note: auto_pool_parent_id is NULL explicitly, will be set by Worker
            const referralCode = `JSE-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
            const nodeRes = await query(
                `INSERT INTO Nodes (referral_code, owner_user_id, sponsor_node_id, self_pool_parent_id, auto_pool_parent_id, status, wallet_balance)
                 VALUES ($1, $2, $3, $4, NULL, 'INACTIVE', 0.00) RETURNING id`,
                [referralCode, userId, sponsorNodeId, selfPoolParentId]
            );
            const nodeId = nodeRes.rows[0].id;

            // 6. Log Transaction
            await query(
                `INSERT INTO Transactions (wallet_owner_id, amount, type, description, status) 
                 VALUES ($1, $2, 'DEBIT', 'Node Purchase', 'COMPLETED')`,
                [userId, NODE_PRICE]
            );

            // 7. Trigger Auto Pool Placement (Async)
            await getQueue().add('NEW_REGISTRATION', { nodeId });

            return { nodeId, referralCode, message: 'Node purchased successfully. Auto Pool placement in progress.' };

        } catch (error) {
            throw error;
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
}
