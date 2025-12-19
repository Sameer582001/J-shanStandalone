import dotenv from 'dotenv';
import pg from 'pg';
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: process.env.POSTGRES_PORT ? parseInt(process.env.POSTGRES_PORT, 10) : undefined,
});

async function findGlobalPlacement() {
    const client = await pool.connect();
    const q = client.query.bind(client);

    try {
        console.log("=== Debugging Global Placement BFS ===");

        let rootId;
        const rootRes = await q("SELECT id FROM Nodes WHERE referral_code = 'JSE-ROOT'");
        if (rootRes.rows.length > 0) rootId = rootRes.rows[0].id;
        else rootId = 1;

        console.log(`Root ID: ${rootId}`);
        const queue = [rootId];
        const visited = new Set();

        while (queue.length > 0) {
            const currentId = queue.shift();

            // Log when we visit target nodes
            if ([8, 9, 24, 25, 26, 27].includes(currentId)) {
                console.log(`Visiting Node ${currentId}...`);
            }

            const res = await q('SELECT COUNT(*) as count FROM Nodes WHERE auto_pool_parent_id = $1', [currentId]);
            const count = parseInt(res.rows[0].count);

            if ([8, 9, 24, 25, 26, 27].includes(currentId)) {
                console.log(` - Node ${currentId} Count: ${count}`);
            }

            if (count < 3) {
                console.log(`>>> FOUND PLACEMENT: ${currentId} (Count ${count} < 3)`);
                // Continue searching to see others? No, BFS stops.
                // But for debug, we want to see if it Would skip 25.
                if (currentId === 25) {
                    console.log("!!! Node 25 IS Valid Placement !!!");
                }
                if (currentId === 26) {
                    console.log("!!! Found 26. WARNING: Did we verify 25?");
                }

                // In real code we return. Here we return to stop.
                // return;
            }

            const childrenRes = await q('SELECT id FROM Nodes WHERE auto_pool_parent_id = $1 ORDER BY created_at ASC, id ASC', [currentId]);
            const kids = childrenRes.rows.map(r => r.id);

            if ([8, 9].includes(currentId)) {
                console.log(` - Node ${currentId} Children Enqueued: ${kids}`);
            }

            for (const row of childrenRes.rows) {
                queue.push(row.id);
            }
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        client.release();
        await pool.end();
    }
}

findGlobalPlacement();
