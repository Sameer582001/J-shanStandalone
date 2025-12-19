
import pool from '../config/db.js';

// Re-implement findGlobalPlacement locally to debug exactly where it fails
async function findGlobalPlacementDebug(client: any): Promise<number> {
    const q = client.query.bind(client);

    // 1. Get Root
    const rootRes = await q("SELECT id FROM Nodes WHERE referral_code = 'JSE-ROOT'");
    if (rootRes.rows.length === 0) throw new Error('Root not found');
    const rootId = rootRes.rows[0].id;

    const queue = [rootId];
    let steps = 0;

    while (queue.length > 0) {
        steps++;
        const currentId = queue.shift()!;

        // Count
        const res = await q('SELECT COUNT(*) as count FROM Nodes WHERE auto_pool_parent_id = $1', [currentId]);
        const count = parseInt(res.rows[0].count);

        if (count < 3) {
            // console.log(`Found spot under ${currentId} after ${steps} checks.`);
            return currentId;
        }

        // Children
        const childrenRes = await q('SELECT id FROM Nodes WHERE auto_pool_parent_id = $1 ORDER BY created_at ASC', [currentId]);
        for (const row of childrenRes.rows) {
            queue.push(row.id);
        }
    }
    throw new Error('Queue exhausted?');
}

async function fixOrphans() {
    const client = await pool.connect();
    try {
        console.log("--- FIXING ORPHANS ---");

        // 1. Get Orphans
        const orphans = await client.query("SELECT id, referral_code FROM Nodes WHERE auto_pool_parent_id IS NULL AND referral_code != 'JSE-ROOT' AND referral_code != 'JSE-AUTO-ROOT' ORDER BY created_at ASC");
        console.log(`Found ${orphans.rows.length} Orphans`);

        for (const orphan of orphans.rows) {
            try {
                // START TRANSACTION FOR EACH to simulate worker isolation
                await client.query('BEGIN');

                const parentId = await findGlobalPlacementDebug(client);

                await client.query('UPDATE Nodes SET auto_pool_parent_id = $1 WHERE id = $2', [parentId, orphan.id]);

                await client.query('COMMIT');
                // console.log(`Fixed Orphan ${orphan.referral_code} -> Parent ${parentId}`);
                process.stdout.write('.');

            } catch (err: any) {
                await client.query('ROLLBACK');
                console.error(`\nFAILED to fix Orphan ${orphan.referral_code}: ${err.message}`);
                // Stop to read error
                break;
            }
        }
        console.log("\nDone.");

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        process.exit();
    }
}

fixOrphans();
