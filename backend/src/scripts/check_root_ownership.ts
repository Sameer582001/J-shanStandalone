
import { query } from '../config/db.js';
import 'dotenv/config';

async function checkOwnership() {
    console.log('--- Checking JSE-ROOT Ownership ---');

    const nodeRes = await query("SELECT * FROM Nodes WHERE referral_code = 'JSE-ROOT'");
    if (nodeRes.rows.length === 0) {
        console.log('STATUS: JSE-ROOT Node does NOT exist.');
    } else {
        const node = nodeRes.rows[0];
        console.log(`STATUS: JSE-ROOT Node EXISTS. Node ID: ${node.id}`);
        console.log(`OWNER ID: ${node.owner_user_id}`);

        const userRes = await query('SELECT * FROM Users WHERE id = $1', [node.owner_user_id]);
        if (userRes.rows.length > 0) {
            const user = userRes.rows[0];
            console.log(`OWNER NAME: ${user.full_name}`);
            console.log(`OWNER MOBILE: ${user.mobile}`);
            console.log(`OWNER ROLE: ${user.role}`);
        } else {
            console.log('CRITICAL: Owner User not found in DB!');
        }
    }
    process.exit();
}

checkOwnership().catch(console.error);
