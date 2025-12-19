import { FinancialService } from './services/FinancialService.js';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Test to verify the entry fee cascade works correctly:
 * 1. First 3 nodes enter → Each pays ₹500 to parent's Silver bucket
 * 2. After 3rd node → Parent's Silver completes (₹1,500)
 * 3. Silver upgrade triggers → ₹1,000 paid to 2nd upline's Gold bucket
 * 4. Verify logs show correct flow
 */

const mockState: any = {
    levelProgress: {}, // key: "nodeId-level-poolType"
    walletCredits: [],
    upgradeActions: []
};

const createMockClient = () => {
    return {
        query: async (text: string, params: any[]) => {
            const sql = text.trim();

            // LevelProgress SELECT
            if (sql.includes('SELECT * FROM LevelProgress')) {
                const nodeId = params[0];
                const level = params[1];
                const poolType = params[2];
                const key = `${nodeId}-${level}-${poolType}`;

                if (mockState.levelProgress[key]) {
                    return { rows: [mockState.levelProgress[key]] };
                }
                return { rows: [] };
            }

            // LevelProgress INSERT
            if (sql.includes('INSERT INTO LevelProgress')) {
                const nodeId = params[0];
                const level = params[1];
                const poolType = params[2];
                const key = `${nodeId}-${level}-${poolType}`;

                const newRow = {
                    id: Object.keys(mockState.levelProgress).length + 1,
                    node_id: nodeId,
                    level: level,
                    pool_type: poolType,
                    total_revenue: 0,
                    buckets: {},
                    is_completed: false
                };
                mockState.levelProgress[key] = newRow;
                return { rows: [newRow] };
            }

            // LevelProgress UPDATE
            if (sql.includes('UPDATE LevelProgress')) {
                const newRev = params[0];
                const buckets = typeof params[1] === 'string' ? JSON.parse(params[1]) : params[1];
                const id = params[2];

                for (const key in mockState.levelProgress) {
                    if (mockState.levelProgress[key].id === id) {
                        mockState.levelProgress[key].total_revenue = newRev;
                        mockState.levelProgress[key].buckets = buckets;
                        console.log(`[Progress Update] ${key}: Revenue=${newRev}, Buckets=${JSON.stringify(buckets)}`);
                    }
                }
                return { rows: [] };
            }

            // Find Upline
            if (sql.includes('SELECT self_pool_parent_id') || sql.includes('SELECT auto_pool_parent_id')) {
                const nodeId = params[0];
                // Mock tree: Node 1 (root) -> Node 2 (parent) -> Node 3,4,5 (children)
                // Node 3,4,5 parent is Node 2
                // Node 2 parent is Node 1
                if (nodeId >= 3 && nodeId <= 5) return { rows: [{ self_pool_parent_id: 2, auto_pool_parent_id: 2 }] };
                if (nodeId === 2) return { rows: [{ self_pool_parent_id: 1, auto_pool_parent_id: 1 }] };
                return { rows: [] }; // Node 1 is root
            }

            // Wallet Credits
            if (sql.includes('UPDATE Nodes SET wallet_balance')) {
                mockState.walletCredits.push({ nodeId: params[1], amount: params[0] });
                console.log(`[Wallet Credit] Node ${params[1]}: ₹${params[0]}`);
                return { rows: [] };
            }

            // Node Info
            if (sql.includes('SELECT * FROM Nodes')) {
                return { rows: [{ id: params[0], is_rebirth: false, referral_code: `NODE-${params[0]}`, owner_user_id: params[0] }] };
            }

            if (sql.includes('SELECT owner_user_id')) {
                return { rows: [{ owner_user_id: params[0] }] };
            }

            if (sql.includes('current_level')) {
                return { rows: [{ current_level: 1 }] };
            }

            if (sql.includes('INSERT INTO Transactions')) return { rows: [] };
            if (sql.includes('UPDATE Users SET master_wallet_balance')) {
                console.log(`[Master Wallet] User ${params[1]}: ₹${params[0]}`);
                return { rows: [] };
            }

            return { rows: [] };
        }
    };
};

async function runTest() {
    console.log("=== Testing Entry Fee Cascade ===\n");

    const service = new FinancialService();
    const mockClient = createMockClient();

    console.log("Step 1: Node 3 enters, pays ₹500 to Node 2 (parent)");
    await service.distributeNewNodeCommissions(3, 'SELF', mockClient);

    console.log("\nStep 2: Node 4 enters, pays ₹500 to Node 2");
    await service.distributeNewNodeCommissions(4, 'SELF', mockClient);

    console.log("\nStep 3: Node 5 enters, pays ₹500 to Node 2");
    console.log("Expected: Node 2's Silver completes (₹1,500), triggers upgrade to Node 1's Gold");
    await service.distributeNewNodeCommissions(5, 'SELF', mockClient);

    console.log("\n=== Final State ===");
    console.log("Level Progress:");
    for (const [key, val] of Object.entries(mockState.levelProgress)) {
        const v = val as any;
        console.log(`  ${key}: Revenue=${v.total_revenue}, Buckets=${JSON.stringify(v.buckets)}`);
    }

    console.log("\nExpected Results:");
    console.log("  - Node 2 Level 1 (Silver): Revenue=1500, Buckets={upgrade:1000, upline:200}");
    console.log("  - Node 2 Wallet: ₹300 (profit)");
    console.log("  - Node 1 Level 2 (Gold): Revenue=1000 (from Node 2's upgrade)");
}

runTest().catch(console.error);
