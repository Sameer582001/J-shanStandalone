
import dotenv from 'dotenv';
dotenv.config(); // Load .env from backend root

import pool, { query } from './src/config/db.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

async function verifyAutoPool() {
    console.log('Starting Auto Pool Integrity Check...');

    // 1. Get Root
    const rootRes = await query("SELECT id FROM Nodes WHERE referral_code = 'JSE-ROOT'");
    if (rootRes.rows.length === 0) {
        console.error('Root node not found!');
        process.exit(1);
    }
    const rootId = rootRes.rows[0].id; // Should be numeric 1 usually
    console.log(`Root ID: ${rootId}`);

    // 2. BFS Traversal to simulate expected fill order
    const queue = [rootId];
    const visited = new Set<number>();
    visited.add(rootId);

    let broken = false;
    let foundIncomplete = false;
    let incompleteNodeId = -1;

    // Get map of parent -> children for efficiency
    console.log('Fetching nodes...');
    const nodesRes = await query(`
        SELECT n.id, n.auto_pool_parent_id, n.created_at 
        FROM Nodes n 
        WHERE n.auto_pool_parent_id IS NOT NULL 
        ORDER BY n.created_at ASC
    `);

    const childrenMap = new Map<number, any[]>();
    nodesRes.rows.forEach((node: any) => {
        const pid = node.auto_pool_parent_id;
        if (!childrenMap.has(pid)) childrenMap.set(pid, []);
        childrenMap.get(pid)?.push(node);
    });

    const placementQueue = [rootId];
    let qIndex = 0;

    console.log('Validating structure...');

    while (qIndex < placementQueue.length) {
        const currentId = placementQueue[qIndex];
        qIndex++;

        // Get children of this node
        const children = childrenMap.get(currentId) || [];
        const count = children.length;

        // Check Logic
        if (foundIncomplete) {
            // We previously found a node that wasn't full (count < 3).
            // If the current node (which comes AFTER in placement order) has ANY children,
            // then the previous node was skipped incorrectly!
            if (count > 0) {
                console.error(`[ERROR] Structural Gap Detected!`);
                console.error(`Node ${incompleteNodeId} (processed earlier) has < 3 children.`);
                console.error(`But Node ${currentId} (processed later) has ${count} children.`);
                console.error(`Logic skipped Node ${incompleteNodeId} before it was full.`);
                broken = true;
            }
        }

        if (count < 3) {
            if (!foundIncomplete) {
                foundIncomplete = true;
                incompleteNodeId = currentId;
                // Found the "Filling Edge"
            }
        } else if (count > 3) {
            console.error(`[ERROR] Node ${currentId} has ${count} children (Limit is 3). Overfilled!`);
            broken = true;
        }

        // Add children to queue for next level processing
        // Sort children by created_at to match BFS logic
        children.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        children.forEach((c: any) => placementQueue.push(c.id));
    }

    if (!broken) {
        console.log('✅ Auto Pool Structure is VALID. No gaps detected.');
        console.log(`Verified ${placementQueue.length} nodes.`);
        console.log(`Active Filling Parent: ${incompleteNodeId}`);
    } else {
        console.log('❌ Auto Pool Structure has ERRORS.');
    }

    process.exit(0);
}

verifyAutoPool().catch(console.error);
