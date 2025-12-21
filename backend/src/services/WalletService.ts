import { query } from '../config/db.js';

export class WalletService {

    // Get Master Wallet Balance
    async getBalance(userId: number): Promise<number> {
        const res = await query('SELECT master_wallet_balance FROM Users WHERE id = $1', [userId]);
        if (res.rows.length === 0) {
            throw new Error('User not found');
        }
        const val = parseFloat(res.rows[0].master_wallet_balance);
        return isNaN(val) ? 0 : val;
    }

    // Add Funds (Mock/Admin)
    async addFunds(userId: number, amount: number) {
        if (amount < 100) throw new Error('Minimum amount to add is ₹100');

        await query('BEGIN');
        try {
            await query('UPDATE Users SET master_wallet_balance = master_wallet_balance + $1 WHERE id = $2', [amount, userId]);

            // Log Transaction (Assuming Transactions table exists and has wallet_owner_id)
            await query(
                `INSERT INTO Transactions (wallet_owner_id, amount, type, description, status) 
                 VALUES ($1, $2, 'CREDIT', 'Added Funds', 'COMPLETED')`,
                [userId, amount]
            );

            await query('COMMIT');
            return { message: 'Funds added successfully' };
        } catch (error) {
            await query('ROLLBACK');
            throw error;
        }
    }

    // Deduct Funds (Internal Helper)
    async deductFunds(userId: number, amount: number, client: any = null) {
        const q = client ? client.query.bind(client) : query;

        const res = await q('SELECT master_wallet_balance FROM Users WHERE id = $1 FOR UPDATE', [userId]);
        const rawBalance = res.rows[0].master_wallet_balance;
        let balance = parseFloat(rawBalance);
        if (isNaN(balance)) balance = 0;

        if (balance < amount) {
            throw new Error('Insufficient funds');
        }

        await q('UPDATE Users SET master_wallet_balance = master_wallet_balance - $1 WHERE id = $2', [amount, userId]);
    }

    // Credit Funds (Internal Helper)
    async creditFunds(userId: number, amount: number, description: string, client: any = null) {
        const q = client ? client.query.bind(client) : query;

        await q('UPDATE Users SET master_wallet_balance = master_wallet_balance + $1 WHERE id = $2', [amount, userId]);

        await q(
            `INSERT INTO Transactions (wallet_owner_id, amount, type, description, status) 
             VALUES ($1, $2, 'CREDIT', $3, 'COMPLETED')`,
            [userId, amount, description]
        );
    }


    async creditNodeWallet(nodeId: number, amount: number, description: string, client: any = null) {
        const q = client ? client.query.bind(client) : query;

        // 1. Get Node Details (Check if Rebirth)
        const nodeRes = await q('SELECT id, referral_code, is_rebirth, origin_node_id, owner_user_id FROM Nodes WHERE id = $1', [nodeId]);
        if (nodeRes.rows.length === 0) throw new Error(`Node ${nodeId} not found`);

        const node = nodeRes.rows[0];
        let targetNodeId = nodeId;
        let finalDesc = description;

        // INCOME REDIRECTION LOGIC:
        // If this is a Rebirth Node, all income goes to the Mother (Origin) Node.
        if (node.is_rebirth) {
            if (!node.origin_node_id) throw new Error(`Rebirth Node ${nodeId} missing origin_node_id`);

            targetNodeId = node.origin_node_id;
            finalDesc = `${description} (via Rebirth Node ${node.referral_code})`;

            // Verify Origin Node exists
            const originRes = await q('SELECT id, owner_user_id FROM Nodes WHERE id = $1', [targetNodeId]);
            if (originRes.rows.length === 0) throw new Error(`Origin Node ${targetNodeId} not found`);
        }

        // 2. Update Target Node Balance
        await q('UPDATE Nodes SET wallet_balance = wallet_balance + $1 WHERE id = $2', [amount, targetNodeId]);

        // 3. Log Transaction
        // We log it under the OWNER of the Target Node (which should be the same owner, but let's be safe)
        const ownerRes = await q('SELECT owner_user_id FROM Nodes WHERE id = $1', [targetNodeId]);
        const ownerId = ownerRes.rows[0].owner_user_id;

        await q(
            `INSERT INTO Transactions (wallet_owner_id, node_id, amount, type, description, status) 
             VALUES ($1, $2, $3, 'CREDIT', $4, 'COMPLETED')`,
            [ownerId, targetNodeId, amount, finalDesc]
        );
    }

