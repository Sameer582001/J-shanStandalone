
import pool from '../config/db.js';

async function migrate() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log("Adding new level columns...");

        // 1. Add Columns
        await client.query(`
            ALTER TABLE Nodes 
            ADD COLUMN IF NOT EXISTS current_level_self INTEGER DEFAULT 1,
            ADD COLUMN IF NOT EXISTS current_level_auto INTEGER DEFAULT 1
        `);

        // 2. Migrate Data (Assuming current data is primary Self Pool data? Or just sync both)
        // Since we had a conflated system, let's init both to the existing value to be safe, calculation logic will fix deviations later.
        await client.query(`
            UPDATE Nodes 
            SET current_level_self = current_level, 
                current_level_auto = current_level
        `);

        console.log("Columns added and populated.");
        await client.query('COMMIT');

    } catch (e) {
        await client.query('ROLLBACK');
        console.error(e);
    } finally {
        client.release();
        process.exit();
    }
}

migrate();
