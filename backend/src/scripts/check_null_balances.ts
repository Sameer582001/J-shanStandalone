
import { query } from '../config/db.js';
import 'dotenv/config';

async function check() {
    console.log('--- Checking for NULL balances ---');
    const res = await query('SELECT id, full_name, master_wallet_balance FROM Users');

    let nullCount = 0;
    res.rows.forEach(u => {
        if (u.master_wallet_balance === null) {
            console.log(`[ALERT] User ID ${u.id} (${u.full_name}) has NULL balance!`);
            nullCount++;
        }
    });

    if (nullCount === 0) {
        console.log('No users with NULL balance found.');
    } else {
        console.log(`Found ${nullCount} users with NULL balance.`);
    }

    // Also check for 'NaN' or weird strings
    console.log('--- Checking for weird string values ---');
    res.rows.forEach(u => {
        const val = u.master_wallet_balance;
        if (val !== null && isNaN(parseFloat(val))) {
            console.log(`[ALERT] User ID ${u.id} (${u.full_name}) has invalid balance string: "${val}"`);
        }
    });

    process.exit();
}

check().catch(console.error);
