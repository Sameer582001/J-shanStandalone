
import pool from '../config/db.js';

async function runAnalysis() {
    const client = await pool.connect();
    try {
        console.log("--- AUTO POOL STRUCTURAL ANALYSIS ---");

        // 1. Find Global Root
        let rootId;
        const rootRes = await client.query("SELECT id, referral_code FROM Nodes WHERE referral_code = 'JSE-ROOT'");
        if (rootRes.rows.length > 0) {
            rootId = rootRes.rows[0].id;
            console.log(`Global Root Found: ${rootRes.rows[0].referral_code} (ID: ${rootId})`);
        } else {
            console.log("JSE-ROOT not found. Trying JSE-AUTO-ROOT...");
            const altRes = await client.query("SELECT id, referral_code FROM Nodes WHERE referral_code = 'JSE-AUTO-ROOT'");
            if (altRes.rows.length > 0) {
                rootId = altRes.rows[0].id;
                console.log(`Global Root Found: ${altRes.rows[0].referral_code} (ID: ${rootId})`);
            } else {
                console.error("NO ROOT FOUND. Auto Pool cannot function.");
                return;
            }
        }

        // 2. BFS Count Levels
        const queue = [{ id: rootId, level: 0 }];
        const levelCounts: Record<number, number> = {};
        let totalNodes = 0;

        while (queue.length > 0) {
            const current = queue.shift()!;

            // Count
            levelCounts[current.level] = (levelCounts[current.level] || 0) + 1;
            totalNodes++;

            // Fetch Children
            const childrenRes = await client.query('SELECT id FROM Nodes WHERE auto_pool_parent_id = $1 ORDER BY created_at ASC', [current.id]);
            for (const child of childrenRes.rows) {
                queue.push({ id: child.id, level: current.level + 1 });
            }
        }

        console.log("\n--- LEVEL COUNTS ---");
        Object.keys(levelCounts).forEach(lvl => {
            const count = levelCounts[parseInt(lvl)] || 0;
            const expected = Math.pow(3, parseInt(lvl));
            const status = count === expected ? "FULL" : `PARTIAL (${Math.round(count / expected * 100)}%)`;
            console.log(`Level ${lvl}: ${count} nodes (Max: ${expected}) - ${status}`);
        });
        console.log(`Total Nodes in Tree: ${totalNodes}`);

        // 3. Check Orphans
        const orphanRes = await client.query("SELECT COUNT(*) as count FROM Nodes WHERE auto_pool_parent_id IS NULL AND id != $1", [rootId]);
        console.log(`\nOrphan Nodes (No Auto Parent): ${orphanRes.rows[0].count}`);

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        process.exit();
    }
}

runAnalysis();
