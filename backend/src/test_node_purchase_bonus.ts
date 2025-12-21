import { NodeService } from './services/NodeService.js';
import { FinancialService } from './services/FinancialService.js';
import dotenv from 'dotenv';
dotenv.config();

// Mock dependencies
const mockClient = {
    query: async (text: string, params: any[]) => {
        const sql = text.trim();
        // console.log("SQL:", sql);

        // Sponsor Check
        if (sql.includes('SELECT id, owner_user_id')) return { rows: [{ id: 1, owner_user_id: 1, direct_referrals_count: 0, status: 'ACTIVE' }] };

        // Master Wallet Check
        if (sql.includes('SELECT master_wallet_balance')) return { rows: [{ master_wallet_balance: 5000 }] };

        // Placement
        if (sql.includes('SELECT COUNT(*)')) return { rows: [{ count: 0 }] };
        if (sql.includes('SELECT id FROM Nodes WHERE self_pool_parent_id')) return { rows: [] };
        if (sql.includes('SELECT id FROM Nodes WHERE referral_code = \'JSE-ROOT\'')) return { rows: [{ id: 1 }] };

        // Node Insert
        if (sql.includes('INSERT INTO Nodes')) return { rows: [{ id: 100 }] };

        // Transaction Log
        if (sql.includes('INSERT INTO Transactions')) return { rows: [] };

        // Updates
        if (sql.includes('UPDATE')) return { rows: [] };

        // Level Progress
        if (sql.includes('SELECT * FROM LevelProgress')) return { rows: [] };
        if (sql.includes('INSERT INTO LevelProgress')) return { rows: [{ id: 10, buckets: {}, total_revenue: 0 }] };

        return { rows: [] };
    },
    release: () => { }
};

// Mock Pool
import pool from './config/db.js';
pool.connect = async () => mockClient as any;

async function runTest() {
    console.log("--- Testing Purchase Node Bonus ---");
    const nodeService = new NodeService();

    try {
        await nodeService.purchaseNode(2, 'JSE-ROOT');
    } catch (e) {
        console.error("Error:", e);
    }
}

runTest();
