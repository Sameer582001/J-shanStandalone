
import pool from '../config/db.js';

async function checkSchema() {
    const client = await pool.connect();
    try {
        console.log("--- NODES TABLE ---");
        const nodeCols = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'nodes'");
        nodeCols.rows.forEach(r => console.log(`${r.column_name} (${r.data_type})`));

        console.log("\n--- LEVEL_PROGRESS TABLE ---");
        const lpCols = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'levelprogress'");
        lpCols.rows.forEach(r => console.log(`${r.column_name} (${r.data_type})`));

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        process.exit();
    }
}

checkSchema();
