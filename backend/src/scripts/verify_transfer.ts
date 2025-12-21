
import { NodeService } from '../services/NodeService.js';
import { query } from '../config/db.js';

const run = async () => {
    const nodeService = new NodeService();

    console.log('--- Starting Node Transfer Verification ---');
    console.log('DB Config Check:', {
        user: process.env.POSTGRES_USER,
        host: process.env.POSTGRES_HOST,
        db: process.env.POSTGRES_DB
    });

    // 1. Setup Data
    // Create Old Owner
    const oldOwnerRes = await query(`INSERT INTO Users (username, email, password_hash, master_wallet_balance) VALUES ($1, $2, 'hash', 0) RETURNING id`, [`OldOwner_${Date.now()}`, `old_${Date.now()}@test.com`]);
    const oldOwnerId = oldOwnerRes.rows[0].id;

    // Create New Owner
    const newOwnerRes = await query(`INSERT INTO Users (username, email, password_hash, master_wallet_balance) VALUES ($1, $2, 'hash', 0) RETURNING id`, [`NewOwner_${Date.now()}`, `new_${Date.now()}@test.com`]);
    const newOwnerId = newOwnerRes.rows[0].id;

    // Create Mother Node
    const motherRes = await query(`INSERT INTO Nodes (referral_code, owner_user_id, status, wallet_balance, created_at) VALUES ($1, $2, 'ACTIVE', 500, NOW()) RETURNING id`, [`MOTH-${Date.now()}`, oldOwnerId]);
    const motherId = motherRes.rows[0].id;

    // Create Rebirth Node (Linked to Mother)
    const rebirthRes = await query(`INSERT INTO Nodes (referral_code, owner_user_id, status, is_rebirth, origin_node_id, created_at) VALUES ($1, $2, 'ACTIVE', TRUE, $3, NOW()) RETURNING id`, [`RB-MOTH-${Date.now()}`, oldOwnerId, motherId]);
    const rebirthId = rebirthRes.rows[0].id;

    console.log(`Setup Complete:`);
    console.log(`Old Owner: ${oldOwnerId}, New Owner: ${newOwnerId}`);
    console.log(`Mother Node: ${motherId} (Owner: ${oldOwnerId})`);
    console.log(`Rebirth Node: ${rebirthId} (Owner: ${oldOwnerId}, Origin: ${motherId})`);

    // 2. Perform Transfer
    console.log('\n>>> Executing Transfer...');
    const result = await nodeService.transferNode(motherId, newOwnerId, 1);
    console.log('Transfer Result:', result);

    // 3. Verify
    const verifyMother = await query('SELECT owner_user_id FROM Nodes WHERE id = $1', [motherId]);
    const verifyRebirth = await query('SELECT owner_user_id FROM Nodes WHERE id = $1', [rebirthId]);

    const motherNewOwner = verifyMother.rows[0].owner_user_id;
    const rebirthNewOwner = verifyRebirth.rows[0].owner_user_id;

    console.log(`\nVerification:`);
    console.log(`Mother Node Owner: ${motherNewOwner} (Expected: ${newOwnerId}) -> ${motherNewOwner === newOwnerId ? 'PASS' : 'FAIL'}`);
    console.log(`Rebirth Node Owner: ${rebirthNewOwner} (Expected: ${newOwnerId}) -> ${rebirthNewOwner === newOwnerId ? 'PASS' : 'FAIL'}`);

    if (motherNewOwner === newOwnerId && rebirthNewOwner === newOwnerId) {
        console.log('\n✅ SUCCESS: Ownership Transferred Correctly');
    } else {
        console.error('\n❌ FAILURE: Ownership Mismatch');
        process.exit(1);
    }

    process.exit(0);
};

run().catch(e => {
    console.error(e);
    process.exit(1);
});
