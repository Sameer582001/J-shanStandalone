import { Client } from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function seed() {
    try {
        await client.connect();
        console.log('Connected to database.');

        // Check if Users table is empty
        const userCountRes = await client.query('SELECT COUNT(*) FROM Users');
        const userCount = parseInt(userCountRes.rows[0].count, 10);

        if (userCount > 0) {
            console.log('Database already seeded. Exiting.');
            return;
        }

        console.log('Seeding database...');

        // 1. Insert Root Admin User
        const adminMobile = '9999999999';
        const adminAuthId = 'ADMIN_AUTH_ID'; // Placeholder
        const adminPasswordHash = 'HASHED_PASSWORD'; // Placeholder, should be hashed in real app

        const userRes = await client.query(
            `INSERT INTO Users (auth_id, mobile, password_hash, role, master_wallet_balance)
       VALUES ($1, $2, $3, 'ADMIN', 0)
       RETURNING id`,
            [adminAuthId, adminMobile, adminPasswordHash]
        );
        const adminUserId = userRes.rows[0].id;
        console.log(`Created Root Admin (ID: ${adminUserId})`);

        // 2. Insert System Root Node (Self Pool)
        // Code: 'JSE-ROOT', Pool: 'SELF', Status: 'ACTIVE', Parent: NULL, Sponsor: NULL
        const rootNodeRes = await client.query(
            `INSERT INTO Nodes (referral_code, owner_user_id, pool_type, status, direct_referrals_count, sponsor_node_id, parent_node_id)
       VALUES ($1, $2, 'SELF', 'ACTIVE', 0, NULL, NULL)
       RETURNING id`,
            ['JSE-ROOT', adminUserId]
        );
        const rootNodeId = rootNodeRes.rows[0].id;
        console.log(`Created System Root Node (ID: ${rootNodeId}, Code: JSE-ROOT)`);

        // 3. Insert Auto Pool Root Node
        // Code: 'JSE-AUTO-ROOT', Pool: 'AUTO', Parent: NULL
        // Note: Auto pool nodes might not need an owner in the same way, or they belong to the admin.
        // Assuming it belongs to the admin user for now.
        await client.query(
            `INSERT INTO Nodes (referral_code, owner_user_id, pool_type, status, direct_referrals_count, sponsor_node_id, parent_node_id)
       VALUES ($1, $2, 'AUTO', 'ACTIVE', 0, NULL, NULL)
       RETURNING id`,
            ['JSE-AUTO-ROOT', adminUserId]
        );
        console.log(`Created Auto Pool Root Node (Code: JSE-AUTO-ROOT)`);

        console.log('Seeding complete.');

    } catch (err) {
        console.error('Error seeding database:', err);
    } finally {
        await client.end();
    }
}

seed();
