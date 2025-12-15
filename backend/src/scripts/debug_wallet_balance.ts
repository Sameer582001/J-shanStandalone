
import { query } from '../config/db.js';
import 'dotenv/config';

async function checkBalance() {
    console.log('--- Checking All User Balances ---');
    const res = await query('SELECT id, full_name, email, master_wallet_balance FROM Users ORDER BY id ASC');

    console.table(res.rows.map(u => ({
        ID: u.id,
        Name: u.full_name,
        Email: u.email,
        Balance: u.master_wallet_balance,
        Type: typeof u.master_wallet_balance
    })));

    process.exit();
}

checkBalance().catch(console.error);
