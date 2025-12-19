
import pool from '../config/db.js';

async function checkRebirths() {
    const client = await pool.connect();
    try {
        console.log("--- REBIRTH VISIBILITY CHECK ---");

        // 1. Find all Rebirths
        const res = await client.query(`
            SELECT r.id, r.referral_code, r.origin_node_id,
                   s.referral_code as self_parent,
                   a.referral_code as auto_parent
            FROM Nodes r
            LEFT JOIN Nodes s ON r.self_pool_parent_id = s.id
            LEFT JOIN Nodes a ON r.auto_pool_parent_id = a.id
            WHERE r.is_rebirth = TRUE
            ORDER BY r.created_at DESC
            LIMIT 10
        `);

        if (res.rows.length === 0) {
            console.log("No Rebirths found in DB.");
        } else {
            console.table(res.rows);
        }

        // 2. Check Connection to Roots
        // Pick one rebirth and trace up to JSE-ROOT (Self)
        if (res.rows.length > 0) {
            const sample = res.rows[0];
            console.log(`\nTracing Rebirth ${sample.referral_code} in Self Pool...`);

            let currId = sample.id;
            // Trace loop
            /* Implement simple trace if needed, but table is usually enough */
        }

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        process.exit();
    }
}

checkRebirths();