    async getUserDashboardStats(userId: number) {
        // 1. Wallet Balance
        const userRes = await query('SELECT master_wallet_balance FROM Users WHERE id = $1', [userId]);
        const rawBalance = userRes.rows[0].master_wallet_balance;
        let walletBalance = parseFloat(rawBalance);
        if (isNaN(walletBalance)) walletBalance = 0;

        // 2. Total Earnings (Sum of CREDIT transactions)
        // Use COALESCE to handle NULL case if no transactions exist
        const earningsRes = await query(
            "SELECT COALESCE(SUM(amount), 0) as total FROM Transactions WHERE wallet_owner_id = $1 AND type = 'CREDIT'",
            [userId]
        );
        const totalEarnings = parseFloat(earningsRes.rows[0].total);

        // 3. Total Nodes Owned
        const nodesRes = await query('SELECT COUNT(*) as count FROM Nodes WHERE owner_user_id = $1', [userId]);
        const totalNodesOwned = parseInt(nodesRes.rows[0].count);

        // 4. Direct Referrals (Count of Users whose nodes were sponsored by ANY of this user's nodes)
        // Logic: Find all nodes owned by this user. Then count nodes sponsored by those nodes. 
        // OR distinct users? Spec says "Direct Referrals" usually means users.
        const referralRes = await query(
            `SELECT COUNT(DISTINCT n.owner_user_id) as count 
             FROM Nodes n 
             JOIN Nodes sponsor ON n.sponsor_node_id = sponsor.id 
             WHERE sponsor.owner_user_id = $1`,
            [userId]
        );
        const directReferrals = parseInt(referralRes.rows[0].count);

        return {
            walletBalance,
            totalEarnings,
            totalNodesOwned,
            directReferrals
        };
    }

    // Get Recent Transactions
    // Get Recent Transactions (Master Wallet)
    async getRecentTransactions(userId: number, limit: number = 20, offset: number = 0) {
        const res = await query(
            `SELECT * FROM Transactions 
             WHERE wallet_owner_id = $1 AND node_id IS NULL
             ORDER BY created_at DESC 
             LIMIT $2 OFFSET $3`,
            [userId, limit, offset]
        );
        return res.rows;
    }

    // Get Transactions for a specific Node
    async getNodeTransactions(nodeId: number, limit: number = 20, offset: number = 0) {
        const res = await query(
            `SELECT * FROM Transactions 
             WHERE node_id = $1 
             ORDER BY created_at DESC 
             LIMIT $2 OFFSET $3`,
            [nodeId, limit, offset]
        );
        return res.rows;
    }

    // --- Payout System ---

    // 1. Request Payout
    async requestPayout(userId: number, amount: number) {
        // 1. Check Bank Details
        const userRes = await query('SELECT account_number FROM Users WHERE id = $1', [userId]);
        if (!userRes.rows[0]?.account_number) {
            throw new Error('Bank details not found. Please complete your profile first.');
        }

        if (amount < 500) throw new Error('Minimum withdrawal amount is ₹500');

        const serviceCharge = amount * 0.05;
        const tdsCharge = amount * 0.05;
        const netAmount = amount - serviceCharge - tdsCharge;

        await query('BEGIN');
        try {
            // Check & Deduct Funds
            await this.deductFunds(userId, amount);

            // 1. Create Transaction Record FIRST to get ID
            const txnRes = await query(
                `INSERT INTO Transactions (wallet_owner_id, amount, type, description, status) 
                 VALUES ($1, $2, 'DEBIT', 'Payout Request', 'PENDING') RETURNING id`,
                [userId, amount]
            );
            const transactionId = txnRes.rows[0].id;

            // 2. Create Withdrawal Record Linked to Transaction
            await query(
                `INSERT INTO Withdrawals (user_id, amount, service_charge, tds_charge, net_amount, status, transaction_id) 
                 VALUES ($1, $2, $3, $4, $5, 'PENDING', $6)`,
                [userId, amount, serviceCharge, tdsCharge, netAmount, transactionId]
            );

            await query('COMMIT');
            return { message: 'Payout requested successfully' };
        } catch (error) {
            await query('ROLLBACK');
            throw error;
        }
    }

