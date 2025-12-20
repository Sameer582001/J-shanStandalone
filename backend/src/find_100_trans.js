import dotenv from 'dotenv';
import pg from 'pg';
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: process.env.POSTGRES_PORT ? parseInt(process.env.POSTGRES_PORT, 10) : undefined,
});

async function find100Trans() {
    const client = await pool.connect();
    try {
        console.log("=== Transactions with Amount 100 ===\n");
        const res = await client.query("SELECT * FROM Transactions WHERE amount = 100");
        if (res.rows.length === 0) {
            console.log("No transactions of exactly 100 found.");
            // Try broadly
            const res2 = await client.query("SELECT * FROM Transactions LIMIT 10");
            console.log("Showing first 10 transactions instead:");
            res2.rows.forEach(r => console.log(`${r.amount} | ${r.description}`));
        } else {
            res.rows.forEach(r => console.log(`${r.created_at} | Wallet: ${r.wallet_owner_id} | ${r.amount} | ${r.description}`));
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        client.release();
        await pool.end();
    }
}

find100Trans();
