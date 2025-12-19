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

async function checkConnectivity2() {
    const client = await pool.connect();
    let output = '';
    try {
        output += "=== Checking Auto Pool Parents for 23-28 ===\n";
        const res = await client.query(`
            SELECT id, referral_code, auto_pool_parent_id 
            FROM Nodes 
            WHERE id BETWEEN 23 AND 28 
            ORDER BY id ASC
        `);

        res.rows.forEach(r => {
            output += `Node ${r.id} (${r.referral_code}) -> AutoParent: ${r.auto_pool_parent_id}\n`;
        });

        fs.writeFileSync('connectivity_utf8.txt', output, 'utf8');
        console.log("Written to connectivity_utf8.txt");

    } catch (error) {
        console.error("Error:", error);
    } finally {
        client.release();
        await pool.end();
    }
}

checkConnectivity2();
