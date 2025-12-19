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

async function checkRecentParents() {
    const client = await pool.connect();
    try {
        console.log("=== Recent Nodes Parents (ID > 35) ===\n");
        const nodes = await client.query(`
            SELECT 
                n.id, 
                n.referral_code, 
                n.self_pool_parent_id,
                n.auto_pool_parent_id
            FROM Nodes n
            WHERE n.id > 35
            ORDER BY n.id ASC
        `);

        nodes.rows.forEach(n => {
            console.log(`Node ${n.id}: SelfParent ${n.self_pool_parent_id} | AutoParent ${n.auto_pool_parent_id}`);
        });

    } catch (error) {
        console.error("Error:", error);
    } finally {
        client.release();
        await pool.end();
    }
}

checkRecentParents();
