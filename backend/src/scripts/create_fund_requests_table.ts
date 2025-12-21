import { Pool } from 'pg';
import dotenv from 'dotenv';
// Load env vars from backend root (assuming running from backend dir)
dotenv.config();

const pool = new Pool({
    user: process.env.POSTGRES_USER || 'admin',
    host: process.env.POSTGRES_HOST || 'localhost',
    database: process.env.POSTGRES_DB || 'mlm_database',
    password: process.env.POSTGRES_PASSWORD || 'adminpassword',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
});

async function createFundRequestsTable() {
    const client = await pool.connect();
    try {
        console.log('Creating FundRequests table...');

        // Create Enum if not exists
        try {
            await client.query(`CREATE TYPE fund_request_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');`);
        } catch (e: any) {
            if (e.code !== '42710') { // 42710 = duplicate_object
                console.warn('Enum might already exist or error:', e.message);
            }
        }

        await client.query(`
            CREATE TABLE IF NOT EXISTS FundRequests (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES Users(id) ON DELETE CASCADE,
                amount DECIMAL(15, 2) NOT NULL,
                utr_number VARCHAR(255) NOT NULL,
                status fund_request_status DEFAULT 'PENDING',
                admin_remarks TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Index for performance
        await client.query(`CREATE INDEX IF NOT EXISTS idx_fund_requests_user_id ON FundRequests(user_id);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_fund_requests_status ON FundRequests(status);`);

        console.log('FundRequests table created successfully.');
    } catch (error) {
        console.error('Error creating table:', error);
    } finally {
        client.release();
        await pool.end(); // Close the pool explicitly
        process.exit();
    }
}

createFundRequestsTable();
