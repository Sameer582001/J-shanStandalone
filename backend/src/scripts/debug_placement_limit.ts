
import { NodeService } from '../services/NodeService.js';
import pool from '../config/db.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const config = require('../config/plan_config.json');

const nodeService = new NodeService();

async function runStressTest() {
    const client = await pool.connect();
    try {
        console.log("--- STARTING PLACEMENT STRESS TEST ---");
        await client.query('BEGIN');

        // 1. Create a Fresh Root User for this test
        const suffix = Date.now();
        const userRes = await client.query(`INSERT INTO Users (auth_id, full_name, email, mobile, password_hash, role) VALUES ('stress_user_${suffix}', 'Stress User', 'stress_${suffix}@test.com', '${suffix}', 'hash', 'USER') RETURNING id`);
        const userId = userRes.rows[0].id;

        // 2. Create Anchor Node
        const anchorRes = await client.query(
            `INSERT INTO Nodes (referral_code, owner_user_id, sponsor_node_id, self_pool_parent_id, status, wallet_balance) 
             VALUES ('STRESS-ROOT', $1, NULL, NULL, 'ACTIVE', 0.00) RETURNING id, referral_code`,
            [userId]
        );
        const anchorId = anchorRes.rows[0].id;
        const anchorCode = anchorRes.rows[0].referral_code;
        console.log(`Created Anchor: ${anchorCode} (ID: ${anchorId})`);

        // COMMIT anchor so purchaseNode (which uses new connection) can see it
        await client.query('COMMIT');


        // 3. Loop: Purchase 100 Nodes under this Anchor
        // This forces the "Self Pool" tree to grow layer by layer.
        // Width 3.
        // L1: 3
        // L2: 9
        // L3: 27
        // L4: 81 (Total ~120)
        // If it passes 120, checking deeper.

        console.log("Attempting to insert 150 nodes...");
        const limit = 150;

        for (let i = 0; i < limit; i++) {
            // We bypass purchaseNode's financial overhead to test PLACEMENT logic purely? 
            // Or we use purchaseNode to be realistic?
            // Using purchaseNode is safer but requires mocking wallet/funds.

            // Let's call purchaseNode but give user infinite funds.
            await client.query("UPDATE Users SET master_wallet_balance = 1000000 WHERE id = $1", [userId]);

            try {
                const res = await nodeService.purchaseNode(userId, anchorCode);
                if (i % 10 === 0) console.log(`Purchased Node ${i + 1}/${limit} - ID: ${res.nodeId}`);
            } catch (err) {
                console.error(`FAILED at Node ${i + 1}:`, err);
                break;
            }
        }

        // 4. Verify Depth
        // Get Max Depth?
        const depthRes = await client.query(`
            WITH RECURSIVE depth_calc AS (
                SELECT id, 1 as level FROM Nodes WHERE id = $1
                UNION ALL
                SELECT n.id, d.level + 1 FROM Nodes n
                JOIN depth_calc d ON n.self_pool_parent_id = d.id
            )
            SELECT MAX(level) as max_depth, COUNT(*) as total_nodes FROM depth_calc
        `, [anchorId]);

        console.log("\n--- TEST RESULTS ---");
        console.log(`Expected Nodes: ${limit + 1}`);
        console.log(`Actual Nodes: ${depthRes.rows[0].total_nodes}`);
        console.log(`Max Depth Reached: ${depthRes.rows[0].max_depth}`);

        if (parseInt(depthRes.rows[0].total_nodes) === limit + 1) {
            console.log("SUCCESS: All nodes placed successfully.");
        } else {
            console.log("FAILURE: Count mismatch.");
        }

        // Cleanup
        await client.query('DELETE FROM Nodes WHERE referral_code = $1', [anchorCode]); // Cascade?
        // Actually Users cascade to Nodes usually.
        await client.query('DELETE FROM Users WHERE id = $1', [userId]);

    } catch (e) {
        console.error(e);
        await client.query('ROLLBACK');
    } finally {
        client.release();
        process.exit();
    }
}

runStressTest();
