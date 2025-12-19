import pool, { query } from '../config/db.js';
import { FinancialService } from './FinancialService.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const config = require('../config/plan_config.json');

export class CronService {
    private isRunning = false;

    constructor() {
        console.log("CronService Initialized.");
    }

    start() {
        // Run Orphan Monitor every 60 seconds
        setInterval(this.monitorOrphans.bind(this), 60000); // 1 minute
        console.log("Started Orphan Monitor (Interval: 60s)");

        // Run immediately on start to catch up
        this.monitorOrphans();
    }

    private async monitorOrphans() {
        if (this.isRunning) return; // Prevent Overlap
        this.isRunning = true;

        let client;
        try {
            client = await pool.connect();
            // Find Orphans (nodes created > 10 seconds ago to allow normal queue usage)
            // exclude Roots
            const res = await client.query(
                `SELECT id, referral_code FROM Nodes 
                 WHERE auto_pool_parent_id IS NULL 
                 AND referral_code NOT IN ('JSE-ROOT', 'JSE-AUTO-ROOT')
                 AND created_at < NOW() - INTERVAL '30 seconds'
                 ORDER BY created_at ASC 
                 LIMIT 50`
            );

            if (res.rows.length === 0) {
                this.isRunning = false;
                client.release();
                return;
            }

            console.log(`[Cron] Found ${res.rows.length} Orphans. Attempting fix...`);

            // Fix Logic
            const financialService = new FinancialService();

            for (const orphan of res.rows) {
                try {
                    // Double check (race condition check)
                    const check = await client.query('SELECT auto_pool_parent_id FROM Nodes WHERE id = $1', [orphan.id]);
                    if (check.rows[0].auto_pool_parent_id !== null) continue;

                    await client.query('BEGIN');

                    // Find Global Placement (Reusing logic logic or safe query)
                    const parentId = await this.findGlobalPlacement(client);

                    // Update
                    await client.query(
                        'UPDATE Nodes SET auto_pool_parent_id = $1 WHERE id = $2',
                        [parentId, orphan.id]
                    );

                    // Trigger Financials (New Method)
                    // This handles commission distribution AND rebirth generation
                    await financialService.distributeNewNodeCommissions(orphan.id, 'AUTO', client);

                    await client.query('COMMIT');
                    console.log(`[Cron] Fixed Orphan ${orphan.referral_code} -> Parent ${parentId}`);

                } catch (err: any) {
                    await client.query('ROLLBACK');
                    console.error(`[Cron] Failed to fix orphan ${orphan.referral_code}:`, err.message);
                }
            }

        } catch (error) {
            console.error("[Cron] Monitor Error:", error);
        } finally {
            this.isRunning = false;
            if (client) client.release();
        }
    }

    // BFS to find the next available spot in the Global Auto Pool
    private async findGlobalPlacement(client: any): Promise<number> {
        const q = client.query.bind(client);

        // 1. Get the Root Node (Anchor)
        let rootId;
        const rootRes = await q("SELECT id FROM Nodes WHERE referral_code = 'JSE-ROOT'");
        if (rootRes.rows.length > 0) rootId = rootRes.rows[0].id;
        else {
            // Fallback
            const altRes = await q("SELECT id FROM Nodes WHERE referral_code = 'JSE-AUTO-ROOT'");
            if (altRes.rows.length > 0) rootId = altRes.rows[0].id;
            else throw new Error("JSE-ROOT not found");
        }

        const queue = [rootId];

        while (queue.length > 0) {
            const currentId = queue.shift()!;

            // Count children in Auto Pool
            const res = await q('SELECT COUNT(*) as count FROM Nodes WHERE auto_pool_parent_id = $1', [currentId]);
            const count = parseInt(res.rows[0].count);

            if (count < 3) { // Hardcoded 3 for Auto Pool Width
                return currentId;
            }

            // If full, add children to queue
            const childrenRes = await q('SELECT id FROM Nodes WHERE auto_pool_parent_id = $1 ORDER BY created_at ASC', [currentId]);
            for (const row of childrenRes.rows) {
                queue.push(row.id);
            }
        }

        throw new Error('Global Matrix full or critical error');
    }
}
