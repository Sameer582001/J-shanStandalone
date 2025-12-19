
import pool from '../config/db.js';

const WIDTH = 3;

async function checkIntegrity() {
    const client = await pool.connect();
    try {
        console.log("Checking Self Pool Integrity...");

        const selfRes = await client.query(`
            SELECT self_pool_parent_id, count(*) 
            FROM Nodes 
            WHERE self_pool_parent_id IS NOT NULL 
            GROUP BY self_pool_parent_id 
            HAVING count(*) > $1
        `, [WIDTH]);

        if (selfRes.rows.length > 0) {
            console.log("CRITICAL: Self Pool Overflow Detected!");
            console.table(selfRes.rows);
        } else {
            console.log("Self Pool OK.");
        }

        console.log("\nChecking Auto Pool Integrity...");
        const autoRes = await client.query(`
            SELECT auto_pool_parent_id, count(*) 
            FROM Nodes 
            WHERE auto_pool_parent_id IS NOT NULL 
            GROUP BY auto_pool_parent_id 
            HAVING count(*) > $1
        `, [WIDTH]);

        if (autoRes.rows.length > 0) {
            console.log("CRITICAL: Auto Pool Overflow Detected!");
            console.table(autoRes.rows);
        } else {
            console.log("Auto Pool OK.");
        }

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        process.exit();
    }
}

checkIntegrity();
