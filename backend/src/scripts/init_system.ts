
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import bcrypt from 'bcrypt';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read Config
const configPath = path.resolve(__dirname, '../config/plan_config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function initSystem() {
    console.log('--- INITIALIZING SYSTEM (DESTRUCTIVE) ---');
    console.log('Target Database:', process.env.DATABASE_URL?.split('@')[1]); // Log host only for safety

    try {
        await client.connect();

        // 1. Wipe Database
        console.log('1. Wiping Database...');
        await client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
        await client.query('GRANT ALL ON SCHEMA public TO public;');

        // 2. Apply Schema
        console.log('2. Applying Schema...');
        const schemaPath = path.resolve(__dirname, '../database/schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await client.query(schemaSql);
        console.log('   Schema applied.');

        // 3. (Removed) Seeding Admin & Root User
        // The system is now left INTENTIONALLY EMPTY.
        // The first user to visit /portal-secure will trigger the Setup Flow
        // to manually create the Admin and Root User.

        console.log('--- SYSTEM RESET COMPLETE ---');
        console.log('   Database is now empty (Schema Applied).');
        console.log('   Please visit /portal-secure to Initialize the System manually.');
        console.log('=============================================\n');

    } catch (error) {
        console.error('INIT FAILED:', error);
    } finally {
        await client.end();
    }
    process.exit();
}

initSystem();
