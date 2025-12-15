
import { query } from '../config/db.js';
import 'dotenv/config';

async function fixUser2() {
    console.log('--- Forcing User 2 Balance to 0 ---');
    await query("UPDATE Users SET master_wallet_balance = 0.00 WHERE id = 2");
    console.log('Update executed.');

    // Check again
    const res = await query('SELECT master_wallet_balance FROM Users WHERE id = 2');
    console.log(`New Balance: ${res.rows[0].master_wallet_balance}`);

    process.exit();
}

fixUser2();
