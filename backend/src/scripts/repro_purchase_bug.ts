
import { NodeService } from '../services/NodeService.js';
import { WalletService } from '../services/WalletService.js';
import { query } from '../config/db.js';
import 'dotenv/config';

async function repro() {
    console.log('--- Reproduction: Purchase Node with 0 Balance ---');
    const walletService = new WalletService();
    const nodeService = new NodeService();

    try {
        // 1. Create a dummy user
        const mobile = `9${Math.floor(Math.random() * 1000000000)}`;
        const userRes = await query(
            `INSERT INTO Users (auth_id, full_name, email, mobile, password_hash, master_wallet_balance, role)
             VALUES ($1, 'Broke User', $2, $3, 'hash', 0.00, 'USER') RETURNING id`,
            [`AUTH-${Date.now()}`, `broke-${Date.now()}@test.com`, mobile]
        );
        const userId = userRes.rows[0].id;
        console.log(`Created User ID: ${userId} with Balance: 0.00`);

        // 2. Get a valid sponsor
        const sponsorRes = await query("SELECT referral_code FROM Nodes WHERE status = 'ACTIVE' LIMIT 1");
        if (sponsorRes.rows.length === 0) throw new Error('No active sponsor found');
        const sponsorCode = sponsorRes.rows[0].referral_code;
        console.log(`Using Sponsor: ${sponsorCode}`);

        // 3. Attempt Purchase
        console.log('Attempting purchase (Price: 1750)...');
        await nodeService.purchaseNode(userId, sponsorCode);

        console.log('Check: SUCCESS? (If this prints, BUG IS CONFIRMED)');

    } catch (error: any) {
        console.log(`Check: CAUGHT ERROR: ${error.message}`);
        if (error.message === 'Insufficient funds') {
            console.log('Result: VALIDATION WORKING CORRECTLY.');
        } else {
            console.log('Result: UNEXPECTED ERROR.');
        }
    }
    process.exit();
}

repro().catch(console.error);
