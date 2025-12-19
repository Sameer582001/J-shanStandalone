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

async function checkTargeted() {
    const client = await pool.connect();
    try {
        console.log("=== Nodes 24-27 Connectivity ===\n");
        const nodes = await client.query(`
            SELECT 
                id, 
                referral_code, 
                self_pool_parent_id, 
                auto_pool_parent_id,
                (SELECT COUNT(*) FROM Nodes c WHERE c.self_pool_parent_id = Nodes.id) as self_kids,
                (SELECT COUNT(*) FROM Nodes c WHERE c.auto_pool_parent_id = Nodes.id) as auto_kids
            FROM Nodes
            WHERE id IN (24, 25, 26, 27)
            ORDER BY id ASC
        `);

        nodes.rows.forEach(n => {
            console.log(`Node ${n.id} | SelfP: ${n.self_pool_parent_id}, AutoP: ${n.auto_pool_parent_id} | SelfKids: ${n.self_kids}, AutoKids: ${n.auto_kids}`);
        });

    } catch (error) {
        console.error("Error:", error);
    } finally {
        client.release();
        await pool.end();
    }
}

checkTargeted();
