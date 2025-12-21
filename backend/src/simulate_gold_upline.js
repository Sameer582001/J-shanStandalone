import dotenv from 'dotenv';
import pg from 'pg';
import { FinancialService } from './services/FinancialService.js';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: process.env.POSTGRES_PORT ? parseInt(process.env.POSTGRES_PORT, 10) : undefined,
});

async function simulateGoldUpline() {
    const client = await pool.connect();
    const financialService = new FinancialService();

    try {
        console.log("=== Simulating Gold Upline Trigger for Node 5 ===");

        // Ensure Node 5 exists and has parents
        const node5 = await client.query('SELECT * FROM Nodes WHERE id = 5');
        if (node5.rows.length === 0) {
            console.log("Node 5 does not exist. Cannot run simulation.");
            return;
        }
        console.log(`Node 5 Sponsor: ${node5.rows[0].sponsor_node_id}`);

        await client.query('BEGIN');

        // Force reset Level 2 to "Buckets almost full, Upline empty"
        // We want to trigger Upline fill.
        // Gold Upline is 2000.
        // Let's set Revenue 0. Fill Upline directly using processIncome?
        // No, processIncome fills in priority.
        // Upgrade(3000 -> 1), Rebirth(1000 -> 2), System(2000 -> 3), Upline(2000 -> 4).
        // So we need 3000+1000+2000 = 6000 filled first.

        const buckets = JSON.stringify({
            upgrade: 3000,
            rebirth: 1000,
            system: 2000,
            upline: 0 // Empty
        });

        await client.query(`
            INSERT INTO LevelProgress (node_id, level, pool_type, total_revenue, buckets, is_completed, created_at, updated_at)
            VALUES (5, 2, 'AUTO', 6000, '${buckets}', FALSE, NOW(), NOW())
            ON CONFLICT (node_id, level, pool_type) 
            DO UPDATE SET total_revenue = 6000, buckets = '${buckets}', is_completed = FALSE
        `);

        console.log("State Set: Revenue 6000. Upgrade/Rebirth/System Full. Next 2000 goes to Upline.");

        // Simulate incoming 2000
        await financialService.processIncome(5, 2000, 2, 'AUTO', client);

        await client.query('COMMIT');
        console.log("Simulation Complete.");

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Simulation Error:", error);
    } finally {
        client.release();
        await pool.end();
    }
}

simulateGoldUpline();
