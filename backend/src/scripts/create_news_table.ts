
import { query } from '../config/db.js';

const createNewsTable = async () => {
    try {
        await query(`
            CREATE TABLE IF NOT EXISTS News (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('News table created successfully.');
    } catch (error) {
        console.error('Error creating News table:', error);
    }
};

createNewsTable();
