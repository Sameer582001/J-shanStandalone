
import pool from '../config/db.js';
import { FinancialService } from '../services/FinancialService.js';

async function debugIncomeTrace() {
    const client = await pool.connect();
    // Local instance
    const finService = new FinancialService();

    try {
        console.log("--- DEBUG START ---");

        // 1. Get Root
        const rootRes = await client.query("SELECT id FROM Nodes WHERE referral_code = 'JSE-ROOT'");
        if (rootRes.rows.length === 0) throw new Error("Root not found");
        const rootId = rootRes.rows[0].id;
        console.log(`Root ID: ${rootId}`);

        // 2. Check Level Progress
        const progRes = await client.query("SELECT id, total_revenue, buckets FROM LevelProgress WHERE node_id = $1 AND pool_type = 'AUTO' AND level = 2", [rootId]);
        if (progRes.rows.length > 0) {
            console.log("Current Progress:", JSON.stringify(progRes.rows[0]));
        } else {
            console.log("No Progress found for L2 Auto.");
        }

        // 3. Inject
        console.log("Injecting 5000...");
        await client.query('BEGIN');
        await finService.processIncome(rootId, 5000, 2, 'AUTO', client);

        // 4. Result
        const count = finService.createdRebirthIds.length;
        console.log(`Rebirths Generated: ${count}`);

        await client.query('ROLLBACK');

    } catch (e: any) {
        console.log("ERROR CAUGHT:");
        console.log(e.message);
        console.log(e.stack); // print stack
    } finally {
        client.release();
        process.exit();
    }
}

debugIncomeTrace();
