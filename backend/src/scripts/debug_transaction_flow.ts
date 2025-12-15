
import { NodeService } from '../services/NodeService.js';
import { WalletService } from '../services/WalletService.js';
import { query } from '../config/db.js';
import 'dotenv/config';

const nodeService = new NodeService();
const walletService = new WalletService();

async function tracetransactions() {
    console.log('--- Tracing Transaction Flow ---');
    const suffix = Math.floor(Math.random() * 10000);

    try {
        // Removed outer BEGIN to avoiding nesting issues with Service-level transactions

        // 1. Create Root User & Node
        console.log('1. Creating Root User...');
        const rootRes = await query(`INSERT INTO Users (auth_id, full_name, email, mobile, password_hash, master_wallet_balance) 
            VALUES ('ROOT_${suffix}', 'Root User', 'root_${suffix}@test.com', '${suffix}', 'hash', 0) RETURNING id`);
        const rootId = rootRes.rows[0].id;

        console.log('   Creating Root Node...');
        const rootNodeRes = await query(`INSERT INTO Nodes (referral_code, owner_user_id, status, wallet_balance, direct_referrals_count) 
            VALUES ('ROOT-${suffix}', $1, 'ACTIVE', 0.00, 0) RETURNING id`, [rootId]);
        const rootNodeId = rootNodeRes.rows[0].id;
        console.log(`   Root Node ID: ${rootNodeId}`);

        // 2. Create Downline User
        console.log('2. Creating Downline User & Adding Funds...');
        const u1Res = await query(`INSERT INTO Users (auth_id, full_name, email, mobile, password_hash, master_wallet_balance) 
            VALUES ('U1_${suffix}', 'User One', 'u1_${suffix}@test.com', '${suffix}1', 'hash', 0) RETURNING id`);
        const u1Id = u1Res.rows[0].id;

        // Add Funds to Master Wallet
        await walletService.addFunds(u1Id, 2000);

        const u1BalStart = await walletService.getBalance(u1Id);
        console.log(`   User 1 Balance: ${u1BalStart} (Expected 2000)`);

        // 3. Purchase Node
        console.log('3. User 1 Purchasing Node (Sponsor: ROOT)...');
        const purchase = await nodeService.purchaseNode(u1Id, `ROOT-${suffix}`);
        console.log(`   Purchase Complete. New Node ID: ${purchase.nodeId}`);

        // 4. Verification

        // A. User 1 Master Wallet (Should be 2000 - 1750 = 250)
        const u1BalEnd = await walletService.getBalance(u1Id);
        console.log(`   User 1 Balance End: ${u1BalEnd} (Expected 250)`);

        if (u1BalEnd !== 250) console.error('   [FAIL] User 1 Master Balance Incorrect');
        else console.log('   [PASS] User 1 Master Balance Correct');

        // B. Root Node Wallet (Sponsor Bonus 250 + Level Profit 500 input -> 300 Profit?)
        // Wait, 1 direct referral doesn't complete level 1.
        // Level 1 needs 3 directs to fill bucket? No, logic is per-transaction usually?
        // Let's check logic:
        // Purchase -> 500 to Level 1 Flow.
        // Level 1 Bucket 1: Upgrade (1000). 
        // 500 goes to Bucket 1. Nothing to Profit yet?
        // Ah, if profit is last bucket, Root might not get profit until 3rd person.
        // BUT Root SHOULD get Sponsor Bonus (250).

        const rootNodeResQuery = await query('SELECT wallet_balance FROM Nodes WHERE id = $1', [rootNodeId]);
        const rootNodeBal = parseFloat(rootNodeResQuery.rows[0].wallet_balance);
        console.log(`   Root Node Wallet: ${rootNodeBal}`);

        if (rootNodeBal < 250) console.error('   [FAIL] Sponsor Bonus Missing in Node Wallet');
        else console.log('   [PASS] Node Wallet has funds');

        // C. Transaction Logs (Service View)
        console.log('   Checking Master Wallet Logs (User 1 - Service View)...');
        const masterLogs = await walletService.getRecentTransactions(u1Id, 10);
        console.log(`   Found ${masterLogs.length} Master Logs.`);
        console.log(JSON.stringify(masterLogs, null, 2));

        // D. Transaction Logs (RAW VIEW)
        console.log('   Checking ALL Transactions (RAW VIEW)...');
        const rawLogs = await query('SELECT * FROM Transactions');
        console.log(`   Found ${rawLogs.rows.length} Total Logs.`);

        rawLogs.rows.forEach(r => {
            console.log(`ID:${r.id} OWN:${r.wallet_owner_id} NOD:${r.node_id} TYP:${r.type} AMT:${r.amount} DESC:${r.description}`);
        });

        console.log('Debug complete.');

    } catch (e) {
        console.error('Trace Failed:', e);
    }
    process.exit();
}

tracetransactions();
