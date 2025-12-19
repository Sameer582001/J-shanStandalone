
import pool from '../config/db.js';
import { FinancialService } from '../services/FinancialService.js';
import { NodeService } from '../services/NodeService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logPath = path.resolve(__dirname, 'depth_test_log.txt');

async function testDepthPayment() {
    const client = await pool.connect();
    const finService = new FinancialService();
    // nodeService unused locally but imported just in case

    try {
        fs.writeFileSync(logPath, "--- DEPTH PAYMENT TEST ---\n");
        await client.query('BEGIN');

        // 1. Create Root
        const rootRes = await client.query(`
            INSERT INTO Nodes (referral_code, owner_user_id, status, wallet_balance, current_level, self_pool_parent_id, auto_pool_parent_id) 
            VALUES ('TEST-ROOT', 1, 'ACTIVE', 0.00, 1, NULL, NULL) RETURNING id
        `);
        const rootId = rootRes.rows[0].id;
        fs.appendFileSync(logPath, `Root: ${rootId}\n`);

        // 2. Create Gen 1 (Should pay Silver/L1) - Depth 1
        const gen1Res = await client.query(`
            INSERT INTO Nodes (referral_code, owner_user_id, status, wallet_balance, current_level, self_pool_parent_id, auto_pool_parent_id) 
            VALUES ('TEST-G1', 1, 'ACTIVE', 0.00, 1, $1, $1) RETURNING id
        `, [rootId]);
        const gen1Id = gen1Res.rows[0].id;

        fs.appendFileSync(logPath, `\n--- Processing Gen 1 (${gen1Id}) ---\n`);
        await finService.distributeNewNodeCommissions(gen1Id, 'SELF', client);

        // 3. Create Gen 2 (Should pay Gold/L2) - Depth 2
        const gen2Res = await client.query(`
            INSERT INTO Nodes (referral_code, owner_user_id, status, wallet_balance, current_level, self_pool_parent_id, auto_pool_parent_id) 
            VALUES ('TEST-G2', 1, 'ACTIVE', 0.00, 1, $1, $1) RETURNING id
        `, [gen1Id]);
        const gen2Id = gen2Res.rows[0].id;

        fs.appendFileSync(logPath, `\n--- Processing Gen 2 (${gen2Id}) ---\n`);
        await finService.distributeNewNodeCommissions(gen2Id, 'SELF', client);

        // 4. Create Gen 3 (Should pay Gold/L2) - Depth 3
        const gen3Res = await client.query(`
            INSERT INTO Nodes (referral_code, owner_user_id, status, wallet_balance, current_level, self_pool_parent_id, auto_pool_parent_id) 
            VALUES ('TEST-G3', 1, 'ACTIVE', 0.00, 1, $1, $1) RETURNING id
        `, [gen2Id]);
        const gen3Id = gen3Res.rows[0].id;

        fs.appendFileSync(logPath, `\n--- Processing Gen 3 (${gen3Id}) ---\n`);
        await finService.distributeNewNodeCommissions(gen3Id, 'SELF', client);

        // 5. Check Root LevelProgress
        // Should have L1 (500) and L2 (1000 from Gen2 + 1000 from Gen3 = 2000)

        const lpRes = await client.query("SELECT level, total_revenue, buckets FROM LevelProgress WHERE node_id = $1 ORDER BY level ASC", [rootId]);

        fs.appendFileSync(logPath, "\n--- Root LevelProgress ---\n");
        if (lpRes.rows.length === 0) {
            fs.appendFileSync(logPath, "No LevelProgress found for Root!\n");
        }
        lpRes.rows.forEach(r => {
            fs.appendFileSync(logPath, `Level ${r.level}: Revenue ${r.total_revenue} | Buckets: ${JSON.stringify(r.buckets)}\n`);
        });

        await client.query('ROLLBACK');

    } catch (e: any) {
        fs.appendFileSync(logPath, `ERROR: ${e.message}\n${e.stack}\n`);
        await client.query('ROLLBACK');
    } finally {
        client.release();
        process.exit();
    }
}

testDepthPayment();
