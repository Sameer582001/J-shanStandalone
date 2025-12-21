import { query } from './src/config/db.js';
import { FastTrackService } from './src/services/FastTrackService.js';

// Helper to create dummy user and node
async function createDummyNode(referralCode: string, daysAgo: number) {
    // 1. Create User
    const userRes = await query(`
        INSERT INTO Users (auth_id, full_name, email, mobile, password_hash, role)
        VALUES ($1, $2, $3, $4, 'hash', 'USER')
        RETURNING id
    `, [`auth_${referralCode}`, `User ${referralCode}`, `${referralCode}@test.com`, `999${Math.floor(Math.random() * 10000000)}`]);
    const userId = userRes.rows[0].id;

    // 2. Create Node with custom created_at
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    const nodeRes = await query(`
        INSERT INTO Nodes (referral_code, owner_user_id, status, created_at, updated_at)
        VALUES ($1, $2, 'ACTIVE', $3, $3)
        RETURNING id
    `, [referralCode, userId, date]);

    return { nodeId: nodeRes.rows[0].id, userId };
}

async function addReferrals(sponsorNodeId: number, count: number, daysAgo: number) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    for (let i = 0; i < count; i++) {
        await query(`
            INSERT INTO Nodes (referral_code, owner_user_id, sponsor_node_id, status, created_at)
            VALUES ($1, 1, $2, 'ACTIVE', $3)
        `, [`REF_${sponsorNodeId}_${i}`, sponsorNodeId, date]);
    }
}

async function runTest() {
    const service = new FastTrackService();
    console.log('--- Starting Fast Track Verification ---');

    // Scenario 1: Tier 0 (0 referrals, > 10 days ago) - Should be Eligible for 1750
    console.log('\nScenario 1: Tier 0 (Expired, 0 referrals)');
    const { nodeId: node1 } = await createDummyNode('FT_TEST_1', 11);
    const status1 = await service.getFastTrackStatus(node1);
    console.log('Status:', status1.status);
    console.log('Reward:', status1.reward_value);
    console.log('Is Finalized:', status1.is_finalized);

    if (status1.reward_value === 1750 && status1.status === 'ELIGIBLE') {
        console.log('✅ Scenario 1 Passed');
    } else {
        console.error('❌ Scenario 1 Failed');
    }

    // Scenario 2: Tier 1 (3 referrals, > 10 days ago) - Should be Eligible for 5000
    console.log('\nScenario 2: Tier 1 (Expired, 3 referrals)');
    const { nodeId: node2 } = await createDummyNode('FT_TEST_2', 11);
    await addReferrals(node2, 3, 11); // Referrals made on same day as creation
    const status2 = await service.getFastTrackStatus(node2);
    console.log('Status:', status2.status);
    console.log('Reward:', status2.reward_value);

    if (status2.reward_value === 5000) {
        console.log('✅ Scenario 2 Passed');
    } else {
        console.error('❌ Scenario 2 Failed', status2);
    }

    // Scenario 3: Active Window (5 days ago, 0 referrals) - Should be PENDING
    console.log('\nScenario 3: Active Window (5 days left)');
    const { nodeId: node3 } = await createDummyNode('FT_TEST_3', 5);
    const status3 = await service.getFastTrackStatus(node3);
    console.log('Status:', status3.status);
    console.log('Days Remaining:', status3.days_remaining);

    if (status3.status === 'PENDING' && status3.days_remaining > 0) {
        console.log('✅ Scenario 3 Passed');
    } else {
        console.error('❌ Scenario 3 Failed');
    }

    // Scenario 4: Admin Settlement
    console.log('\nScenario 4: Settle Claim');
    // Ensure node1 is in DB (getStatus calls finalize if needed)
    const claims = await service.getEligibleList();
    const claim = claims.find(c => c.node_id === node1);

    if (claim) {
        const settled = await service.settleClaim(claim.id, 'CODE-123');
        console.log('Settled Status:', settled.status);
        console.log('Product Codes:', settled.product_codes);

        if (settled.status === 'CLAIMED' && settled.product_codes === 'CODE-123') {
            console.log('✅ Scenario 4 Passed');
        } else {
            console.error('❌ Scenario 4 Failed');
        }
    } else {
        console.error('❌ Scenario 4 Failed: Claim not found in list');
    }

    process.exit(0);
}

runTest().catch(console.error);
