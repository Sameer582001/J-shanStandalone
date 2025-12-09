
import { query } from '../config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
    console.log('--- Running Migration: 002_create_withdrawals ---');
    try {
        const sqlPath = path.resolve(__dirname, '../database/migrations/002_create_withdrawals.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        await query(sql);
        console.log('Migration successfully executed.');
    } catch (err) {
        console.error('Migration Error:', err);
    }
    process.exit();
}

runMigration();
