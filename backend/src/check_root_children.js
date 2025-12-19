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

async function checkChildren() {
    const client = await pool.connect();
    try {
        console.log("=== Checking JSE-ROOT Children ===\n");
        const rootRes = await client.query("SELECT id, referral_code FROM Nodes WHERE referral_code LIKE 'JSE-ROOT%'");
        if (rootRes.rows.length === 0) {
            console.log("Root not found");
            return;
        }
        const rootId = rootRes.rows[0].id;
        console.log(`Root ID: ${rootId}`);

        // Check Self Pool Children
        const selfChildren = await client.query(`
            SELECT id, referral_code, created_at 
            FROM Nodes 
            WHERE self_pool_parent_id = $1
            ORDER BY created_at ASC
        `, [rootId]);

        console.log(`\nSelf Pool Children (Total: ${selfChildren.rows.length}):`);
        selfChildren.rows.forEach(c => {
            console.log(`- ${c.referral_code} (ID: ${c.id})`);
        });

        // Check Auto Pool Children
        const autoChildren = await client.query(`
            SELECT id, referral_code, created_at 
            FROM Nodes 
            WHERE auto_pool_parent_id = $1
            ORDER BY created_at ASC
        `, [rootId]);

        console.log(`\nAuto Pool Children (Total: ${autoChildren.rows.length}):`);
        autoChildren.rows.forEach(c => {
            console.log(`- ${c.referral_code} (ID: ${c.id})`);
        });

    } catch (error) {
        console.error("Error:", error);
    } finally {
        client.release();
        await pool.end();
    }
}

checkChildren();
