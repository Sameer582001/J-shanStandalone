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

async function checkLastTrans() {
    const client = await pool.connect();
    let output = '';
    try {
        output += "=== Last 10 Transactions ===\n";
        const res = await client.query("SELECT * FROM Transactions ORDER BY id DESC LIMIT 10");
        res.rows.forEach(r => {
            output += `ID: ${r.id} | Amount: ${r.amount} | Desc: ${r.description} | Date: ${r.created_at}\n`;
        });

        fs.writeFileSync('last_trans_utf8.txt', output, 'utf8');
        console.log("Written to last_trans_utf8.txt");

    } catch (error) {
        console.error("Error:", error);
    } finally {
        client.release();
        await pool.end();
    }
}

checkLastTrans();
