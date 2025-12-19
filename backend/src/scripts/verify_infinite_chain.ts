
import { FinancialService } from '../services/FinancialService.js';
import { NodeService } from '../services/NodeService.js';
import { WalletService } from '../services/WalletService.js';
import pool from '../config/db.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
// Mock config if needed or rely on loading
const config = require('../config/plan_config.json');

const nodeService = new NodeService();
const financialService = new FinancialService();
const walletService = new WalletService();

async function runSimulation() {
    const client = await pool.connect();
    try {
        console.log("--- STARTING INFINITE CHAIN VERIFICATION ---");
        await client.query('BEGIN');

        // 1. Setup Chain: Root -> A -> B -> C -> D -> E (5 Generations)
        // We will simplify creation by inserting directly or using service if fast.
        // Direct insert is faster for simulation.

        // Create Users
        const userRes = await client.query("INSERT INTO Users (auth_id, full_name, email, mobile, password_hash, role) VALUES ('sim_user', 'Sim User', 'sim@test.com', '0000000000', 'hash', 'USER') RETURNING id");
        const userId = userRes.rows[0].id;

        // Helper to create Node
        let counter = 1;
        async function createNode(sponsorId: number | null, name: string) {
            const code = `SIM-${name}`;
            const res = await client.query(
                `INSERT INTO Nodes (referral_code, owner_user_id, sponsor_node_id, self_pool_parent_id, status, wallet_balance, current_level) 
                 VALUES ($1, $2, $3, $3, 'ACTIVE', 0.00, 1) RETURNING id`,
                [code, userId, sponsorId]
            );
            return res.rows[0].id;
        }

        // Create Root
        const rootId = await createNode(null, "ROOT");
        console.log(`Created ROOT (${rootId})`);

        // Create User A (Gen 1 of Root)
        const nodeA = await createNode(rootId, "A");
        console.log(`Created Node A (${nodeA}) - Level 0`);

        // Create B (Gen 1 of A)
        const nodeB = await createNode(nodeA, "B");

        // Create C (Gen 1 of B, Gen 2 of A)
        const nodeC = await createNode(nodeB, "C");

        // Create D (Gen 1 of C, Gen 3 of A)
        const nodeD = await createNode(nodeC, "D");

        // Create E (Gen 1 of D, Gen 4 of A)
        const nodeE = await createNode(nodeD, "E");
        console.log(`Created Chain: A -> B -> C -> D -> E`);

        // 2. Trigger Action at Node E (Gen 4 relative to A)
        // Let's say Node E upgrades to Level 1.
        // Logic: L1 Upgrade Fee (1000) -> Goes to 2nd Upline.
        // E's 2nd Upline is C. (E -> D -> C).
        // A should NOT be involved. A is 4th Upline.

        console.log("\n--- TRIGGER: Node E Upgrades to Level 2 (Paying 2nd Upline) ---");
        // Simulate E completing L1 buckets and triggering L2 Upgrade.
        // We manually call passUpUpgradeFee Logic or processIncome.
        // Target: Level 2 Upgrade Fee.

        // Let's call processIncome on E with type 'upgrade' bucket filled?
        // Or simpler: simulate E Paying Upgrade Fee directly.
        // User A's logic: "Level 1 Upgrade -> Gen 2 pays".
        // Wait, L1 Upgrade Fee (Joining) goes to Sponsor (D).
        // L2 Upgrade Fee goes to 2nd Upline (C).
        // L3 Upgrade Fee goes to 3rd Upline (B).
        // L4 Upgrade Fee goes to 4th Upline (A).

        // Scenario 1: E Upgrades to Level 2
        // Should pay C.
        const L2_FEE = 3000;
        console.log(`Node E paying Level 2 Fee (${L2_FEE})... seeking 2nd Upline (C).`);

        // We cheat and call passUpUpgradeFee directly to verify routing
        // @ts-ignore
        await financialService.passUpUpgradeFee(nodeE, L2_FEE, 2, 'SELF', client);

        // Check C's Wallet
        const walletC = await client.query("SELECT wallet_balance FROM Nodes WHERE id = $1", [nodeC]);
        console.log(`Node C Balance: ${walletC.rows[0].wallet_balance} (Expected +3000 approx after splits)`);

        // Check A's Wallet (Should be 0)
        const walletA = await client.query("SELECT wallet_balance FROM Nodes WHERE id = $1", [nodeA]);
        console.log(`Node A Balance: ${walletA.rows[0].wallet_balance} (Expected 0)`);

        if (Number(walletA.rows[0].wallet_balance) === 0 && Number(walletC.rows[0].wallet_balance) > 0) {
            console.log("SUCCESS: Infinite Chain Logic Holds. E paid C, while A was unaffected.");
        } else {
            console.log("FAILURE: Unexpected balanaces.");
        }

        // Scenario 2: Node E Upgrades to Level 4?
        // E -> D -> C -> B -> A.
        // E is 4th Gen of A.
        // L4 Upgrade Fee seeks 4th Upline.
        // That IS A.

        console.log("\n--- TRIGGER: Node E Upgrades to Level 4 (Paying 4th Upline) ---");
        const L4_FEE = 27000; // Diamond Fee?
        console.log(`Node E paying Level 4 Fee (${L4_FEE})... seeking 4th Upline (A).`);
        // @ts-ignore
        await financialService.passUpUpgradeFee(nodeE, L4_FEE, 4, 'SELF', client);

        const walletA_2 = await client.query("SELECT wallet_balance FROM Nodes WHERE id = $1", [nodeA]);
        console.log(`Node A Balance: ${walletA_2.rows[0].wallet_balance} (Expected > 0)`);

        await client.query('ROLLBACK');
        console.log("\n--- SIMULATION COMPLETE (Rolled Back) ---");

    } catch (e) {
        console.error(e);
        await client.query('ROLLBACK');
    } finally {
        client.release();
        process.exit();
    }
}

runSimulation();
