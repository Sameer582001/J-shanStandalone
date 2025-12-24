
import { query } from '../config/db.js';

const createTicketsTable = async () => {
    try {
        console.log('Creating Tickets Table...');

        await query(`
            CREATE TABLE IF NOT EXISTS Tickets (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES Users(id) ON DELETE CASCADE,
                subject VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                status VARCHAR(20) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
                admin_response TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                closed_at TIMESTAMP
            );
        `);

        console.log('Tickets Table Created Successfully.');
    } catch (error) {
        console.error('Error creating Tickets table:', error);
    }
};

createTicketsTable();
