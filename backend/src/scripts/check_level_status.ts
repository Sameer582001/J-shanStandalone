
import pool from '../config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logPath = path.resolve(__dirname, 'status_check_output.txt');

async function checkStatus() {
    const client = await pool.connect();
    try {
        // Get all active nodes and their total revenue for Level 1 (Silver)
        const res = await client.query(`
            SELECT 
                n.id, 
                n.referral_code, 
                n.current_level, 
                (SELECT count(*) FROM Nodes WHERE self_pool_parent_id = n.id) as self_pool_children, 
                COALESCE(lp.total_revenue, 0) as l1_revenue,
                COALESCE(lp.is_completed, false) as l1_completed
            FROM Nodes n
            LEFT JOIN LevelProgress lp ON n.id = lp.node_id AND lp.level = 1
            WHERE n.status = 'ACTIVE'
            ORDER BY n.id ASC
        `);

        const output = [];
        output.push("--- NODE LEVEL STATUS (LEVEL 1 FOCUS) ---");
        output.push("Node | Rank | Directs | L1 Revenue | L1 Completed?");

        for (const row of res.rows) {
            output.push(`${row.referral_code} | ${row.current_level} | ${row.self_pool_children} | ${row.l1_revenue} | ${row.l1_completed}`);
        }

        fs.writeFileSync(logPath, output.join('\n'));
        console.log("Logged to", logPath);

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        process.exit();
    }
}

checkStatus();
