
import { query, pool } from './src/config/db';
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

    let skippedParents: number[] = [];
    let broken = false;

    // Use a while loop to traverse
    // logical order: We assume the queue order is the 'correct' fill order

    // To detect a 'skip', we need to check if a node currently in the queue
    // has < 3 children, BUT there are nodes in the system that were placed 'later' 
    // effectively meaning the filling logic moved past this node prematurely.

    // However, 'placed later' is hard to define without timestamps of exact placement.
    // But we can check for "Holes" in the layers.
    // Rule: In a perfect BFS matrix, no node at Level N should have < 3 children 
    // if there exists any node at Level > N+1 (strictly speaking, Level N should fill before N+1 starts).
    // Actually, Level N fills. Then Level N+1 fills.
    // While filling Level N+1 (children of Level N), we fill children of Node A, then Node B, then Node C (where A,B,C are in Level N).
    // So, if Node A (Level N) has 2 children, but Node B (Level N) has 1 child... that's fine (A fills first).
    // But if Node A has 2 children, and Node B has 3 children... that's WRONG. A should look full before B gets any? 
    // OR A gets 3, then B gets 3.
    // Yes. Matrix fills left-to-right (or creation order of parents).

    // Let's verify strict fill order:
    // Iterate through the queue (which represents the parents in order).
    // For each parent, check its children count.
    // If we find a parent with Count < 3, flag it as "Incomplete".
    // If we subsequently find a parent (later in the queue) that has > 0 children, 
    // it implies the previous "Incomplete" parent was skipped.

    // Note: The "Last" parent in the entire filled tree will naturally be incomplete. That is fine.
    // The error is if an incomplete parent is followed by a filled (or partially filled) parent.

    let foundIncomplete = false;
    let incompleteNodeId = -1;

    // We need to fetch ALL nodes and their parent links first to avoid N+1 queries?
    // Or just query efficiently. 
    // Let's do a bulk fetch for performance if tree is large, but for now loop is fine for debug.

    // Better: Get map of parent -> children_count, and parent -> children list
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

    // We also need the order of parents (the queue order).
    // Reconstruct queue using the children logic.
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
                // Don't exit, find all gaps
            }
        }

        if (count < 3) {
            if (!foundIncomplete) {
                foundIncomplete = true;
                incompleteNodeId = currentId;
                // This is the active "filling" node.
                // Any subsequent node in the queue should have 0 children.
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
