
import { query } from '../config/db.js';

async function runMigration() {
    try {
        console.log('Starting migration to add transaction_id to Withdrawals...');

        // Add transaction_id column
        await query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='withdrawals' AND column_name='transaction_id') THEN
                    ALTER TABLE Withdrawals ADD COLUMN transaction_id INTEGER REFERENCES Transactions(id);
                    RAISE NOTICE 'Added transaction_id column';
                END IF;
            END
            $$;
        `);

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
