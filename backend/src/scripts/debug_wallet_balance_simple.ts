
import { query } from '../config/db.js';
import 'dotenv/config';

async function checkBalanceSimple() {
    console.log('--- Checking Balances (Plain Text) ---');
    try {
        const res = await query('SELECT id, full_name, master_wallet_balance FROM Users');
        if (res.rows.length === 0) {
            console.log('No users found.');
        }
        res.rows.forEach(u => {
            console.log(`User [${u.id}] ${u.full_name}: Balance = ${u.master_wallet_balance} (Type: ${typeof u.master_wallet_balance})`);
        });
    } catch (e) {
        console.error('Query failed:', e);
    }
    process.exit();
}

checkBalanceSimple();
