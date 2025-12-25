
import { query } from '../config/db.js';

async function updateSchema() {
    console.log('🔄 Checking Database Schema...');

    try {
        // --- 1. Users Table Columns ---
        await query(`ALTER TABLE Users ADD COLUMN IF NOT EXISTS account_holder_name VARCHAR(255)`);
        await query(`ALTER TABLE Users ADD COLUMN IF NOT EXISTS account_number VARCHAR(50)`);
        await query(`ALTER TABLE Users ADD COLUMN IF NOT EXISTS ifsc_code VARCHAR(20)`);
        await query(`ALTER TABLE Users ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100)`);
        await query(`ALTER TABLE Users ADD COLUMN IF NOT EXISTS upi_id VARCHAR(50)`);
        await query(`ALTER TABLE Users ADD COLUMN IF NOT EXISTS bank_details_locked BOOLEAN DEFAULT FALSE`);
        await query(`ALTER TABLE Users ADD COLUMN IF NOT EXISTS nominee_name VARCHAR(255)`);
        await query(`ALTER TABLE Users ADD COLUMN IF NOT EXISTS nominee_relation VARCHAR(100)`);
        await query(`ALTER TABLE Users ADD COLUMN IF NOT EXISTS profile_image VARCHAR(255)`);
        console.log('✅ Users Table Updated');

        // --- 2. Rename Old Tables if they exist ---
        try {
            await query(`ALTER TABLE SupportTickets RENAME TO Tickets`);
            console.log('✅ Renamed SupportTickets to Tickets');
        } catch (e) { /* Ignore if Tickets already exists */ }

        try {
            await query(`ALTER TABLE ClaimRequests RENAME TO FundRequests`);
            console.log('✅ Renamed ClaimRequests to FundRequests');
        } catch (e) { /* Ignore if FundRequests already exists */ }


        // --- 3. Tickets Table Columns ---
        await query(`CREATE TABLE IF NOT EXISTS Tickets (id SERIAL PRIMARY KEY)`); // Create if missing
        await query(`ALTER TABLE Tickets ADD COLUMN IF NOT EXISTS description TEXT`);
        await query(`ALTER TABLE Tickets ADD COLUMN IF NOT EXISTS admin_response TEXT`);
        await query(`ALTER TABLE Tickets ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP WITH TIME ZONE`);
        // Relax status check constraint if it conflicts (Old ENUM vs new VARCHAR)
        // Dropping constraint is safer than complex casting
        try {
            await query(`ALTER TABLE Tickets DROP CONSTRAINT IF EXISTS supporttickets_status_check`);
        } catch (e) { }
        console.log('✅ Tickets Table Updated');

        // --- 4. FundRequests Table Columns ---
        await query(`CREATE TABLE IF NOT EXISTS FundRequests (id SERIAL PRIMARY KEY)`);
        await query(`ALTER TABLE FundRequests ADD COLUMN IF NOT EXISTS utr_number VARCHAR(50)`);
        // If utr_number exists but not unique, make it unique?
        // await query(`ALTER TABLE FundRequests ADD CONSTRAINT unique_utr UNIQUE (utr_number)`); // Optional
        console.log('✅ FundRequests Table Updated');

        // --- 5. Gallery Table ---
        await query(`CREATE TABLE IF NOT EXISTS Gallery (id SERIAL PRIMARY KEY)`);
        try {
            await query(`ALTER TABLE Gallery RENAME COLUMN uploaded_at TO created_at`);
        } catch (e) { /* Ignore */ }
        await query(`ALTER TABLE Gallery ADD COLUMN IF NOT EXISTS caption VARCHAR(255)`);
        console.log('✅ Gallery Table Updated');

        // --- 6. News Table ---
        await query(`CREATE TABLE IF NOT EXISTS News (id SERIAL PRIMARY KEY)`);
        await query(`ALTER TABLE News ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE`);
        console.log('✅ News Table Updated');

        console.log('🎉 MASTER MIGRATION COMPLETE!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Migration Failed:', error);
        process.exit(1);
    }
}

updateSchema();
