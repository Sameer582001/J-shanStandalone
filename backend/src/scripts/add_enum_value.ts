
import pool, { query } from '../config/db.js';

const fixEnum = async () => {
    try {
        console.log('--- Adding ADMIN_ACTION to Enum ---');
        await query("ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'ADMIN_ACTION'");
        console.log('✅ Success: ADMIN_ACTION added.');
    } catch (err) {
        console.error('ERROR:', err);
    } finally {
        await pool.end();
    }
};

fixEnum();
