
import { query } from '../config/db.js';
import 'dotenv/config';

async function debugAdminState() {
    console.log('--- Debugging Admin State ---');

    console.log('1. Checking JSE-ROOT Node...');
    const nodeRes = await query("SELECT * FROM Nodes WHERE referral_code = 'JSE-ROOT'");

    if (nodeRes.rows.length === 0) {
        console.log('   [Result] JSE-ROOT Node does NOT exist.');
    } else {
        const node = nodeRes.rows[0];
        console.log('   [Result] JSE-ROOT Node FOUND.');
        console.log(`   - ID: ${node.id}`);
        console.log(`   - Owner User ID: ${node.owner_user_id}`);
        console.log(`   - Status: ${node.status}`);

        console.log('2. Checking Owner User...');
        const userRes = await query('SELECT * FROM Users WHERE id = $1', [node.owner_user_id]);

        if (userRes.rows.length === 0) {
            console.warn('   [CRITICAL USER ERROR] The User ID linked to JSE-ROOT does NOT exist in Users table!');
            console.log('   Recommended Action: Delete the JSE-ROOT node to allow re-seeding.');
        } else {
            const user = userRes.rows[0];
            console.log('   [Result] Owner User FOUND.');
            console.log(`   - ID: ${user.id}`);
            console.log(`   - Name: ${user.full_name}`);
            console.log(`   - Mobile: ${user.mobile}`);
            console.log(`   - Email: ${user.email}`);
            console.log(`   - Role: ${user.role}`);
            console.log(`   - Auth ID: ${user.auth_id}`);
        }
    }

    console.log('\n3. Checking All Users with ADMIN role...');
    const admins = await query("SELECT * FROM Users WHERE role = 'ADMIN'");
    if (admins.rows.length === 0) {
        console.log('   [Result] No users with ADMIN role found.');
    } else {
        admins.rows.forEach(admin => {
            console.log(`   - Found Admin: ${admin.full_name} (${admin.mobile})`);
        });
    }

    process.exit();
}

debugAdminState().catch(err => console.error(err));
