
import pool from './src/config/db.js';

async function inspectNodes() {
    const client = await pool.connect();
    try {
        console.log('Inspecting Nodes 31-35...');

        const parentIds = [31, 32, 33, 34, 35];

        const res = await client.query(`
            SELECT id, referral_code, auto_pool_parent_id, created_at 
            FROM Nodes 
            WHERE id = ANY($1)
            ORDER BY id ASC
        `, [parentIds]);

        console.log("PARENTS:");
        res.rows.forEach(r => console.log(JSON.stringify(r)));

        // 2. Count children for each
        for (const pid of parentIds) {
            const childRes = await client.query(`
                SELECT id, referral_code, created_at 
                FROM Nodes 
                WHERE auto_pool_parent_id = $1 
                ORDER BY created_at ASC
            `, [pid]);
            console.log(`Parent ${pid} children: ${childRes.rowCount}`);
            if (childRes.rowCount > 0) {
                childRes.rows.forEach(r => console.log(`  -> Child: ${JSON.stringify(r)}`));
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        process.exit();
    }
}

inspectNodes();
