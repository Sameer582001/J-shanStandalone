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

async function checkSkippedNodes() {
    const client = await pool.connect();
    try {
        console.log("=== Checking Skipped Nodes ===\n");

        // Check Node 25 (Self Pool)
        const node25 = await client.query("SELECT id, referral_code FROM Nodes WHERE id = 25");
        if (node25.rows.length > 0) {
            const children = await client.query("SELECT id, referral_code FROM Nodes WHERE self_pool_parent_id = 25");
            console.log(`Node 25 (Self) has ${children.rows.length} children.`);
            children.rows.forEach(c => console.log(` - Child: ${c.referral_code} (${c.id})`));
        } else {
            console.log("Node 25 not found.");
        }

        console.log("---");

        // Check Node 27 (Auto Pool)
        const node27 = await client.query("SELECT id, referral_code FROM Nodes WHERE id = 27");
        if (node27.rows.length > 0) {
            const children = await client.query("SELECT id, referral_code FROM Nodes WHERE auto_pool_parent_id = 27");
            console.log(`Node 27 (Auto) has ${children.rows.length} children.`);
            children.rows.forEach(c => console.log(` - Child: ${c.referral_code} (${c.id})`));
        } else {
            console.log("Node 27 not found.");
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        client.release();
        await pool.end();
    }
}

checkSkippedNodes();
