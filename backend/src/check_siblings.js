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

async function checkSiblings() {
    const client = await pool.connect();
    let output = '';
    try {
        output += "=== Checking Siblings ===\n";

        const selfSiblings = await client.query('SELECT id, self_pool_parent_id, created_at FROM Nodes WHERE id IN (24, 25) ORDER BY id');
        selfSiblings.rows.forEach(r => output += `Node ${r.id} SelfParent: ${r.self_pool_parent_id} (Created ${r.created_at})\n`);

        const autoSiblings = await client.query('SELECT id, auto_pool_parent_id, created_at FROM Nodes WHERE id IN (26, 27) ORDER BY id');
        autoSiblings.rows.forEach(r => output += `Node ${r.id} AutoParent: ${r.auto_pool_parent_id} (Created ${r.created_at})\n`);

        fs.writeFileSync('siblings.txt', output, 'utf8');

    } catch (error) {
        console.error("Error:", error);
    } finally {
        client.release();
        await pool.end();
    }
}

checkSiblings();
