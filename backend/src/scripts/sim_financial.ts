
import { NodeService } from '../services/NodeService.js';
import { FinancialService } from '../services/FinancialService.js';
import { WalletService } from '../services/WalletService.js';
import { query } from '../config/db.js';
import 'dotenv/config';

const nodeService = new NodeService();
const walletService = new WalletService();
const financialService = new FinancialService();

async function runSimulation() {
    console.log('--- Starting Financial Logic Simulation (Wallet Split) ---');
    const suffix = Math.floor(Math.random() * 100000); // Randomize to avoid collisions

    try {
        await query('BEGIN');

        // 1. Create Root User (Top of Tree)
        // Master Wallet starts with 10000
        console.log('Creating Root User...');
        const rootUserRes = await query(`INSERT INTO Users (auth_id, full_name, email, mobile, password_hash, master_wallet_balance) VALUES ('SIM_ROOT_${suffix}', 'Sim Root', 'sim_root_${suffix}@test.com', '${suffix}', 'hash', 10000) RETURNING id`);
        const rootUserId = rootUserRes.rows[0].id;

        // 2. Create Root Node
        // Node Status ACTIVE, Wallet 0
        const rootNodeRes = await query("INSERT INTO Nodes (referral_code, owner_user_id, status, wallet_balance, direct_referrals_count) VALUES ('SIM-ROOT-" + suffix + "', $1, 'ACTIVE', 0.00, 0) RETURNING id", [rootUserId]);
        const rootNodeId = rootNodeRes.rows[0].id;
        console.log(`Root Node Created: ID ${rootNodeId}`);

        // 3. Create 3 Downline Users (Gen 1)
        const uIds = [];
        for (let i = 1; i <= 3; i++) {
            const uRes = await query(`INSERT INTO Users (auth_id, full_name, email, mobile, password_hash, master_wallet_balance) VALUES ('SIM_U${i}_${suffix}', 'Sim User ${i}', 'sim_${i}_${suffix}@test.com', '${suffix}00${i}', 'hash', 5000) RETURNING id`);
            uIds.push(uRes.rows[0].id);
        }

        // 4. Purchase Nodes
        // Each purchase triggers:
        // - Debit User Master Wallet (1750)
        // - Credit Sponsor Node Wallet (250 Bonus)
        // - Credit Level 1 Financial Flow (500 input to Root)

        console.log('Purchasing 3 Nodes...');
        for (const uid of uIds) {
            await nodeService.purchaseNode(uid, `SIM-ROOT-${suffix}`);
        }

        // 5. Verify Financial Outcomes

        // A. Root Master Wallet
        // Should be UNCHANGED (10000). All earnings go to Node Wallet.
        const rootMasterRes = await query('SELECT master_wallet_balance FROM Users WHERE id = $1', [rootUserId]);
        const rootMasterBal = parseFloat(rootMasterRes.rows[0].master_wallet_balance);
        console.log(`Root Master Wallet: ${rootMasterBal} (Expected 10000)`);

        if (rootMasterBal !== 10000) {
            console.error('[FAIL] Master Wallet modified! Separation failure.');
        } else {
            console.log('[PASS] Master Wallet Isolated.');
        }

        // B. Root Node Wallet
        // Expected Earnings:
        // 1. Sponsor Bonus: 250 * 3 = 750 (Credited to Node Wallet by NodeService)
        // 2. Level 1 Profit: 
        //    - Total Input: 3 * 500 = 1500.
        //    - Bucket 1 (Upgrade): 1000.
        //    - Bucket 2 (Upline): 200.
        //    - Bucket 3 (Profit): 300.
        //    - So Profit = 300.
        // Total Expected = 750 + 300 = 1050.

        const rootNodeResQuery = await query('SELECT wallet_balance FROM Nodes WHERE id = $1', [rootNodeId]);
        const rootNodeBal = parseFloat(rootNodeResQuery.rows[0].wallet_balance);
        console.log(`Root Node Wallet:   ${rootNodeBal} (Expected 1050)`);

        if (rootNodeBal === 1050) {
            console.log('[PASS] Node Wallet Correctly filled.');
        } else {
            console.error('[FAIL] Node Wallet Balance mismatch.');
        }

        // C. Level Progress Check
        const progRes = await query('SELECT * FROM LevelProgress WHERE node_id = $1 AND level = 1', [rootNodeId]);
        if (progRes.rows.length === 0) {
            console.error('[FAIL] No Level Progress found.');
        } else {
            const buckets = progRes.rows[0].buckets;
            console.log('Buckets State:', JSON.stringify(buckets));
            // Expect upgrade: 1000, profit: 300
        }

        await query('ROLLBACK');
        console.log('Simulation Cleaned Up (Rollback).');

    } catch (e) {
        console.error('Simulation Failed:', e);
        await query('ROLLBACK');
    }
    process.exit();
}

runSimulation();
