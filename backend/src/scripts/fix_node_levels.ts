
import pool from '../config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Mirror Config Manually
const planConfig = {
    waterfall_levels: {
        "1": { layers: [1], incoming_per_node: 500 },
        "2": { layers: [2, 3], incoming_per_node: 1000 },
        "3": { layers: [4, 5, 6], incoming_per_node: 2000 },
        "4": { layers: [7, 8, 9, 10], incoming_per_node: 4000 }
    }
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logPath = path.resolve(__dirname, 'level_fix_log.txt');

const WIDTH = 3;

function calculateTotalRequired(levelData: any) {
    let totalNodes = 0;
    if (levelData.layers && Array.isArray(levelData.layers)) {
        totalNodes = levelData.layers.reduce((sum: number, layerDepth: number) => {
            return sum + Math.pow(WIDTH, layerDepth);
        }, 0);
    } else {
        totalNodes = Math.pow(WIDTH, 1);
    }
    return totalNodes * levelData.incoming_per_node;
}

async function fixLevels() {
    const client = await pool.connect();
    try {
        fs.writeFileSync(logPath, "--- LEVEL CONSISTENCY FIX RUN ---\n");
        await client.query('BEGIN');

        const res = await client.query(`
            SELECT np.id as progress_id, np.node_id, np.level, np.total_revenue, np.is_completed, n.current_level, n.referral_code
            FROM LevelProgress np
            JOIN Nodes n ON n.id = np.node_id
            WHERE n.status = 'ACTIVE'
            ORDER BY np.node_id ASC, np.level ASC
        `);

        let updates = 0;

        for (const row of res.rows) {
            // @ts-ignore
            const levelData = planConfig.waterfall_levels[row.level.toString()];
            if (!levelData) continue;

            const required = calculateTotalRequired(levelData);
            const revenue = Number(row.total_revenue);
            const isCompleted = row.is_completed;

            if (revenue >= required) {
                // Should be complete
                if (!isCompleted) {
                    await client.query('UPDATE LevelProgress SET is_completed = TRUE, updated_at = NOW() WHERE id = $1', [row.progress_id]);
                    fs.appendFileSync(logPath, `[Progress FIX] Marked Node ${row.referral_code} Level ${row.level} COMPLETE.\n`);
                    updates++;
                }
                // Check if Rank needs Upgrade
                // If Level 1 Complete, Rank should be at least 2.
                if (row.current_level <= row.level) {
                    const newLevel = row.level + 1;
                    await client.query('UPDATE Nodes SET current_level = $1 WHERE id = $2', [newLevel, row.node_id]);
                    fs.appendFileSync(logPath, `[Rank UP] Upgraded Node ${row.referral_code} to Level ${newLevel}\n`);
                    updates++;
                }

            } else {
                // Should NOT be complete
                if (isCompleted) {
                    await client.query('UPDATE LevelProgress SET is_completed = FALSE, updated_at = NOW() WHERE id = $1', [row.progress_id]);
                    fs.appendFileSync(logPath, `[Progress REVERT] Unmarked Node ${row.referral_code} Level ${row.level} as COMPLETE (Rev ${revenue} < Req ${required})\n`);
                    updates++;
                }

                // Check if Rank needs Downgrade?
                // If I am Rank 3, but Level 2 is NOT complete, I should be Rank 2.
                // Logic: My Rank = Max(Completed Level) + 1.
                // But simplifying: If `row.level` is NOT complete, and my Rank > row.level, that's suspicious?
                // Actually, if Level 2 is incomplete, I can't be Level 3.
                // So if (row.level < row.current_level) AND !isCompleted -> Downgrade?
                // Be careful. If Level 1 is complete, I am Level 2.
                // If Level 2 is incomplete, I stay Level 2.
                // So if (row.level == row.current_level - 1) and !isCompleted -> Downgrade to row.level.

                if (row.current_level > row.level) {
                    // Potential Downgrade.
                    // Example: Rank 3. Level 2 Incomplete.
                    // mismatch.
                    // But strictly: Rank should be exactly (Highest Complete Level) + 1.
                    // This simple loop processes one level row at a time.
                    // Let's rely on Revert messages to diagnose, but force downgrade here for safety?
                    // Let's force downgrade if this specific level is incomplete but the user has surpassed it.
                    const correctRank = row.level; // Downgrade to the level we are currently working on
                    await client.query('UPDATE Nodes SET current_level = $1 WHERE id = $2', [correctRank, row.node_id]);
                    fs.appendFileSync(logPath, `[Rank DOWN] Downgraded Node ${row.referral_code} from ${row.current_level} to ${correctRank} (Level ${row.level} incomplete)\n`);
                    updates++;
                }
            }
        }

        await client.query('COMMIT');
        console.log(`Fix Complete. Updates: ${updates}`);
        fs.appendFileSync(logPath, `Run Complete. Updates: ${updates}\n`);

    } catch (e: any) {
        await client.query('ROLLBACK');
        console.error(e);
        fs.appendFileSync(logPath, `ERROR: ${e.message}\n`);
    } finally {
        client.release();
        process.exit();
    }
}

fixLevels();
