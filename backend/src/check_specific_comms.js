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

async function checkSpecificComms() {
    const client = await pool.connect();
    let output = '';
    try {
        // Node 2: JSE-4IB6ZS
        // Node 3: JSE-YACLQH
        const searchTerms = ['4IB6ZS', 'YACLQH'];

        output += "=== Commission History for Nodes 2 & 3 ===\n";

        for (const term of searchTerms) {
            output += `\n--- Searching for ${term} ---\n`;
            const res = await client.query(`
                SELECT * FROM Transactions 
                WHERE description LIKE $1 OR description LIKE $2
                ORDER BY id ASC
            `, [`%${term}%`, `%${term}%`]); // Redundant check to just pass param

            if (res.rows.length === 0) {
                output += "No transactions found.\n";
            } else {
                res.rows.forEach(r => {
                    output += `ID: ${r.id} | Amount: ${r.amount} | User: ${r.wallet_owner_id} | Desc: ${r.description} | Date: ${r.created_at}\n`;
                });
            }
        }

        fs.writeFileSync('specific_comms.txt', output, 'utf8');

    } catch (error) {
        console.error("Error:", error);
    } finally {
        client.release();
        await pool.end();
    }
}

checkSpecificComms();
