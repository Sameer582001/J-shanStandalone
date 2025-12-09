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

// Read plan_config.json
const configPath = path.resolve(__dirname, '../config/plan_config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function ensureAdminUser() {
    try {
        await client.connect();
        console.log('Connected to database for Admin Check.');

        const { mobile, password } = config.admin;
        const hashedPassword = await bcrypt.hash(password, 10);

        // 1. Create/Get Admin User
        const userCheck = await client.query('SELECT id FROM Users WHERE mobile = $1', [mobile]);

        if (userCheck.rows.length > 0) {
            console.log('System Admin User found. Using existing ID.');
        } else {
            console.log('Creating System Admin User from Config...');
            await client.query(
                `INSERT INTO Users (auth_id, mobile, password_hash, role, master_wallet_balance, full_name, email)
                 VALUES ($1, $2, $3, 'ADMIN', 0, 'System Admin', 'admin@system.local')`,
                [`ADMIN_${Date.now()}`, mobile, hashedPassword]
            );
            console.log('System Admin User Created.');
        }

    } catch (err) {
        console.error('Admin Ensure Error:', err);
    } finally {
        await client.end();
    }
}

ensureAdminUser();
