
import { NodeService } from '../services/NodeService.js';
import 'dotenv/config';

async function testFetch() {
    console.log('--- Testing Node Fetch for User ID 2 ---');
    const nodeService = new NodeService();
    try {
        const nodes = await nodeService.getUserNodes(2);
        console.log(`Found ${nodes.length} nodes for User ID 2.`);
        nodes.forEach(n => {
            console.log(` - Node: ${n.referral_code} | Status: ${n.status} | Owner: ${n.owner_user_id}`);
        });
    } catch (err) {
        console.error('Error:', err);
    }
    process.exit();
}

testFetch();
