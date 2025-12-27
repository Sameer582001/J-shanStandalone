import pool from '../config/db.js';

async function migrate() {
    try {
        console.log('Starting migration...');
        await pool.query(`
            ALTER TABLE Nodes 
            ADD COLUMN IF NOT EXISTS custom_name VARCHAR(100);
        `);
        console.log('Migration successful: Added custom_name column.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
