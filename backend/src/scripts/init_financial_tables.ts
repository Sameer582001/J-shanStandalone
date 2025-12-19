
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
    user: process.env.POSTGRES_USER || 'admin',
    host: process.env.POSTGRES_HOST || 'localhost',
    database: process.env.POSTGRES_DB || 'mlm_database',
    password: process.env.POSTGRES_PASSWORD || 'admin123',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log("Starting Financial Tables Initialization...");

        await client.query('BEGIN');

        // LevelProgress Table
        await client.query(`
             CREATE TABLE IF NOT EXISTS LevelProgress (
                id SERIAL PRIMARY KEY,
                node_id INTEGER NOT NULL,
                level INTEGER NOT NULL,
                pool_type VARCHAR(10) NOT NULL,
                total_revenue NUMERIC(10, 2) DEFAULT 0,
                buckets JSONB DEFAULT '{}',
                is_completed BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(node_id, level, pool_type)
            );
        `);
        console.log("Verified LevelProgress Table.");

        // NodeWallet Table
        await client.query(`
             CREATE TABLE IF NOT EXISTS NodeWallet (
                id SERIAL PRIMARY KEY,
                node_id INTEGER NOT NULL,
                amount NUMERIC(10, 2) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("Verified NodeWallet Table.");

        // Add index if missing?
        // await client.query('CREATE INDEX IF NOT EXISTS idx_nodewallet_node_id ON NodeWallet(node_id)');

        await client.query('COMMIT');
        console.log("Migration Complete.");

    } catch (e: any) {
        await client.query('ROLLBACK');
        console.error("Migration Failed:", e);
    } finally {
        client.release();
        pool.end();
    }
}

migrate();
