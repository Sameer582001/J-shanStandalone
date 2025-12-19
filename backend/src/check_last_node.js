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

async function checkMaxNode() {
    const client = await pool.connect();
    try {
        console.log("=== Checking Last Node ===\n");
        const res = await client.query(`
            SELECT id, referral_code, self_pool_parent_id, auto_pool_parent_id, created_at
            FROM Nodes
            ORDER BY id DESC
            LIMIT 5
        `);

        res.rows.forEach(n => {
            console.log(`Node ${n.id}: SelfParent ${n.self_pool_parent_id} | AutoParent ${n.auto_pool_parent_id}`);
        });

    } catch (error) {
        console.error("Error:", error);
    } finally {
        client.release();
        await pool.end();
    }
}

checkMaxNode();
