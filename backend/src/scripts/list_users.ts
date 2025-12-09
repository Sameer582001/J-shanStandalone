
import { query } from '../config/db.js';
import 'dotenv/config';

async function listUsers() {
    console.log('--- Listing All Users ---');
    const res = await query('SELECT id, full_name, mobile, role FROM Users ORDER BY id ASC');
    res.rows.forEach(u => {
        console.log(`ID: ${u.id} | Name: ${u.full_name} | Mobile: ${u.mobile} | Role: ${u.role}`);
    });
    process.exit();
}

listUsers().catch(console.error);
