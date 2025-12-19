
import pool from '../config/db.js';

async function checkDefault() {
    const client = await pool.connect();
    try {
        const res = await client.query("SELECT column_name, column_default, data_type FROM information_schema.columns WHERE table_name = 'nodes' AND column_name = 'current_level'");
        console.log("Schema Default:", res.rows[0]);

        // Also check actual data for a recent node
        const nodeRes = await client.query("SELECT id, current_level FROM Nodes ORDER BY id DESC LIMIT 1");
        console.log("Latest Node:", nodeRes.rows[0]);
    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        process.exit();
    }
}

checkDefault();
