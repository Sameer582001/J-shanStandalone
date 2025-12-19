
import pool from '../config/db.js';
import { FinancialService } from '../services/FinancialService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logPath = path.resolve(__dirname, 'self_rebirth_log.txt');

async function testSelfRebirth() {
    const client = await pool.connect();
    const finService = new FinancialService();

    try {
        fs.writeFileSync(logPath, "--- SELF POOL REBIRTH TEST ---\n");
        await client.query('BEGIN');

        // 1. Create Mock Node
        // Need to ensure it has a self_pool_parent_id so it belongs somewhere? 
        // Or generic root is fine.
        const insertRes = await client.query(`
            INSERT INTO Nodes (referral_code, owner_user_id, status, wallet_balance, current_level, self_pool_parent_id) 
            VALUES ('TEST-SELF-1', 1, 'ACTIVE', 0.00, 2, NULL) RETURNING id
        `);
        const nodeId = insertRes.rows[0].id;
        fs.appendFileSync(logPath, `Created Node: ${nodeId}\n`);

        // 2. Inject Level 2 Income for SELF Pool
        // Config L2: Rebirth Count = 2. Cost = 500. Total 1000.
        // We inject 5000 to cover Upgrade + Rebirths.
        fs.appendFileSync(logPath, "Injecting 5000 to Level 2 (SELF)...\n");
        await finService.processIncome(nodeId, 5000, 2, 'SELF', client);

        // 3. Check Memory Results
        const memCount = finService.createdRebirthIds.length;
        fs.appendFileSync(logPath, `Memory Rebirths: ${memCount}\n`);

        // 4. Check DB for Rebirths with correct parentage
        // They should have `sponsor_node_id = nodeId` AND `self_pool_parent_id` inside correct tree.
        const dbRes = await client.query("SELECT id, self_pool_parent_id FROM Nodes WHERE origin_node_id = $1", [nodeId]);
        const dbRows = dbRes.rows;
        fs.appendFileSync(logPath, `DB Rebirths Found: ${dbRows.length}\n`);

        dbRows.forEach(row => {
            fs.appendFileSync(logPath, `Rebirth ${row.id}: Parent ${row.self_pool_parent_id} (Should be descendent of ${nodeId})\n`);
        });

        // 5. Verify Parentage (Since Node is new/root, they should fall directly under it)
        const childCheck = await client.query("SELECT COUNT(*) FROM Nodes WHERE self_pool_parent_id = $1", [nodeId]);
        fs.appendFileSync(logPath, `Direct Children of ${nodeId}: ${childCheck.rows[0].count} (Should be 2 if placed under root)\n`);

        if (memCount === 2 && dbRows.length === 2 && parseInt(childCheck.rows[0].count) === 2) {
            fs.appendFileSync(logPath, "SUCCESS: Self Pool Rebirths placed correctly.\n");
        } else {
            console.log("Details:", memCount, dbRows.length, childCheck.rows[0].count);
            fs.appendFileSync(logPath, "FAILURE: Mismatch in counts or placement.\n");
        }

        await client.query('ROLLBACK');

    } catch (e: any) {
        fs.appendFileSync(logPath, `ERROR: ${e.message}\n${e.stack}\n`);
        await client.query('ROLLBACK');
    } finally {
        client.release();
        process.exit();
    }
}

testSelfRebirth();
