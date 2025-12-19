import dotenv from 'dotenv';
import pg from 'pg';
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: process.env.POSTGRES_PORT,
});

async function checkParents() {
    const client = await pool.connect();
    try {
        console.log("=== All Nodes Parent Check ===\n");
        const nodes = await client.query(`
            SELECT 
                n.id, 
                n.referral_code, 
                n.self_pool_parent_id as self_pid,
                sp.referral_code as self_parent_code,
                n.auto_pool_parent_id as auto_pid,
                ap.referral_code as auto_parent_code,
                n.created_at
            FROM Nodes n
            LEFT JOIN Nodes sp ON n.self_pool_parent_id = sp.id
            LEFT JOIN Nodes ap ON n.auto_pool_parent_id = ap.id
            ORDER BY n.id ASC
        `);

        nodes.rows.forEach(n => {
            console.log(`Node ${n.id} (${n.referral_code}) | Self Parent: ${n.self_parent_code} (${n.self_pid}) | Auto Parent: ${n.auto_parent_code} (${n.auto_pid})`);
        });

    } catch (error) {
        console.error("Error:", error);
    } finally {
        client.release();
        await pool.end();
    }
}

checkParents();
