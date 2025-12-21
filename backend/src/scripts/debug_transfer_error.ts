
import pool, { query } from '../config/db.js';
import fs from 'fs';

const debug = async () => {
    let output = '';
    const log = (msg: string, data?: any) => {
        const line = msg + (data ? ' ' + JSON.stringify(data, null, 2) : '') + '\n';
        console.log(line);
        output += line;
    };

    try {
        log('START_DEBUG');

        // Check Node 5
        log('Checking Node 5...');
        const nodeRes = await query('SELECT id, referral_code, owner_user_id, is_rebirth FROM Nodes WHERE id = 5');
        if (nodeRes.rows.length === 0) {
            log('RESULT: Node 5 NOT FOUND');
        } else {
            log('RESULT: Node 5 Found:', nodeRes.rows[0]);
        }

        // Check User 3 - USING CORRECT COLUMNS
        log('Checking User 3...');
        const userRes = await query('SELECT id, full_name, email FROM Users WHERE id = 3');
        if (userRes.rows.length === 0) {
            log('RESULT: User 3 NOT FOUND');
        } else {
            log('RESULT: User 3 Found:', userRes.rows[0]);
        }

    } catch (err) {
        log('ERROR: ' + err);
    } finally {
        fs.writeFileSync('debug_output.txt', output);
        await pool.end();
        console.log('END_DEBUG');
    }
};

debug();
