
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

async function check() {
    const client = await pool.connect();
    try {
        // 1. List Databases
        const dbs = await client.query("SELECT datname FROM pg_database WHERE datistemplate = false");
        console.log("DATABASES:", dbs.rows.map(r => r.datname).join(', '));

        // 2. Current DB Info
        const curr = await client.query("SELECT current_database(), current_schema()");
        console.log("CURRENT:", curr.rows[0]);

        // 3. List Tables
        const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log("TABLES:", tables.rows.map(r => r.table_name).join(', '));

        // 4. Check Nodes
        const nodes = await client.query("SELECT count(*) FROM Nodes");
        console.log("Nodes Count:", nodes.rows[0].count);

        // 5. Check Users Schema
        const userCols = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'");
        console.log("USERS COLS:", userCols.rows.map(r => r.column_name).join(', '));

        console.log("Checking LevelProgress...");
        await client.query('SELECT * FROM LevelProgress LIMIT 1');
        console.log("LevelProgress OK.");

    } catch (e: any) {
        console.error("ERROR:", e.message);
    } finally {
        client.release();
        pool.end();
    }
}

check();
