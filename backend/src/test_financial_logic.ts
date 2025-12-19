
import { FinancialService } from './services/FinancialService.js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

// Mock Client
const createMockClient = () => {
    return {
        query: async (text: string, params: any[]) => {
            const sql = text.trim();
            if (sql.startsWith('SELECT self_pool_parent_id FROM Nodes')) {
                const id = params[0];
                if (id > 1) return { rows: [{ self_pool_parent_id: id - 1 }] };
                return { rows: [] };
            }
            if (sql.startsWith('SELECT auto_pool_parent_id FROM Nodes')) {
                const id = params[0];
                if (id > 1) return { rows: [{ auto_pool_parent_id: id - 1 }] };
                return { rows: [] };
            }
            if (sql.toLowerCase().includes('count(*)')) {
                return { rows: [{ count: 0 }] };
            }
            if (sql.startsWith('SELECT * FROM Nodes WHERE id')) {
                return { rows: [{ id: params[0], is_rebirth: false, referral_code: 'TEST-NODE', owner_user_id: 1 }] };
            }
            if (sql.startsWith('SELECT owner_user_id FROM Nodes')) {
                return { rows: [{ owner_user_id: 1 }] };
            }
            if (sql.startsWith('SELECT current_level as current_level FROM Nodes')) {
                return { rows: [{ current_level: 1 }] };
            }
            if (sql.startsWith('SELECT * FROM LevelProgress')) return { rows: [{ id: 1, total_revenue: 0, buckets: {} }] };
            if (sql.startsWith('INSERT INTO LevelProgress')) return { rows: [{ id: 1, total_revenue: 0, buckets: {} }] };
            if (sql.startsWith('INSERT INTO NodeWallet') || sql.startsWith('UPDATE Nodes SET wallet_balance')) {
                return { rows: [] };
            }
            if (sql.startsWith('INSERT INTO Nodes')) {
                return { rows: [{ id: 999 }] };
            }

            return { rows: [] };
        }
    };
};

const LOG_FILE = 'test_results.log';
// Clear log
fs.writeFileSync(LOG_FILE, "--- TEST RESULTS ---\n");

const log = (msg: string) => {
    fs.appendFileSync(LOG_FILE, msg + "\n");
    console.log(msg);
};

async function testLogic() {
    log("STARTING UNIT TEST");
    const service = new FinancialService();
    const mockClient = createMockClient();
    const originalProcess = service.processIncome.bind(service);

    // TEST 1: SILVER
    try {
        let upgradeTarget = null;
        // @ts-ignore
        service.processIncome = async (nodeId, amount, level, poolType, client, depth = 0) => {
            if (depth > 0 && amount === 1000 && level === 2) upgradeTarget = nodeId;
            if (depth === 0) return originalProcess(nodeId, amount, level, poolType, client, depth);
            return;
        };

        await service.processIncome(15, 1500, 1, 'SELF', mockClient);

        if (upgradeTarget === 13) log("TEST 1 PASS: Node 13 got Upgrade.");
        else log(`TEST 1 FAIL: Got Node ${upgradeTarget}`);
    } catch (e: any) { log("TEST 1 ERROR: " + e.message); }

    // TEST 2: GOLD
    try {
        let upgradeTarget = null;
        // @ts-ignore
        service.processIncome = async (nodeId, amount, level, poolType, client, depth = 0) => {
            if (depth > 0 && amount === 3000 && level === 3) upgradeTarget = nodeId;
            if (depth === 0) return originalProcess(nodeId, amount, level, poolType, client, depth);
            return;
        };
        await service.processIncome(15, 9000, 2, 'SELF', mockClient);
        if (upgradeTarget === 10) log("TEST 2 PASS: Node 10 got Upgrade.");
        else log(`TEST 2 FAIL: Got Node ${upgradeTarget}`);
    } catch (e: any) { log("TEST 2 ERROR: " + e.message); }


    // TEST 3: PLATINUM
    try {
        let upgradeTarget = null;
        // @ts-ignore
        service.processIncome = async (nodeId, amount, level, poolType, client, depth = 0) => {
            if (depth > 0 && amount === 27000 && level === 4) upgradeTarget = nodeId;
            if (depth === 0) return originalProcess(nodeId, amount, level, poolType, client, depth);
            return;
        };
        await service.processIncome(15, 81000, 3, 'SELF', mockClient);
        if (upgradeTarget === 6) log("TEST 3 PASS: Node 6 got Upgrade.");
        else log(`TEST 3 FAIL: Got Node ${upgradeTarget}`);
    } catch (e: any) { log("TEST 3 ERROR: " + e.message); }
}

testLogic();
