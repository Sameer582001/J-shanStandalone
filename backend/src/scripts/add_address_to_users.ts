
import { query } from '../config/db.js';

const runMigration = async () => {
    try {
        console.log('Adding address columns to Users table...');

        await query(`
            ALTER TABLE Users 
            ADD COLUMN IF NOT EXISTS address_line TEXT,
            ADD COLUMN IF NOT EXISTS city TEXT,
            ADD COLUMN IF NOT EXISTS state TEXT,
            ADD COLUMN IF NOT EXISTS zip_code TEXT,
            ADD COLUMN IF NOT EXISTS address_locked BOOLEAN DEFAULT FALSE
        `);

        console.log('Address columns added successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

runMigration();