    // 2. Get User Payout History
    async getPayouts(userId: number) {
        const res = await query('SELECT * FROM Withdrawals WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
        return res.rows;
    }

    // 3. Admin: Get All Payouts
    async getAllPayouts(status: string = 'PENDING') {
        let condition = 'w.status = $1';
        let params = [status];

        // Special flag for History
        if (status === 'HISTORY') {
            condition = "w.status IN ('PAID', 'REJECTED')";
            params = [];
        }

        const res = await query(
            `SELECT w.*, u.full_name, u.mobile, u.email,
                    u.account_holder_name, u.account_number, u.ifsc_code, u.bank_name
             FROM Withdrawals w 
             JOIN Users u ON w.user_id = u.id 
             WHERE ${condition} 
             ORDER BY w.created_at DESC`, // Sort by newest first
            params
        );
        return res.rows;
    }

    // 4. Admin: Process Payout
    async processPayout(payoutId: number, status: 'PAID' | 'REJECTED', adminNote: string = '') {
        await query('BEGIN');
        try {
            // Get Payout Record
            const res = await query('SELECT * FROM Withdrawals WHERE id = $1 FOR UPDATE', [payoutId]);
            if (res.rows.length === 0) throw new Error('Payout not found');
            const payout = res.rows[0];

            if (payout.status !== 'PENDING') throw new Error('Payout already processed');

            // Update Status
            await query(
                'UPDATE Withdrawals SET status = $1, admin_note = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
                [status, adminNote, payoutId]
            );

            if (status === 'REJECTED') {
                // Refund User (Credit Transaction)
                await this.creditFunds(payout.user_id, parseFloat(payout.amount), 'Payout Rejected Refund');

                // Update Original Transaction to REJECTED
                if (payout.transaction_id) {
                    await query("UPDATE Transactions SET status = 'REJECTED' WHERE id = $1", [payout.transaction_id]);
                }
            } else {
                // PAID: Update Original Transaction to COMPLETED
                if (payout.transaction_id) {
                    await query("UPDATE Transactions SET status = 'COMPLETED' WHERE id = $1", [payout.transaction_id]);
                }
            }

            await query('COMMIT');
            return { message: `Payout marked as ${status}` };
        } catch (error) {
            await query('ROLLBACK');
            throw error;
        }
    }
    // 5. Node to Master Transfer
    async transferNodeToMaster(userId: number, nodeId: number, amount: number) {
        if (amount <= 0) throw new Error('Invalid amount');

        await query('BEGIN');
        try {
            // 1. Verify Node Ownership & Eligibility
            const nodeRes = await query('SELECT * FROM Nodes WHERE id = $1 AND owner_user_id = $2 FOR UPDATE', [nodeId, userId]);
            if (nodeRes.rows.length === 0) throw new Error('Node not found or access denied');

            const node = nodeRes.rows[0];

            // Check Eligibility (3 Direct Referrals)
            if (node.direct_referrals_count < 3) {
                throw new Error(`Eligibility failed: Need 3 direct referrals, currently have ${node.direct_referrals_count}`);
            }

            // Check Balance
            const currentBalance = parseFloat(node.wallet_balance);
            if (currentBalance < amount) {
                throw new Error('Insufficient node wallet balance');
            }

            // 2. Debit Node Wallet
            await query('UPDATE Nodes SET wallet_balance = wallet_balance - $1 WHERE id = $2', [amount, nodeId]);

            // 3. Credit Master Wallet
            await query('UPDATE Users SET master_wallet_balance = master_wallet_balance + $1 WHERE id = $2', [amount, userId]);

            // 4. Log Transaction (Debit from Node)
            await query(
                `INSERT INTO Transactions (wallet_owner_id, node_id, amount, type, description, status) 
                 VALUES ($1, $2, $3, 'DEBIT', 'Transfer to Master Wallet', 'COMPLETED')`,
                [userId, nodeId, amount]
            );

            // 5. Log Transaction (Credit to Master)
            await query(
                `INSERT INTO Transactions (wallet_owner_id, amount, type, description, status) 
                 VALUES ($1, $2, 'CREDIT', $3, 'COMPLETED')`,
                [userId, amount, `Transfer from Node ${node.referral_code}`]
            );

            await query('COMMIT');
            return { message: 'Transfer successful' };
        } catch (error) {
            await query('ROLLBACK');
            throw error;
        }
    }
}
