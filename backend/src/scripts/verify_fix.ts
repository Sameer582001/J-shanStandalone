
import { NodeService } from '../services/NodeService.js';
import { WalletService } from '../services/WalletService.js';
import { query } from '../config/db.js';
import 'dotenv/config';

const nodeService = new NodeService();
const walletService = new WalletService();

async function verifyFix() {
    console.log('--- Verifying Fix for Sponsor Bonus ---');
    const suffix = Math.floor(Math.random() * 10000);

    try {
        // 1. Create Root User & Node
        console.log('1. Creating Root User...');
        const rootRes = await query(`INSERT INTO Users (auth_id, full_name, email, mobile, password_hash, master_wallet_balance) 
            VALUES ('ROOT_FIX_${suffix}', 'Root User', 'rootfix_${suffix}@test.com', '99${suffix}', 'hash', 0) RETURNING id`);
        const rootId = rootRes.rows[0].id;

        const rootNodeRes = await query(`INSERT INTO Nodes (referral_code, owner_user_id, status, wallet_balance, direct_referrals_count) 
            VALUES ('ROOT-FIX-${suffix}', $1, 'ACTIVE', 0.00, 0) RETURNING id`, [rootId]);
        const rootNodeId = rootNodeRes.rows[0].id;

        // 2. Create Downline User
        const u1Res = await query(`INSERT INTO Users (auth_id, full_name, email, mobile, password_hash, master_wallet_balance) 
            VALUES ('U1_FIX_${suffix}', 'User One', 'u1fix_${suffix}@test.com', '88${suffix}', 'hash', 0) RETURNING id`);
        const u1Id = u1Res.rows[0].id;

        // Add Funds
        await walletService.addFunds(u1Id, 2000);

        // 3. Purchase Node
        console.log('3. Purchasing Node...');
        await nodeService.purchaseNode(u1Id, `ROOT-FIX-${suffix}`);

        // 4. Check Root Node Wallet (Should have 250)
        const rootNodeRes2 = await query('SELECT wallet_balance FROM Nodes WHERE id = $1', [rootNodeId]);
        const rootNodeBal = parseFloat(rootNodeRes2.rows[0].wallet_balance);
        console.log(`   Root Node Wallet: ${rootNodeBal}`);

        if (rootNodeBal === 250) {
            console.log('   [PASS] Sponsor Bonus Received!');
        } else {
            console.error(`   [FAIL] Sponsor Bonus Missing. Expected 250, got ${rootNodeBal}`);
        }

        // 5. Check Logs
        const logs = await walletService.getNodeTransactions(rootNodeId, 10);
        const hasBonus = logs.some(l => l.description.includes('Direct Referral Bonus'));
        if (hasBonus) {
            console.log('   [PASS] Transaction Log found.');
        } else {
            console.error('   [FAIL] Transaction Log missing.');
            console.log(JSON.stringify(logs, null, 2));
        }

    } catch (e) {
        console.error('Verification Failed:', e);
    }
    process.exit();
}

verifyFix();
