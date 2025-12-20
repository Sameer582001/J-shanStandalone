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

async function checkNodeOwners() {
    const client = await pool.connect();
    let output = '';
    try {
        output += "=== Node Ownership ===\n";
        const res = await client.query("SELECT id, referral_code, owner_user_id, sponsor_node_id FROM Nodes WHERE id IN (1, 2)");
        res.rows.forEach(r => {
            output += `Node ${r.id} (${r.referral_code}): Owner ${r.owner_user_id} | Sponsor ${r.sponsor_node_id}\n`;
        });
        fs.writeFileSync('owners_utf8.txt', output, 'utf8');

    } catch (error) {
        console.error("Error:", error);
    } finally {
        client.release();
        await pool.end();
    }
}

checkNodeOwners();
