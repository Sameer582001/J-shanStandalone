
import { query } from '../config/db.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcrypt';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read plan_config.json for Admin credentials
const configPath = path.resolve(__dirname, '../config/plan_config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

async function resetData() {
    console.log('!!! WARNING: WIPING ALL DATA !!!');
    try {
        await query('BEGIN');

        // 1. Truncate Tables (Order matters due to foreign keys)
        // Transactions depends on Users/Nodes
        console.log('Truncating Transactions...');
        await query('TRUNCATE TABLE Transactions CASCADE');

        console.log('Truncating Withdrawals...');
        await query('TRUNCATE TABLE Withdrawals CASCADE');

        console.log('Truncating LevelProgress...');
        await query('TRUNCATE TABLE LevelProgress CASCADE');

        // Nodes depends on Users
        console.log('Truncating Nodes...');
        await query('TRUNCATE TABLE Nodes CASCADE');

        // Users is base (except for self-referencing in some schemas, but usually fine with Cascade)
        console.log('Truncating Users...');
        await query('TRUNCATE TABLE Users CASCADE');

        console.log('Data Wiped.');

        // 2. Restore Admin User
        const { mobile, password } = config.admin;
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log('Restoring Admin User...');
        await query(
            `INSERT INTO Users (auth_id, mobile, password_hash, role, master_wallet_balance, full_name, email)
             VALUES ($1, $2, $3, 'ADMIN', 0, 'System Admin', 'admin@system.local')`,
            [`ADMIN`, mobile, hashedPassword]
        );

        await query('COMMIT');
        console.log('Reset Complete. Admin Restored.');

    } catch (error) {
        console.error('Reset Failed:', error);
        await query('ROLLBACK');
    }
    process.exit();
}

resetData();
