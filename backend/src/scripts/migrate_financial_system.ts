
import { query } from '../config/db.js';
import 'dotenv/config';

async function migrate() {
    console.log('--- Migrating Database for Financial Level System ---');
    try {
        await query('BEGIN');

        // 1. Update Nodes Table
        console.log('Adding columns to Nodes table...');
        await query(`
            ALTER TABLE Nodes 
            ADD COLUMN IF NOT EXISTS current_level INT DEFAULT 1,
            ADD COLUMN IF NOT EXISTS is_rebirth BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS origin_node_id INT REFERENCES Nodes(id)
        `);

        // 2. Create LevelProgress Table
        console.log('Creating LevelProgress table...');
        await query(`
            CREATE TABLE IF NOT EXISTS LevelProgress (
                id SERIAL PRIMARY KEY,
                node_id INT REFERENCES Nodes(id) NOT NULL,
                level INT NOT NULL,
                total_revenue NUMERIC(15, 2) DEFAULT 0.00,
                buckets JSONB DEFAULT '{}',
                is_completed BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(node_id, level)
            )
        `);

        await query('COMMIT');
        console.log('Migration successful.');
    } catch (e) {
        await query('ROLLBACK');
        console.error('Migration failed:', e);
    }
    process.exit();
}

migrate();
