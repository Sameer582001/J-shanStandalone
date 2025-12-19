import dotenv from 'dotenv';
import pg from 'pg';
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: process.env.POSTGRES_PORT,
});

async function analyzeNodeWallets() {
    const client = await pool.connect();
    try {
        // Find nodes with highest wallet balance
        console.log("=== Nodes with Highest Wallet Balance ===\n");
        const topNodes = await client.query(`
            SELECT n.id, n.referral_code, n.owner_user_id, n.wallet_balance::text, n.current_level, n.direct_referrals_count
            FROM Nodes n
            ORDER BY n.wallet_balance DESC
            LIMIT 5
        `);

        topNodes.rows.forEach(node => {
            console.log(`Node ${node.id} (${node.referral_code}) | Owner: User ${node.owner_user_id} | Balance: ₹${node.wallet_balance} | Level: ${node.current_level} | Direct Refs: ${node.direct_referrals_count}`);
        });

        if (topNodes.rows.length === 0) {
            console.log("No nodes found");
            return;
        }

        // Analyze the node with highest balance
        const targetNode = topNodes.rows[0];
        const nodeId = targetNode.id;
        console.log(`\n=== Analyzing Node ${nodeId} (${targetNode.referral_code}) ===`);
        console.log(`Wallet Balance: ₹${targetNode.wallet_balance}\n`);

        // Get ALL transactions for this NODE (where node_id = this node)
        console.log("=== All Transactions for This Node ===\n");
        const nodeTxns = await client.query(`
            SELECT t.id, t.amount::text, t.type, t.description, to_char(t.created_at, 'HH24:MI:SS') as time
            FROM Transactions t
            WHERE t.node_id = $1
            ORDER BY t.created_at ASC
        `, [nodeId]);

        console.log(`Total Transactions: ${nodeTxns.rows.length}\n`);
        nodeTxns.rows.forEach((row, idx) => {
            console.log(`${idx + 1}. [${row.time}] ${row.type} | ₹${row.amount} | ${row.description}`);
        });

        // Group CREDIT transactions by description
        console.log("\n=== Grouped CREDIT Transactions ===\n");
        const grouped = await client.query(`
            SELECT description, COUNT(*) as count, SUM(amount)::text as total
            FROM Transactions
            WHERE node_id = $1 AND type = 'CREDIT'
            GROUP BY description
            ORDER BY description
        `, [nodeId]);

        grouped.rows.forEach(row => {
            console.log(`"${row.description}" | Count: ${row.count} | Total: ₹${row.total}`);
        });

        // Calculate expected vs actual
        console.log("\n=== Summary ===");
        const totalCredits = await client.query(`
            SELECT SUM(amount)::text as total
            FROM Transactions
            WHERE node_id = $1 AND type = 'CREDIT'
        `, [nodeId]);
        console.log(`Total Credits: ₹${totalCredits.rows[0].total}`);
        console.log(`Node Wallet Balance: ₹${targetNode.wallet_balance}`);

    } catch (error) {
        console.error("Error:", error);
    } finally {
        client.release();
        await pool.end();
    }
}

analyzeNodeWallets();
