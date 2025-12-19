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

async function debugWallet() {
    const client = await pool.connect();
    try {
        console.log("=== Recent Transactions (Last 30) ===\n");
        const txns = await client.query(`
            SELECT t.id, t.wallet_owner_id, t.node_id, t.amount::text, t.type, t.description, to_char(t.created_at, 'YYYY-MM-DD HH24:MI:SS') as created
            FROM Transactions t
            ORDER BY t.created_at DESC 
            LIMIT 30
        `);
        txns.rows.forEach(row => {
            console.log(`ID: ${row.id} | User: ${row.wallet_owner_id} | Node: ${row.node_id || 'N/A'} | Amount: ₹${row.amount} | Type: ${row.type} | Desc: ${row.description}`);
        });

        console.log("\n=== Node Wallets ===\n");
        const nodes = await client.query(`
            SELECT n.id, n.referral_code, n.owner_user_id, n.wallet_balance::text, n.current_level
            FROM Nodes n
            ORDER BY n.created_at DESC 
            LIMIT 10
        `);
        nodes.rows.forEach(row => {
            console.log(`Node ${row.id} (${row.referral_code}) | Owner: ${row.owner_user_id} | Wallet: ₹${row.wallet_balance} | Level: ${row.current_level}`);
        });

        console.log("\n=== User Master Wallets ===\n");
        const users = await client.query(`
            SELECT id, full_name, master_wallet_balance::text 
            FROM Users 
            ORDER BY created_at DESC 
            LIMIT 10
        `);
        users.rows.forEach(row => {
            console.log(`User ${row.id} (${row.full_name}) | Master Wallet: ₹${row.master_wallet_balance}`);
        });

        console.log("\n=== Credit Summary by User ===\n");
        const credits = await client.query(`
            SELECT 
                t.wallet_owner_id,
                u.full_name,
                COUNT(*) as credit_count,
                SUM(t.amount)::text as total_credited
            FROM Transactions t
            JOIN Users u ON t.wallet_owner_id = u.id
            WHERE t.type = 'CREDIT'
            GROUP BY t.wallet_owner_id, u.full_name
            ORDER BY SUM(t.amount) DESC
        `);
        credits.rows.forEach(row => {
            console.log(`User ${row.wallet_owner_id} (${row.full_name}) | Credits: ${row.credit_count} transactions | Total: ₹${row.total_credited}`);
        });

    } catch (error) {
        console.error("Error:", error);
    } finally {
        client.release();
        await pool.end();
    }
}

debugWallet();
