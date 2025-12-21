
import { query } from '../config/db.js';

async function runMigration() {
    try {
        console.log('Starting migration...');

        // Add service_charge column
        await query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='withdrawals' AND column_name='service_charge') THEN
                    ALTER TABLE Withdrawals ADD COLUMN service_charge DECIMAL(10,2) DEFAULT 0;
                    RAISE NOTICE 'Added service_charge column';
                END IF;
            END
            $$;
        `);

        // Add tds_charge column
        await query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='withdrawals' AND column_name='tds_charge') THEN
                    ALTER TABLE Withdrawals ADD COLUMN tds_charge DECIMAL(10,2) DEFAULT 0;
                    RAISE NOTICE 'Added tds_charge column';
                END IF;
            END
            $$;
        `);

        // Add net_amount column
        await query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='withdrawals' AND column_name='net_amount') THEN
                    ALTER TABLE Withdrawals ADD COLUMN net_amount DECIMAL(10,2) DEFAULT 0;
                    RAISE NOTICE 'Added net_amount column';
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
