import { Worker } from 'bullmq';
import pool, { query } from '../config/db.js';
import { FinancialService } from '../services/FinancialService.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const config = require('../config/plan_config.json');

const financialService = new FinancialService();

// BFS to find the next available spot in the Global Auto Pool
async function findGlobalPlacement(): Promise<number> {
    // 1. Get the Root Node (Anchor)
    // The Root Node is the one with NO self_pool_parent and NO auto_pool_parent (or special code JSE-ROOT)
    const rootRes = await query("SELECT id FROM Nodes WHERE referral_code = 'JSE-ROOT'");
    if (rootRes.rows.length === 0) {
        throw new Error('System Root Node (JSE-ROOT) not found! cannot place in Auto Pool.');
    }
    const rootId = rootRes.rows[0].id;

    const queue = [rootId];

    while (queue.length > 0) {
        const currentId = queue.shift()!;

        // Count children in Auto Pool
        const res = await query('SELECT COUNT(*) as count FROM Nodes WHERE auto_pool_parent_id = $1', [currentId]);
        const count = parseInt(res.rows[0].count);

        if (count < 3) {
            return currentId;
        }

        // If full, add children to queue (standard Level Order Traversal)
        const childrenRes = await query('SELECT id FROM Nodes WHERE auto_pool_parent_id = $1 ORDER BY created_at ASC', [currentId]);
        for (const row of childrenRes.rows) {
            queue.push(row.id);
        }
    }

    throw new Error('Global Matrix full or critical error');
}

export const initAutoPoolWorker = () => {
    const worker = new Worker('auto-pool-queue', async job => {
        console.log(`Processing Auto Pool Placement for Node ID: ${job.data.nodeId}`);
        const { nodeId } = job.data;
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // 1. Find best parent
            // We can recycle findGlobalPlacement logic but it uses 'query' (pool).
            // Better to pass client or ensure logic is safe.
            // For now, let's keep findGlobalPlacement separate (it's read only mostly until returned).
            // Wait, we need to lock?
            // "Global Matrix full" is rare.
            // Let's call findGlobalPlacement() then UPDATE with client.

            const parentId = await findGlobalPlacement();

            // 2. Update Node
            await client.query('UPDATE Nodes SET auto_pool_parent_id = $1 WHERE id = $2', [parentId, nodeId]);
            console.log(`Placed Node ${nodeId} under Auto Pool Parent ${parentId}`);

            // 3. Process Financials (AUTO POOL INCOME)
            // Fee: 500 (from config)
            const AUTO_FEE = config.fees.distributions.auto_pool_fee;
            await financialService.processIncome(parentId, AUTO_FEE, 1, 'AUTO', client);

            await client.query('COMMIT');

        } catch (error) {
            await client.query('ROLLBACK');
            console.error(`Failed to place Node ${nodeId} in Auto Pool:`, error);
            throw error; // Retry job
        } finally {
            client.release();
        }
    }, {
        connection: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379')
        }
    });

    worker.on('completed', job => {
        console.log(`Job ${job.id} completed!`);
    });

    worker.on('failed', (job, err) => {
        console.error(`Job ${job?.id} failed with ${err.message}`);
    });

    console.log('Auto Pool Worker initialized');
};
