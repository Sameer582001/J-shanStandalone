
import { FinancialService } from '../services/FinancialService.js';
import pool from '../config/db.js';

async function runTest() {
    const client = await pool.connect();
    try {
        console.log("--- STARTING REBIRTH LOGIC TEST ---");
        await client.query('BEGIN');

        // 1. Create Test User & Node
        const userRes = await client.query("INSERT INTO Users (auth_id, full_name, email, mobile, password_hash, role) VALUES ('rebirth_test', 'Rebirth Test', 'rebirth@test.com', '9999991111', 'hash', 'USER') RETURNING id");
        const userId = userRes.rows[0].id;

        const nodeRes = await client.query(
            `INSERT INTO Nodes (referral_code, owner_user_id, status, wallet_balance, current_level) 
             VALUES ('TEST-RB-1', $1, 'ACTIVE', 0.00, 1) RETURNING id`,
            [userId]
        );
        const nodeId = nodeRes.rows[0].id;
        console.log(`Created Test Node: ${nodeId}`);

        // 2. Trigger Level 2 Income
        // Level 2 Config: Upgrade 3000, Rebirth 1000 (2 * 500)
        // We send 4500 to ensure we cover both.

        const finService = new FinancialService();

        console.log("Processing Income: 4500 for Level 2 (Pool: SELF)...");
        await finService.processIncome(nodeId, 4500, 2, 'SELF', client);

        // 3. Check FinancialService State
        console.log(`Created Rebirth IDs (In Memory): ${finService.createdRebirthIds.length}`);
        console.log(`IDs: ${finService.createdRebirthIds.join(', ')}`);

        // 4. Check DB
        const dbRebirths = await client.query("SELECT * FROM Nodes WHERE origin_node_id = $1 AND is_rebirth = TRUE", [nodeId]);
        console.log(`Rebirths in DB: ${dbRebirths.rows.length}`);

        if (finService.createdRebirthIds.length === 2 && dbRebirths.rows.length === 2) {
            console.log("SUCCESS: Rebirth Logic Works Correctly.");
        } else {
            console.log("FAILURE: Count mismatch.");
        }

        await client.query('ROLLBACK');

    } catch (e) {
        console.error(e);
        await client.query('ROLLBACK');
    } finally {
        client.release();
        process.exit();
    }
}

runTest();
