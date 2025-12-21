import dotenv from 'dotenv';
import pg from 'pg';
import fs from 'fs';
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: process.env.POSTGRES_PORT ? parseInt(process.env.POSTGRES_PORT, 10) : undefined,
});

async function checkGapTrans() {
    const client = await pool.connect();
    let output = '';
    try {
        // Gap 1: Node 2 (4IB6ZS)
        // System Fee ended at 195. Profit started at 232.
        output += "=== Gap for Node 2 (195-232) ===\n";
        const res1 = await client.query("SELECT * FROM Transactions WHERE id > 195 AND id < 232 ORDER BY id ASC");
        res1.rows.forEach(r => {
            output += `ID: ${r.id} | Amount: ${r.amount} | User: ${r.wallet_owner_id} | Desc: ${r.description}\n`;
        });

        // Gap 2: Node 3 (YACLQH)
        // System Fee ended at 302. Profit started at 339.
        output += "\n=== Gap for Node 3 (302-339) ===\n";
        const res2 = await client.query("SELECT * FROM Transactions WHERE id > 302 AND id < 339 ORDER BY id ASC");
        res2.rows.forEach(r => {
            output += `ID: ${r.id} | Amount: ${r.amount} | User: ${r.wallet_owner_id} | Desc: ${r.description}\n`;
        });

        fs.writeFileSync('gap_trans.txt', output, 'utf8');

    } catch (error) {
        console.error("Error:", error);
    } finally {
        client.release();
        await pool.end();
    }
}

checkGapTrans();
