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

async function checkDirectProgress() {
    const client = await pool.connect();
    let output = '';
    try {
        // Find direct referrals of Node 1 (Root)
        output += "=== Direct Referrals of Node 1 ===\n";
        const refs = await client.query("SELECT id, referral_code FROM Nodes WHERE sponsor_node_id = 1 ORDER BY id");

        for (const ref of refs.rows) {
            output += `\nNode ${ref.id} (${ref.referral_code}):\n`;

            // Check Level 2 (Gold) Progress
            const gold = await client.query("SELECT * FROM LevelProgress WHERE node_id = $1 AND level = 2", [ref.id]);
            if (gold.rows.length > 0) {
                gold.rows.forEach(r => {
                    output += `  [Gold L2 - ${r.pool_type}] Revenue: ${r.total_revenue} | Completed: ${r.is_completed} | Buckets: ${JSON.stringify(r.buckets)}\n`;
                });
            } else {
                output += `  [Gold L2] No Progress\n`;
            }

            // Check Level 3 (Platinum) Progress
            const plat = await client.query("SELECT * FROM LevelProgress WHERE node_id = $1 AND level = 3", [ref.id]);
            if (plat.rows.length > 0) {
                plat.rows.forEach(r => {
                    output += `  [Plat L3 - ${r.pool_type}] Revenue: ${r.total_revenue} | Completed: ${r.is_completed} | Buckets: ${JSON.stringify(r.buckets)}\n`;
                });
            } else {
                output += `  [Plat L3] No Progress\n`;
            }
        }

        fs.writeFileSync('direct_progress.txt', output, 'utf8');

    } catch (error) {
        console.error("Error:", error);
    } finally {
        client.release();
        await pool.end();
    }
}

checkDirectProgress();
