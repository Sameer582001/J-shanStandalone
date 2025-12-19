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

async function simulateIncome() {
    const client = await pool.connect();
    const financialService = new FinancialService();

    try {
        console.log("=== Simulating 3rd Node Income for JSE-ROOT ===");

        // We simulate the 3rd payment of 500
        // Currently Revenue is 1500 (Full).
        // To verify LOGS, we might need to reset revenue to 1000 temporarily?

        await client.query('BEGIN');

        // Force reset Level 2 to "Almost Full" state
        // Revenue 8000. All buckets full except profit.
        // Buckets: Upgrade(3000), Rebirth(1000), System(2000), Upline(2000) = 8000.
        const buckets = JSON.stringify({
            upgrade: 3000,
            rebirth: 1000,
            system: 2000,
            upline: 2000
        });

        await client.query(`
            UPDATE LevelProgress 
            SET total_revenue = 8000, 
                buckets = '${buckets}', 
                is_completed = FALSE 
            WHERE node_id = 1 AND level = 2 AND pool_type = 'SELF'
        `);
        console.log("State Reset: Gold Level Revenue 8000. Next 1000 should trigger Profit.");

        // Simulate incoming 1000 (Gold Upgrade Fee is 1000? No, wait. 
        // Incoming per node for Gold is 1000. Correct.
        // The payment comes from an upgrading node.

        await financialService.processIncome(1, 1000, 2, 'SELF', client);

        await client.query('COMMIT');
        console.log("Gold Simulation Complete. Check trace logs.");

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Simulation Error:", error);
    } finally {
        client.release();
        await pool.end();
    }
}

simulateIncome();
