
import { Client } from 'pg';
import 'dotenv/config';

async function migrate() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
        await client.connect();
        console.log('Migrating LevelProgress table...');

        // 1. Add Column
        await client.query(`
            ALTER TABLE LevelProgress 
            ADD COLUMN IF NOT EXISTS pool_type VARCHAR(10) DEFAULT 'SELF' CHECK (pool_type IN ('SELF', 'AUTO'));
        `);

        // 2. Drop Old Constraint
        await client.query(`
            ALTER TABLE LevelProgress DROP CONSTRAINT IF EXISTS levelprogress_node_id_level_key;
        `);

        // 3. Add New Constraint
        await client.query(`
            ALTER TABLE LevelProgress ADD CONSTRAINT levelprogress_node_id_level_pool_key UNIQUE (node_id, level, pool_type);
        `);

        console.log('Migration Complete.');
    } catch (e) {
        console.error('Migration Failed:', e);
    } finally {
        await client.end();
    }
}

migrate();
