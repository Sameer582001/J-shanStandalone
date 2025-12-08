import { query } from '../config/db.js';
import { NodeService } from '../services/NodeService.js';
import { WalletService } from '../services/WalletService.js';

const nodeService = new NodeService();
const walletService = new WalletService();

async function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function verifyAutoPool() {
    try {
        console.log("Starting Auto Pool Verification...");

        // 1. Get Admin User
        const userRes = await query("SELECT id FROM Users WHERE role = 'ADMIN' LIMIT 1");
        if (userRes.rows.length === 0) throw new Error("No Admin User found");
        const adminId = userRes.rows[0].id;

        // 2. Fund Admin Wallet (infinite money for testing)
        await walletService.creditFunds(adminId, 100000, "Testing Funds");
        console.log("Funded Admin Wallet.");

        // 3. Purchase 4 Nodes
        const nodes = [];
        for (let i = 1; i <= 4; i++) {
            console.log(`Purchasing Node ${i}...`);
            const result = await nodeService.purchaseNode(adminId, 'JSE-ROOT');
            nodes.push(result.nodeId);
            // Wait for worker to process
            await delay(1000);
        }

        console.log("Waiting for worker verification...");
        await delay(2000);

        // 4. Check Placements
        console.log("Checking Auto Pool Placements...");

        // Root should have 3 children
        const rootChildren = await query("SELECT COUNT(*) as count FROM Nodes WHERE auto_pool_parent_id = (SELECT id FROM Nodes WHERE referral_code = 'JSE-ROOT')");
        console.log(`Root Children Count: ${rootChildren.rows[0].count} (Expected 3)`);

        // Node 1 should have 1 child (Node 4)
        const node1Children = await query("SELECT COUNT(*) as count FROM Nodes WHERE auto_pool_parent_id = $1", [nodes[0]]);
        console.log(`Node 1 Children Count: ${node1Children.rows[0].count} (Expected 1)`);

        if (parseInt(rootChildren.rows[0].count) === 3 && parseInt(node1Children.rows[0].count) === 1) {
            console.log("SUCCESS: Auto Pool Logic Verified!");
        } else {
            console.log("FAILURE: Auto Pool Counts Mismatch.");
        }

    } catch (err) {
        console.error("Test Failed:", err);
    }
}

verifyAutoPool();
