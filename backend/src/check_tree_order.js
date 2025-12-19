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

async function checkTreeOrder() {
    const client = await pool.connect();
    try {
        console.log("=== Checking Gen 3 Placement (IDs 14-50) ===\n");
        const nodes = await client.query(`
            SELECT 
                n.id, 
                n.referral_code, 
                (SELECT COUNT(*) FROM Nodes c WHERE c.self_pool_parent_id = n.id) as self_children,
                (SELECT COUNT(*) FROM Nodes c WHERE c.auto_pool_parent_id = n.id) as auto_children
            FROM Nodes n
            WHERE n.id >= 14 AND n.id <= 50
            ORDER BY n.id ASC
        `);

        nodes.rows.forEach(n => {
            console.log(`Node ${n.id} (${n.referral_code}) | Self Children: ${n.self_children} | Auto Children: ${n.auto_children}`);
        });

    } catch (error) {
        console.error("Error:", error);
    } finally {
        client.release();
        await pool.end();
    }
}

checkTreeOrder();
