
import pool from './src/config/db.js';

async function checkParent11() {
    const client = await pool.connect();
    try {
        console.log('Checking Node 11...');

        const res = await client.query(`
            SELECT id, referral_code, auto_pool_parent_id 
            FROM Nodes 
            WHERE id = 11
        `);
        console.log('Node 11:', JSON.stringify(res.rows[0]));

        const children = await client.query(`
            SELECT id FROM Nodes WHERE auto_pool_parent_id = 11
        `);
        console.log(`Node 11 Children Count: ${children.rowCount}`);

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        process.exit();
    }
}

checkParent11();
