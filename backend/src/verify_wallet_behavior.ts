
import { FinancialService } from './services/FinancialService.js';
import dotenv from 'dotenv';
dotenv.config();

// MOCK STATE (Simplified)
let callCount = 0;

const createMockClient = () => {
    return {
        query: async (text: string, params: any[]) => {
            const sql = text.trim();
            // console.log("SQL:", sql); // Uncomment for deep debug

            // 1. LevelProgress SELECT
            if (sql.includes('SELECT * FROM LevelProgress')) {
                // If callCount 0 (Node 1): Return Empty (New)
                // If callCount 1 (Node 2): Return Bucket with 500 (Upgrade half full)
                // If callCount 2 (Node 3): Return Bucket with 1000 (Upgrade full) + 200 (Upline full)

                if (callCount === 0) return { rows: [] }; // Will trigger INSERT
                if (callCount === 1) return { rows: [{ id: 1, buckets: { upgrade: 500 }, total_revenue: "500.00" }] };
                if (callCount === 2) return { rows: [{ id: 1, buckets: { upgrade: 1000, upline: 0 }, total_revenue: "1000.00" }] }; // Upgrade Full, Upline Empty
                return { rows: [] };
            }

            // 2. LevelProgress INSERT
            if (sql.includes('INSERT INTO LevelProgress')) {
                return { rows: [{ id: 1, buckets: {}, total_revenue: 0 }] };
            }

            // 3. LevelProgress UPDATE
            if (sql.includes('UPDATE LevelProgress')) {
                return { rows: [] };
            }

            // 4. Checking Upgrade Targets or Upline
            if (sql.includes('SELECT self_pool_parent_id')) return { rows: [{ self_pool_parent_id: 100 }] };

            // 5. Wallet Credit
            if (sql.includes('UPDATE Nodes SET wallet_balance')) {
                console.log(`[Result] WALLET CREDITED: amount=${params[0]} for NodeID=${params[1]}`);
                return { rows: [] };
            }

            // Check Level Completion
            if (sql.includes('current_level')) return { rows: [{ current_level: 1 }] };

            // Misc matches
            if (sql.includes('SELECT * FROM Nodes')) return { rows: [{ id: 1, is_rebirth: false }] };
            if (sql.includes('SELECT owner_user_id')) return { rows: [{ owner_user_id: 1 }] };
            if (sql.includes('INSERT INTO Transactions')) return { rows: [] };
            if (sql.includes('count')) return { rows: [{ count: 0 }] };

            return { rows: [] };
        }
    };
};

async function runVerify() {
    try {
        const service = new FinancialService();
        const mockClient = createMockClient();

        // Node 1
        console.log("[Step 1] Incoming 500");
        try { await service.processIncome(1, 500, 1, 'SELF', mockClient); }
        catch (e: any) { console.error("Step 1 Failed:", e.message, e.stack); }
        callCount++;

        // Node 2
        console.log("[Step 2] Incoming 500");
        try { await service.processIncome(1, 500, 1, 'SELF', mockClient); }
        catch (e: any) { console.error("Step 2 Failed:", e.message, e.stack); }
        callCount++;

        // Node 3
        console.log("[Step 3] Incoming 500");
        try { await service.processIncome(1, 500, 1, 'SELF', mockClient); }
        catch (e: any) { console.error("Step 3 Failed:", e.message, e.stack); }

    } catch (err: any) {
        console.error("Global Init Error:", err);
    }
}

runVerify();
