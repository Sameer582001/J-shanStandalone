
import { query } from '../config/db.js';

async function checkReferrals() {
    console.log('Checking Direct Referrals...');
    // Find a node that has referrals
    const res = await query('SELECT id, referral_code, direct_referrals_count FROM Nodes WHERE direct_referrals_count > 0 LIMIT 1');
    if (res.rows.length === 0) {
        console.log('No nodes with referrals found.');
        process.exit(0);
    }
    const node = res.rows[0];
    console.log(`Checking Node ${node.referral_code} (ID: ${node.id}) - Count: ${node.direct_referrals_count}`);

    const refs = await query(
        `SELECT n.id, n.referral_code, u.full_name, n.status, n.created_at 
         FROM Nodes n 
         JOIN Users u ON n.owner_user_id = u.id 
         WHERE n.sponsor_node_id = $1 
         ORDER BY n.created_at DESC`,
        [node.id]
    );
    console.log(`Found ${refs.rows.length} direct referrals.`);
    refs.rows.forEach(r => console.log(` - ${r.full_name} (${r.referral_code}) [${r.status}]`));
}

checkReferrals().catch(console.error);
