
import pool from '../config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logPath = path.resolve(__dirname, 'balance_check_output.txt');

const WIDTH = 3;

async function checkBalance() {
    const client = await pool.connect();
    try {
        const output = [];
        output.push("Checking Auto Pool Balance...");

        // 1. Get Auto Pool Root
        const rootRes = await client.query("SELECT id FROM Nodes WHERE referral_code = 'JSE-ROOT'");
        if (rootRes.rows.length === 0) {
            output.push("No Auto Root found. Skipping.");
            fs.writeFileSync(logPath, output.join('\n'));
            return;
        }
        const rootId = rootRes.rows[0].id;

        // 2. Fetch All Nodes
        const allNodesRes = await client.query("SELECT id, auto_pool_parent_id, created_at FROM Nodes");
        const nodeMap = new Map();
        // Initialize Map
        allNodesRes.rows.forEach(r => nodeMap.set(r.id, { ...r, children: [] }));

        // Link Children
        let validRoot = null;
        for (const node of nodeMap.values()) {
            if (node.id === rootId) validRoot = node;
            if (node.auto_pool_parent_id) {
                const parent = nodeMap.get(node.auto_pool_parent_id);
                if (parent) {
                    parent.children.push(node);
                }
            }
        }

        // Sort children by created_at (BFS Logic Simulation)
        for (const node of nodeMap.values()) {
            node.children.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        }

        if (!validRoot) {
            output.push("Root ID found but not in node list? Data inconsistency.");
            fs.writeFileSync(logPath, output.join('\n'));
            return;
        }

        // 3. BFS to Count Nodes per Depth
        const nodesAtDepth: Record<number, number> = {};
        const bfsQ = [{ node: validRoot, depth: 1 }];
        let maxDepth = 0;

        while (bfsQ.length > 0) {
            const { node, depth } = bfsQ.shift()!;

            nodesAtDepth[depth] = (nodesAtDepth[depth] || 0) + 1;
            if (depth > maxDepth) maxDepth = depth;

            for (const child of node.children) {
                bfsQ.push({ node: child, depth: depth + 1 });
            }
        }

        output.push("Nodes per Depth:");
        for (const [d, c] of Object.entries(nodesAtDepth)) {
            output.push(`Depth ${d}: ${c}`);
        }

        // 4. Verify Balance
        let broken = false;
        // Check depths 1 to MaxDepth-1 (must be full)
        // Wait, the LAST depth doesn't have to be full.
        // But the SECOND to last depth?
        // If we have nodes at Depth D, then Depth D-1 should be FULL.
        // Or at least, we shouldn't have started Depth D+1 until Depth D is FULL?
        // BFS fills D. When D is full, it starts D+1.
        // So, if we see ANY node at Depth D+1 ...
        // Then ALL nodes at Depth D-1 must be full?
        // Example: Depth 1 (Root). Full (1).
        // Depth 2. Full (3).
        // Depth 3. Partial (5/9).
        // Depth 4. Should be 0.
        // If we see node at Depth 4 while Depth 3 is partial -> BROKEN.

        // So: Iterating d from 1 to maxDepth.
        // If d < maxDepth, then actual[d] should be expected[d].
        // WAIT. If maxDepth is 4.
        // Depth 1 should be full.
        // Depth 2 should be full.
        // Depth 3 can be partial.
        // Depth 4 is IMPOSSIBLE if BFS follows order (Depth 4 is children of Depth 3).
        // Only children of Depth 3's *existing* nodes exists.
        // But if Depth 3 is partial, can we have Depth 4?
        // Yes, if the first node of Depth 3 has children.
        // BFS fills Depth 3 nodes into the queue.
        // Then it processes Queue[0] (Depth 3 Node 1).
        // It gives it children (Depth 4).
        // So we CAN have Depth 4 while Depth 3 is partial.

        // New Rule:
        // BFS Queue ensures we process D nodes before D+1 nodes?
        // No, Queue contains Nodes.
        // If we are processing Depth 3 nodes.
        // We add Depth 4 nodes to the END of the queue.
        // So we finish processing ALL Depth 3 nodes (giving them children) before we process ANY Depth 4 node.
        // So, Depth 4 nodes are created.
        // But we don't CREATE Depth 5 nodes until...

        // Wait, "Placement" means creating nodes.
        // Logic: Find Spot.
        // Visit Root (D1). Full (3 children). Add children to queue.
        // Visit Child 1 (D2). Full (3 children). Add children to queue.
        // Visit Child 2 (D2). Not Full (2 children). RETURN Child 2.
        // So we place at Child 2 (Depth 3).

        // So, we only go deeper if the current layer is FULL.
        // So, strictly:
        // If we placed a node at Depth D....
        // It means ALL nodes at Depth D-2 were full.
        // (Because we validated Depth D-2 parents to go to D-1 children).
        // Actually, simpler:
        // We fill a ROW.
        // We fill Depth 2 completely first.
        // Then we fill Depth 3 completely.
        // Then we fill Depth 4 completely.

        // Is that true?
        // Root (D1). Queue [Root].
        // Loop 1: Pop Root. Full. Add C1, C2, C3. Queue [C1, C2, C3].
        // Loop 2: Pop C1. Full. Add G1, G2, G3. Queue [C2, C3, G1, G2, G3].
        // Loop 3: Pop C2. Full. Add G4, G5, G6. Queue [C3, G1, G2, G3, G4, G5, G6].
        // Loop 4: Pop C3. Not Full (0 children). Place at C3.
        // Result: We placed at C3 (Depth 2).
        // Meanwhile, C1 and C2 had children (Depth 3) ALREADY?
        // NO. BFS *finds available spot*. It does NOT traverse already full nodes?
        // Wait. `findGlobalPlacement` logic line 30: `if (count < 3) return currentId`.
        // If Logic:
        // 1. Pop Root. Count=3. Push C1, C2, C3.
        // 2. Pop C1. Count=3. Push G1, G2, G3.
        // 3. Pop C2. Count=0. Return C2.
        // Result: We verify C1, then C2.
        // If C1 count was 3... wait.
        // Does C1 count=3 imply G1, G2, G3 exist? YES.
        // So C1 has children (Depth 3).
        // C2 has 0 children.
        // So we have Depth 3 nodes exists (under C1).
        // But C2 (Depth 2) is empty.
        // So the tree IS NOT filling Depth by Depth!
        // It fills PARENT by PARENT.
        // Since C1 comes before C2.
        // C1 fills completely (getting 3 children).
        // THEN C2 gets its 1st child.
        // So Depth 3 has 3 nodes. Depth 2 has 3 nodes.
        // Then Depth 3 gets 4th node (under C2).

        // So:
        // Depth 1: 1 node (Root)
        // Depth 2: 3 nodes (C1, C2, C3)
        // Depth 3: Can have 3 nodes (under C1) while C2 is empty.
        // So checking "Depth D full before Depth D+1" is WRONG.

        // Correct Validation:
        // BFS order of PARENTS.
        // Parents at Depth D must be filled in order.
        // C1 must be full before C2 gets 1 child.
        // C2 must be full before C3 gets 1 child.
        // C3 must be full before G1 (Child of C1) gets 1 child?
        // NO.
        // Queue order: [C1, C2, C3].
        // If we fill, we fill C1 (get G1, G2, G3).
        // Then we check C2 (get G4...).
        // So Yes, C1 fills before C2 starts.
        // So:
        // For Depth D: Nodes are parents.
        // Sort nodes at Depth D by created_at.
        // Node[i] must be FULL (3 children) before Node[i+1] has > 0 children.
        // THIS is the invariant.

        output.push("Verifying Fill Order (Parent Saturation)...");
        let invariantBroken = false;

        for (let d = 1; d < maxDepth; d++) {
            // Get parents at layer d, sorted roughly by created_at (or id)
            // We used node traversal order `queue.push` in checks?
            // Actually, we need to reconstruct the BFS Queue order of PARENTS.
            // Queue was [Root].
            // Then [C1, C2, C3].
            // Then [G1, G2, G3, G4...].
            // So we can just check the list of nodes at Depth D, sorted by created_at.

            // Get nodes at this depth
            const parents = [];
            for (const node of nodeMap.values()) {
                // We need to know depth. nodeMap doesn't have it calculated.
                // Re-use BFS to extract layers.
            }
        }

        // Let's do a structured check:
        // Flatten layers.
        const layers: any[][] = [];
        const q2 = [{ node: validRoot, depth: 1 }];
        while (q2.length > 0) {
            const { node, depth } = q2.shift()!;
            if (!layers[depth]) layers[depth] = [];
            layers[depth].push(node);
            for (const child of node.children) {
                q2.push({ node: child, depth: depth + 1 });
            }
        }

        for (let d = 1; d < maxDepth; d++) {
            const parents = layers[d] || [];
            // Sort by created_at (since we pushed children sorted).
            // Actually BFS queue order IS the order they were processed/created.
            // So the array order `layers[d]` should be correct fill order.

            let foundNonFull = false;
            for (const p of parents) {
                const childCount = p.children.length;
                if (foundNonFull && childCount > 0) {
                    output.push(`ERROR at Depth ${d}: Node ${p.referral_code} has ${childCount} children, but a previous sibling was not full!`);
                    invariantBroken = true;
                }
                if (childCount < WIDTH) {
                    foundNonFull = true;
                }
            }
        }

        if (invariantBroken) {
            output.push("RESULT: STRUCTURE BROKEN (Fill Order Violated).");
        } else {
            output.push("RESULT: STRUCTURE VALID (Fill Order Preserved).");
        }

        fs.writeFileSync(logPath, output.join('\n'));
        console.log("Logged to", logPath);

    } catch (e: any) {
        fs.writeFileSync(logPath, "ERROR: " + e.message);
        console.error(e);
    } finally {
        client.release();
        process.exit();
    }
}

checkBalance();
