
import pool from '../config/db.js';
import { NodeService } from '../services/NodeService.js';
import { FinancialService } from '../services/FinancialService.js';

const nodeService = new NodeService();
const finService = new FinancialService(); // Local instance to check queue array? No, checking DB.

async function triggerRebirths() {
    const client = await pool.connect();
    try {
        console.log("--- TRIGGERING REBIRTHS ---");

        // 1. Get current counts
        const initialRebirths = await client.query("SELECT COUNT(*) FROM Nodes WHERE is_rebirth = TRUE");
        console.log(`Initial Rebirths: ${initialRebirths.rows[0].count}`);

        const initialNodes = await client.query("SELECT COUNT(*) FROM Nodes");
        console.log(`Initial Total Nodes: ${initialNodes.rows[0].count}`);

        // 2. Add Dummy Nodes loop
        let added = 0;
        // We need usually 3-5 more nodes to complete a cycle for someone.
        // Let's add 10 to be safe.

        // Need a valid sponsor. Use Root.
        const rootRes = await client.query("SELECT id, referral_code, owner_user_id FROM Nodes WHERE referral_code = 'JSE-ROOT'");
        const rootUserId = rootRes.rows[0].owner_user_id;

        for (let i = 0; i < 10; i++) {
            // We use 'purchaseNode' logic but shortcut? 
            // Better to use purchaseNode to trigger FULL logic (Placement + Workers).
            // But purchaseNode requires User ID. We can reuse Root's User ID.

            // Just creating nodes in DB directly might skip worker triggers? 
            // Using NodeService.purchaseNode is safest integration test.

            try {
                const res = await nodeService.purchaseNode(rootUserId, 'JSE-ROOT');
                // process.stdout.write('+');
                console.log(`Added Node ${res.nodeId}`);
                added++;

                // Wait a bit for worker?
                // Logic is mostly sync except the worker processing the queue.
                // We need to wait for worker to pick up?
                // In 'debug_trigger' mode, we might need to sleep.
            } catch (e) {
                console.error("Failed to add node:", e);
            }

            // Check if rebirth count increased
            const currentRebirths = await client.query("SELECT COUNT(*) FROM Nodes WHERE is_rebirth = TRUE");
            if (parseInt(currentRebirths.rows[0].count) > parseInt(initialRebirths.rows[0].count)) {
                console.log(`\n!!! REBIRTH TRIGGERED after adding ${added} nodes !!!`);
                console.log(`New Rebirth Count: ${currentRebirths.rows[0].count}`);
                break;
            }

            await new Promise(r => setTimeout(r, 1000)); // Sleep 1s
        }

        if (added === 10) {
            console.log("\nAdded 10 nodes but No Rebirths triggered. Check logic again.");
        }

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        process.exit();
    }
}

triggerRebirths();
