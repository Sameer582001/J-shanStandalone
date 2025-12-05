import { query } from '../config/db.js';

export class WalletService {

    // Get Master Wallet Balance
    async getBalance(userId: number): Promise<number> {
        const res = await query('SELECT master_wallet_balance FROM Users WHERE id = $1', [userId]);
        if (res.rows.length === 0) {
            throw new Error('User not found');
        }
        return parseFloat(res.rows[0].master_wallet_balance);
    }

    // Add Funds (Mock/Admin)
    async addFunds(userId: number, amount: number) {
        if (amount <= 0) throw new Error('Amount must be positive');

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
        const balance = parseFloat(res.rows[0].master_wallet_balance);

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
}
