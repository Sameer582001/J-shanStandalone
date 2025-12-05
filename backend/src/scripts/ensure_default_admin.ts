import { Client } from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function ensureDefaultAdmin() {
    try {
        await client.connect();
        console.log('Connected to database.');

        // Load config
        const configPath = path.resolve(__dirname, '../config/plan_config.json');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        const { mobile, password } = config.admin;

        // Check if Admin exists
        const res = await client.query("SELECT id FROM Users WHERE role = 'ADMIN'");
        if (res.rows.length > 0) {
            console.log('Admin user already exists.');
            return;
        }

        console.log('Admin missing. Creating default admin from config...');
        const hashedPassword = await bcrypt.hash(password, 10);
        const authId = `ADMIN-${Date.now()}`;

        await client.query(
            `INSERT INTO Users (auth_id, mobile, password_hash, role, master_wallet_balance, full_name, email)
             VALUES ($1, $2, $3, 'ADMIN', 0, 'System Admin', 'admin@system.local')`,
            [authId, mobile, hashedPassword]
        );

        console.log(`Created Default Admin (Mobile: ${mobile})`);

    } catch (err) {
        console.error('Error ensuring default admin:', err);
    } finally {
        await client.end();
    }
}

ensureDefaultAdmin();
