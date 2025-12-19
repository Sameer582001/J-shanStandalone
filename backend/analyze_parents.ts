
import pool from './src/config/db.js';

async function analyzeParents() {
    const client = await pool.connect();
    try {
        console.log('Analyzing Parents of 31 and 35...');

        const nodes = await client.query(`
            SELECT id, referral_code, auto_pool_parent_id 
            FROM Nodes 
            WHERE id IN (31, 35)
        `);

        console.log('Nodes 31, 35:', JSON.stringify(nodes.rows));

        const parentIds = [...new Set(nodes.rows.map(n => n.auto_pool_parent_id).filter(id => id !== null))];

        for (const pid of parentIds) {
            const children = await client.query(`
                SELECT id, created_at 
                FROM Nodes 
                WHERE auto_pool_parent_id = $1 
                ORDER BY created_at ASC
            `, [pid]);

            console.log(`Parent ${pid} has ${children.rowCount} children: ${children.rows.map(c => c.id).join(', ')}`);
        }

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        process.exit();
    }
}

analyzeParents();
