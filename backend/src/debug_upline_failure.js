import dotenv from 'dotenv';
import pg from 'pg';
import fs from 'fs';
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: process.env.POSTGRES_PORT ? parseInt(process.env.POSTGRES_PORT, 10) : undefined,
});

async function debugUpline() {
    const client = await pool.connect();
    let output = '';

    try {
        output += "=== Debugging Upline Logic for Node 2 ===\n";
        const nodeId = 2;
        const amount = 2000;

        const q = client.query.bind(client);

        // 1. Find Sponsor (Parent)
        let parent = null;
        const res1 = await q('SELECT sponsor_node_id FROM Nodes WHERE id = $1', [nodeId]);
        if (res1.rows.length > 0 && res1.rows[0].sponsor_node_id) {
            parent = res1.rows[0].sponsor_node_id;
        }
        output += `Parent Found: ${parent}\n`;

        // 2. Find Sponsor's Sponsor (Grandparent)
        let grandparent = null;
        if (parent) {
            const res2 = await q('SELECT sponsor_node_id FROM Nodes WHERE id = $1', [parent]);
            if (res2.rows.length > 0 && res2.rows[0].sponsor_node_id) {
                grandparent = res2.rows[0].sponsor_node_id;
            }
        }
        output += `Grandparent Found: ${grandparent}\n`;

        const split = amount / 2;
        output += `Split Amount: ${split}\n`;

        if (parent) {
            output += `-> WOULD Credit Parent ${parent}: ${split}\n`;
        } else {
            output += "-> Parent invalid, skipping credit.\n";
        }

        if (grandparent) {
            output += `-> WOULD Credit Grandparent ${grandparent}: ${split}\n`;
        } else {
            output += "-> Grandparent invalid, skipping credit.\n";
        }

        fs.writeFileSync('debug_upline_utf8.txt', output, 'utf8');
        console.log("Written to debug_upline_utf8.txt");

    } catch (error) {
        console.error("Error:", error);
    } finally {
        client.release();
        await pool.end();
    }
}

debugUpline();
