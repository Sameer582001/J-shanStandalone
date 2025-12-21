
import { query } from '../config/db.js';

async function runMigration() {
    try {
        console.log('Starting migration to add bank details to Users...');

        // Add columns if they don't exist
        await query(`
            DO $$
            BEGIN
                -- Account Holder Name
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='account_holder_name') THEN
                    ALTER TABLE Users ADD COLUMN account_holder_name VARCHAR(255);
                    RAISE NOTICE 'Added account_holder_name column';
                END IF;

                -- Account Number
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='account_number') THEN
                    ALTER TABLE Users ADD COLUMN account_number VARCHAR(100);
                    RAISE NOTICE 'Added account_number column';
                END IF;

                -- IFSC Code
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='ifsc_code') THEN
                    ALTER TABLE Users ADD COLUMN ifsc_code VARCHAR(20);
                    RAISE NOTICE 'Added ifsc_code column';
                END IF;

                -- Bank Name
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='bank_name') THEN
                    ALTER TABLE Users ADD COLUMN bank_name VARCHAR(255);
                    RAISE NOTICE 'Added bank_name column';
                END IF;

                -- Locked Flag
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='bank_details_locked') THEN
                    ALTER TABLE Users ADD COLUMN bank_details_locked BOOLEAN DEFAULT FALSE;
                    RAISE NOTICE 'Added bank_details_locked column';
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
