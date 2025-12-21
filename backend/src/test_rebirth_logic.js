import dotenv from 'dotenv';
import pg from 'pg';
import { FinancialService } from './services/FinancialService.js';
import { WalletService } from './services/WalletService.js';
import { NodeService } from './services/NodeService.js';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: process.env.POSTGRES_PORT ? parseInt(process.env.POSTGRES_PORT, 10) : undefined,
});

async function testRebirthLogic() {
    const client = await pool.connect();
    const walletService = new WalletService();
    const financialService = new FinancialService();

    try {
        console.log("=== Testing Rebirth Logic ===");
        await client.query('BEGIN');

        // Helper to get formatted Balance using the SAME client (Transaction aware)
        const getMasterBal = async (uid) => {
            const res = await client.query('SELECT master_wallet_balance FROM Users WHERE id = $1', [uid]);
            return parseFloat(res.rows[0].master_wallet_balance || 0);
        };
        const getNodeBal = async (nid) => {
            const res = await client.query('SELECT wallet_balance FROM Nodes WHERE id = $1', [nid]);
            return parseFloat(res.rows[0].wallet_balance);
        };

        const motherOwnerId = 2;
        const systemId = 1;

        // Ensure System User exists or create mock
        const sysCheck = await client.query('SELECT id FROM Users WHERE id = 1');
        if (sysCheck.rows.length === 0) {
            await client.query("INSERT INTO Users (id, full_name, mobile, password, master_wallet_balance) VALUES (1, 'System', '0000000000', 'pass', 0)");
        }

        // Create Mother Node
        const motherRes = await client.query(`
            INSERT INTO Nodes (referral_code, owner_user_id, status, wallet_balance, is_rebirth)
            VALUES ('MOTHER-TEST-' || floor(random()*10000), $1, 'ACTIVE', 0, FALSE) RETURNING id
        `, [motherOwnerId]);
        const motherId = motherRes.rows[0].id;
        console.log(`Created Mother Node: ${motherId}`);

        // Create Rebirth Node linked to Mother
        const rebirthRes = await client.query(`
            INSERT INTO Nodes (referral_code, owner_user_id, status, wallet_balance, is_rebirth, origin_node_id)
            VALUES ('REBIRTH-TEST-' || floor(random()*10000), $1, 'ACTIVE', 0, TRUE, $2) RETURNING id, referral_code
        `, [motherOwnerId, motherId]);
        const rebirthId = rebirthRes.rows[0].id;
        console.log(`Created Rebirth Node: ${rebirthId} (Origin: ${motherId})`);

        // --- TEST 1: Income Redirection ---
        console.log("\n--- Test 1: Income Redirection ---");

        const startMotherNodeBal = await getNodeBal(motherId);
        const startRebirthNodeBal = await getNodeBal(rebirthId);

        console.log(`Initial Balances -> Mother Node: ${startMotherNodeBal}, Rebirth Node: ${startRebirthNodeBal}`);

        await walletService.creditNodeWallet(rebirthId, 500, "Test Commission", client);

        const endMotherNodeBal = await getNodeBal(motherId);
        const endRebirthNodeBal = await getNodeBal(rebirthId);

        console.log(`Final Balances -> Mother Node: ${endMotherNodeBal}, Rebirth Node: ${endRebirthNodeBal}`);

        if (endMotherNodeBal === startMotherNodeBal + 500 && endRebirthNodeBal === startRebirthNodeBal) {
            console.log("✅ SUCCESS: Income redirected to Mother Node.");
        } else {
            console.log("❌ FAILED: Income NOT redirected correctly.");
        }

        // --- TEST 2: Sterile Rebirth (System Profit) ---
        console.log("\n--- Test 2: Sterile Rebirth buckets ---");

        // Insert LevelProgress for Rebirth Node at Level 2
        await client.query(`
            INSERT INTO LevelProgress (node_id, level, pool_type, total_revenue, buckets)
            VALUES ($1, 2, 'AUTO', 0, '{}')
        `, [rebirthId]);

        const startSystemBal = await getMasterBal(systemId);
        const startNodeCount = (await client.query('SELECT COUNT(*) FROM Nodes')).rows[0].count;

        console.log(`Processing Income for Rebirth Node (Filling Rebirth Bucket)...`);

        // Let's Pre-fill Upgrade bucket to 3000.
        await client.query(`
            UPDATE LevelProgress 
            SET buckets = '{"upgrade": 3000}', total_revenue = 3000 
            WHERE node_id = $1 AND level = 2
        `, [rebirthId]);

        // Process 1000 -> Fills Rebirth.
        await financialService.processIncome(rebirthId, 1000, 2, 'AUTO', client);

        const endSystemBal = await getMasterBal(systemId);
        const endNodeCount = (await client.query('SELECT COUNT(*) FROM Nodes')).rows[0].count;

        console.log(`System Wallet: ${startSystemBal} -> ${endSystemBal}`);
        console.log(`Node Count: ${startNodeCount} -> ${endNodeCount}`);

        if (endSystemBal >= startSystemBal + 1000) {
            console.log("✅ SUCCESS: System Wallet credited (Sterile Profit).");
        } else {
            console.log("❌ FAILED: System Wallet NOT credited.");
        }

        if (parseInt(endNodeCount) === parseInt(startNodeCount)) {
            console.log("✅ SUCCESS: No new nodes spawned (Sterility enforced).");
        } else {
            console.log("❌ FAILED: New nodes were spawned!");
        }

        await client.query('ROLLBACK'); // Clean up test data
        console.log("\nTest Completed (Rolled Back)");

    } catch (error) {
        console.error("Test Error:", error);
        await client.query('ROLLBACK');
    } finally {
        client.release();
        await pool.end();
    }
}

testRebirthLogic();
