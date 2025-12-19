
import pool from './src/config/db.js';

async function checkOrphans() {
    const client = await pool.connect();
    try {
        console.log('Checking Orphans 32, 33, 34...');

        const res = await client.query(`
            SELECT id, referral_code, auto_pool_parent_id, created_at 
            FROM Nodes 
            WHERE id IN (32, 33, 34)
        `);

        console.log("Nodes 32, 33, 34 Status:");
        res.rows.forEach(r => console.log(JSON.stringify(r)));

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        process.exit();
    }
}

checkOrphans();
