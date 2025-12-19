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

async function checkParentsAndKids() {
    const client = await pool.connect();
    try {
        console.log("=== Node 8 auto_pool_children ===");
        const kids8 = await client.query('SELECT id FROM Nodes WHERE auto_pool_parent_id = 8 ORDER BY id');
        console.log(kids8.rows.map(r => r.id));

        console.log("=== Node 9 auto_pool_children ===");
        const kids9 = await client.query('SELECT id FROM Nodes WHERE auto_pool_parent_id = 9 ORDER BY id');
        console.log(kids9.rows.map(r => r.id));

        console.log("=== Node 25 Parents ===");
        const node25 = await client.query('SELECT id, self_pool_parent_id, auto_pool_parent_id FROM Nodes WHERE id = 25');
        console.log(node25.rows[0]);

        console.log("=== Node 27 Parents ===");
        const node27 = await client.query('SELECT id, self_pool_parent_id, auto_pool_parent_id FROM Nodes WHERE id = 27');
        console.log(node27.rows[0]);

    } catch (error) {
        console.error("Error:", error);
    } finally {
        client.release();
        await pool.end();
    }
}

checkParentsAndKids();
