
import pool from '../config/db.js';
import { NodeService } from '../services/NodeService.js';
import { FinancialService } from '../services/FinancialService.js';

// We implement a mini-worker inline to guarantee execution
async function inlineWorker(nodeId: number) {
    const client = await pool.connect();
    const finService = new FinancialService();
    try {
        await client.query('BEGIN');

        // 1. Find Placement
        // Reuse logic or query
        const rootRes = await client.query("SELECT id FROM Nodes WHERE referral_code = 'JSE-ROOT'");
        const rootId = rootRes.rows[0].id;

        // BFS
        const queue = [rootId];
        let parentId = null;

        while (queue.length > 0) {
            const curr = queue.shift()!;
            const countRes = await client.query('SELECT COUNT(*) as count FROM Nodes WHERE auto_pool_parent_id = $1', [curr]);
            if (parseInt(countRes.rows[0].count) < 3) {
                parentId = curr;
                break;
            }
            const children = await client.query('SELECT id FROM Nodes WHERE auto_pool_parent_id = $1 ORDER BY created_at ASC', [curr]);
            for (const row of children.rows) queue.push(row.id);
        }

        if (!parentId) throw new Error("Matrix Full");

        // 2. Update
        await client.query('UPDATE Nodes SET auto_pool_parent_id = $1 WHERE id = $2', [parentId, nodeId]);
        console.log(`[InlineWorker] Placed Node ${nodeId} under ${parentId}`);

        // 3. Process Financials
        // const config = require('../config/plan_config.json'); // Importing JSON in ES module script is tricky without createRequire or fs
        // Hardcode standard fee 500
        await finService.processIncome(parentId, 500, 1, 'AUTO', client);

        await client.query('COMMIT');

        // Check for generated rebirths
        if (finService.createdRebirthIds.length > 0) {
            console.log(`[InlineWorker] !!! GENERATED ${finService.createdRebirthIds.length} REBIRTHS !!!`);
            // Recursively process them?
            for (const rbId of finService.createdRebirthIds) {
                await inlineWorker(rbId);
            }
        }

    } catch (e) {
        await client.query('ROLLBACK');
        console.error(e);
    } finally {
        client.release();
    }
}

async function triggerRebirths() {
    const client = await pool.connect();
    try {
        console.log("--- FORCED REBIRTH TRIGGER ---");

        const rootRes = await client.query("SELECT id, referral_code, owner_user_id FROM Nodes WHERE referral_code = 'JSE-ROOT'");
        const rootUserId = rootRes.rows[0].owner_user_id;
        const nodeService = new NodeService();

        for (let i = 0; i < 5; i++) {
            // 1. Create Node (Self Pool only, worker disabled in purchaseNode call? No, purchaseNode adds to queue, we ignore queue)
            // We can insert directly to be sure, or use purchaseNode and race the queue.
            // Let's use purchaseNode but run inlineWorker immediately after.

            // Create Transaction for Purchase
            const purchaseRes = await nodeService.purchaseNode(rootUserId, 'JSE-ROOT');
            console.log(`Purchased Node ${purchaseRes.nodeId}`);

            // 2. Force Auto Pool Placement
            await inlineWorker(purchaseRes.nodeId);

            // 3. Check Rebirths
            const countRes = await client.query("SELECT COUNT(*) FROM Nodes WHERE is_rebirth = TRUE");
            console.log(`Total Rebirths: ${countRes.rows[0].count}`);
        }

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        process.exit();
    }
}

triggerRebirths();
