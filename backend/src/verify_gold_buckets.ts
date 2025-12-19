
import { FinancialService } from './services/FinancialService.js';
import dotenv from 'dotenv';
dotenv.config();

let callCount = 0;
const createMockClient = () => {
    return {
        query: async (text: string, params: any[]) => {
            const sql = text.trim();
            console.log("SQL:", sql);

            // LevelProgress
            if (sql.includes('SELECT * FROM LevelProgress')) return {
                rows: [{
                    id: 1,
                    buckets: { upgrade: 3000, rebirth: 1000 }, // Pre-filled to skip to System
                    total_revenue: 4000
                }]
            };
            if (sql.includes('INSERT INTO LevelProgress')) return { rows: [{ id: 1, buckets: {}, total_revenue: 0 }] };
            if (sql.includes('UPDATE LevelProgress')) return { rows: [] };

            // Wallet Checks
            // Master Wallet Update (Users table)
            if (sql.includes('UPDATE Users SET master_wallet_balance')) {
                // Check if it's Admin (ID 1) or User
                console.log(`[Result] MASTER WALLET CREDITED: ID=${params[1]} Amount=${params[0]}`);
                return { rows: [] };
            }

            // Node Checks
            if (sql.includes('current_level')) return { rows: [{ current_level: 2 }] };
            if (sql.includes('SELECT * FROM Nodes')) return { rows: [{ id: 10, is_rebirth: false, referral_code: 'GOLD-NODE' }] };
            if (sql.includes('SELECT owner_user_id')) return { rows: [{ owner_user_id: 5 }] }; // User 5

            return { rows: [] };
        }
    };
};

async function runVerify() {
    console.log("--- Simulating Gold Income to check System Fee ---");
    const service = new FinancialService();
    const mockClient = createMockClient();

    // Gold needs 9000 total.
    // Buckets: Upgrade(3000), Rebirth(1000), System(2000).
    // Let's send 5000. 
    // It should fill Upgrade(3000), Rebirth(1000), and System(1000 partial).

    // We need to trick `getConfig` to see Level 2 logic.
    await service.processIncome(10, 5000, 2, 'SELF', mockClient);
}
runVerify();
