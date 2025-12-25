
import { query } from '../config/db.js';

async function updateSchema() {
    console.log('🔄 Checking Database Schema...');

    try {
        // 1. Create News Table if not exists
        await query(`
            CREATE TABLE IF NOT EXISTS News (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                is_urgent BOOLEAN DEFAULT FALSE,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ News Table Checked/Created');

        // 1.5 Fix News Table Column (is_active)
        try {
            await query(`ALTER TABLE News ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;`);
            console.log('✅ ACtivity Column Checked in News');
        } catch (e) {
            console.log('ℹ️ News column might already exist');
        }

        // 2. Create ClaimRequests (Funds) Table
        await query(`
            CREATE TYPE claim_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
        `).catch(() => console.log('ℹ️ claim_status ENUM might already exist'));

        await query(`
            CREATE TABLE IF NOT EXISTS ClaimRequests (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES Users(id),
                node_id INTEGER REFERENCES Nodes(id),
                claim_type VARCHAR(50),
                amount DECIMAL(15, 2),
                status claim_status DEFAULT 'PENDING',
                admin_remarks TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ ClaimRequests Table Checked/Created');

        // 3. Create SupportTickets Table
        await query(`
            CREATE TYPE ticket_status AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
        `).catch(() => console.log('ℹ️ ticket_status ENUM might already exist'));

        await query(`
            CREATE TABLE IF NOT EXISTS SupportTickets (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES Users(id),
                subject VARCHAR(255) NOT NULL,
                status ticket_status DEFAULT 'OPEN',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ SupportTickets Table Checked/Created');

        // 4. Create SupportMessages Table
        await query(`
            CREATE TABLE IF NOT EXISTS SupportMessages (
                id SERIAL PRIMARY KEY,
                ticket_id INTEGER REFERENCES SupportTickets(id) ON DELETE CASCADE,
                sender_id INTEGER REFERENCES Users(id),
                message TEXT NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ SupportMessages Table Checked/Created');

        // 5. Create Documents Table
        await query(`
            CREATE TABLE IF NOT EXISTS Documents (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                file_url VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Documents Table Checked/Created');

        // 6. Create Gallery Table
        await query(`
             CREATE TABLE IF NOT EXISTS Gallery (
                id SERIAL PRIMARY KEY,
                image_url VARCHAR(255) NOT NULL,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Gallery Table Checked/Created');

        console.log('🎉 Schema Update Complete!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Schema Update Failed:', error);
        process.exit(1);
    }
}

updateSchema();
