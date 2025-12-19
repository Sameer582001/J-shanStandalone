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

async function checkGoldProgress() {
    const client = await pool.connect();
    try {
        console.log("=== Node 1 Gold Level (Level 2) Progress ===\n");
        const res = await client.query(`
            SELECT * FROM LevelProgress WHERE node_id = 1 AND level = 2
        `);

        if (res.rows.length === 0) {
            console.log("No Gold Level progress found for Node 1.");
            return;
        }

        res.rows.forEach(r => {
            console.log(`Pool: ${r.pool_type} | Revenue: ${r.total_revenue} | Completed: ${r.is_completed}`);
            console.log(`Buckets: ${JSON.stringify(r.buckets, null, 2)}`);
            console.log('---');
        });

    } catch (error) {
        console.error("Error:", error);
    } finally {
        client.release();
        await pool.end();
    }
}

checkGoldProgress();
