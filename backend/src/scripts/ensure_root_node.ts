import { Client } from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function ensureRootNode() {
    try {
        await client.connect();
        console.log('Connected to database.');

        // Check if JSE-ROOT exists
        const res = await client.query("SELECT id FROM Nodes WHERE referral_code = 'JSE-ROOT'");
        if (res.rows.length > 0) {
            console.log('JSE-ROOT already exists.');
            return;
        }

        console.log('JSE-ROOT missing. Creating...');

        // Get a user to own the node (Admin or first user)
        let userId;
        const userRes = await client.query('SELECT id FROM Users ORDER BY id ASC LIMIT 1');
        if (userRes.rows.length > 0) {
            userId = userRes.rows[0].id;
            console.log(`Assigning Root Node to User ID: ${userId}`);
        } else {
            console.log('No users found. Creating Admin user...');
            const adminRes = await client.query(
                `INSERT INTO Users (auth_id, mobile, password_hash, role, master_wallet_balance, full_name, email)
                 VALUES ('ADMIN_FIX', '9999999999', 'hash', 'ADMIN', 0, 'Admin', 'admin@example.com')
                 RETURNING id`
            );
            userId = adminRes.rows[0].id;
        }

        // Create JSE-ROOT
        await client.query(
            `INSERT INTO Nodes (referral_code, owner_user_id, status, direct_referrals_count, sponsor_node_id, self_pool_parent_id, auto_pool_parent_id)
             VALUES ('JSE-ROOT', $1, 'ACTIVE', 0, NULL, NULL, NULL)`,
            [userId]
        );
        console.log('Created JSE-ROOT.');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

ensureRootNode();
