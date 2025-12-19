
import pool from '../config/db.js';
import { FinancialService } from '../services/FinancialService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logPath = path.resolve(__dirname, 'verification_output.txt');

async function verifyFinal() {
    const client = await pool.connect();
    // Instantiate carefully
    let finService;
    try {
        finService = new FinancialService();
    } catch (e: any) {
        fs.writeFileSync(logPath, `INSTANTIATION_ERROR: ${e.message}\n${e.stack}`);
        process.exit(1);
    }

    try {
        fs.writeFileSync(logPath, "--- START ---\n");
        await client.query('BEGIN');

        // 1. Create Mock Node
        // IMPORTANT: Give it an auto_pool_parent_id if needed? 
        // For Rebirth bucket, NO. PassUpUpgrade uses it, but null is valid.
        const insertRes = await client.query(`
            INSERT INTO Nodes (referral_code, owner_user_id, status, wallet_balance, current_level, auto_pool_parent_id) 
            VALUES ('TEST-FINAL-LOG', 1, 'ACTIVE', 0.00, 2, NULL) RETURNING id
        `);
        const nodeId = insertRes.rows[0].id;
        fs.appendFileSync(logPath, `Created Node: ${nodeId}\n`);

        // 2. Inject Income
        fs.appendFileSync(logPath, "Injecting 5000...\n");
        await finService.processIncome(nodeId, 5000, 2, 'AUTO', client);

        // 3. Check Memory
        const memCount = finService.createdRebirthIds.length;
        fs.appendFileSync(logPath, `Memory Rebirths: ${memCount}\n`);

        // 4. Check DB
        const dbRes = await client.query("SELECT COUNT(*) FROM Nodes WHERE origin_node_id = $1 AND is_rebirth = TRUE", [nodeId]);
        const dbCount = parseInt(dbRes.rows[0].count);
        fs.appendFileSync(logPath, `DB Rebirths: ${dbCount}\n`);

        if (memCount === 2 && dbCount === 2) {
            fs.appendFileSync(logPath, "SUCCESS\n");
        } else {
            fs.appendFileSync(logPath, "FAILURE_MISMATCH\n");
        }

        await client.query('ROLLBACK');

    } catch (e: any) {
        fs.appendFileSync(logPath, `RUNTIME_ERROR: ${e.message}\n${e.stack}\n`);
        await client.query('ROLLBACK');
    } finally {
        client.release();
        process.exit();
    }
}

verifyFinal();
