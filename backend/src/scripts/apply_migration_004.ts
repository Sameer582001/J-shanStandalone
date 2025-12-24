
import { query } from '../config/db.js';

const createTableQuery = `
CREATE TABLE IF NOT EXISTS EmailVerifications (
    email VARCHAR(255) PRIMARY KEY,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

async function applyMigration() {
    try {
        console.log('Applying migration 004...');
        await query(createTableQuery);
        console.log('Migration 004 applied successfully: EmailVerifications table created.');
        process.exit(0);
    } catch (error) {
        console.error('Error applying migration:', error);
        process.exit(1);
    }
}

applyMigration();
