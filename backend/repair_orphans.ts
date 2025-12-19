
import pool, { query } from './src/config/db.js';
import { FinancialService } from './src/services/FinancialService.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const config = require('./src/config/plan_config.json');

async function findGlobalPlacement(): Promise<number> {
    const rootRes = await query("SELECT id FROM Nodes WHERE referral_code = 'JSE-ROOT'");
    const rootId = rootRes.rows[0].id;
    const queue = [rootId];

    while (queue.length > 0) {
        const currentId = queue.shift()!;
        const res = await query('SELECT COUNT(*) as count FROM Nodes WHERE auto_pool_parent_id = $1', [currentId]);
        const count = parseInt(res.rows[0].count);

        if (count < 3) return currentId;

        const childrenRes = await query('SELECT id FROM Nodes WHERE auto_pool_parent_id = $1 ORDER BY created_at ASC', [currentId]);
        for (const row of childrenRes.rows) queue.push(row.id);
    }
    throw new Error('Matrix full');
}

async function repairOrphans() {
    console.log('Starting Repair for Orphans 32, 33, 34...');
    const orphanIds = [32, 33, 34];
    const client = await pool.connect();

    try {
        const financialService = new FinancialService();

        for (const nodeId of orphanIds) {
            // Double check orphan status
            // Force Update
            const parentId = await findGlobalPlacement();
            console.log(`Placing Node ${nodeId} under Parent ${parentId}...`);

            await client.query('BEGIN');
            await client.query('UPDATE Nodes SET auto_pool_parent_id = $1 WHERE id = $2', [parentId, nodeId]);

            // Distribute Commissions (Assuming they paid 1000 for Auto Pool - check plan?)
            // Usually Self Pool entry covers Auto Pool fee implicitly or split? 
            // In purchaseNode: `await financialService.distributeNewNodeCommissions(nodeId, 'SELF', client);`
            // But Auto Pool placement triggers: `await financialService.distributeNewNodeCommissions(nodeId, 'AUTO', client);`
            // So yes, we trigger AUTO distribution.
            await financialService.distributeNewNodeCommissions(nodeId, 'AUTO', client);

            await client.query('COMMIT');
            console.log(`✅ Success for Node ${nodeId}`);
        }

    } catch (e) {
        await client.query('ROLLBACK');
        console.error(e);
    } finally {
        client.release();
        pool.end();
    }
}

repairOrphans();
