import dotenv from 'dotenv';
import pg from 'pg';
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: process.env.POSTGRES_PORT,
});

async function analyzeCredits() {
    const client = await pool.connect();
    try {
        // First, find the user with the most credits
        console.log("=== Finding User with Most Credits ===\n");
        const topUser = await client.query(`
            SELECT t.wallet_owner_id, u.full_name, u.master_wallet_balance::text, COUNT(*) as tx_count, SUM(t.amount)::text as total
            FROM Transactions t
            JOIN Users u ON t.wallet_owner_id = u.id
            WHERE t.type = 'CREDIT'
            GROUP BY t.wallet_owner_id, u.full_name, u.master_wallet_balance
            ORDER BY SUM(t.amount) DESC
            LIMIT 1
        `);

        if (topUser.rows.length === 0) {
            console.log("No credit transactions found");
            return;
        }

        const userId = topUser.rows[0].wallet_owner_id;
        console.log(`User ID: ${userId} (${topUser.rows[0].full_name})`);
        console.log(`Master Wallet Balance: ₹${topUser.rows[0].master_wallet_balance}`);
        console.log(`Total Credits: ₹${topUser.rows[0].total} from ${topUser.rows[0].tx_count} transactions\n`);

        // Get ALL CREDIT transactions for this user
        console.log("=== ALL CREDIT Transactions (One Per Line) ===\n");
        const allCredits = await client.query(`
            SELECT t.id, t.amount::text as amt, t.description
            FROM Transactions t
            WHERE t.wallet_owner_id = $1 AND t.type = 'CREDIT'
            ORDER BY t.created_at ASC
        `, [userId]);

        console.log(`Total Credit Transactions: ${allCredits.rows.length}\n`);
        allCredits.rows.forEach((row, idx) => {
            console.log(`${idx + 1}. ID:${row.id} | ₹${row.amt} | ${row.description}`);
        });

        // Group by description
        console.log("\n=== Grouped by Description ===\n");
        const grouped = await client.query(`
            SELECT description, COUNT(*) as count, SUM(amount)::text as total
            FROM Transactions
            WHERE wallet_owner_id = $1 AND type = 'CREDIT'
            GROUP BY description
            ORDER BY description
        `, [userId]);

        grouped.rows.forEach(row => {
            console.log(`"${row.description}" | Count: ${row.count} | Total: ₹${row.total}`);
        });

    } catch (error) {
        console.error("Error:", error);
    } finally {
        client.release();
        await pool.end();
    }
}

analyzeCredits();
