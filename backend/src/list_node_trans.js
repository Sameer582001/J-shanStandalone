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

async function listAllNodeTransactions() {
    const client = await pool.connect();
    try {
        console.log("=== ALL Node Wallet Credit Transactions ===\n");
        const txns = await client.query(`
            SELECT 
                t.id,
                t.node_id,
                n.referral_code,
                t.amount::text as amount,
                t.description,
                to_char(t.created_at, 'YYYY-MM-DD HH24:MI:SS') as time
            FROM Transactions t
            JOIN Nodes n ON t.node_id = n.id
            WHERE t.type = 'CREDIT'
            ORDER BY t.created_at ASC
        `);

        console.log(`Total: ${txns.rows.length} transactions\n`);
        txns.rows.forEach((row, idx) => {
            console.log(`${idx + 1}. [${row.time}] Node ${row.node_id} (${row.referral_code}) | ₹${row.amount} | "${row.description}"`);
        });

    } catch (error) {
        console.error("Error:", error);
    } finally {
        client.release();
        await pool.end();
    }
}

listAllNodeTransactions();
