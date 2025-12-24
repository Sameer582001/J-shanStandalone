
import { query } from '../config/db.js';

const fixNewsTable = async () => {
    try {
        console.log('Fixing News Table Schema...');
        // Check if column exists
        const res = await query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='news' AND column_name='is_active';
        `);

        if (res.rows.length === 0) {
            console.log('Column is_active missing. Adding it...');
            await query(`ALTER TABLE News ADD COLUMN is_active BOOLEAN DEFAULT TRUE;`);
            console.log('Column added.');
        } else {
            console.log('Column is_active already exists.');
        }

    } catch (error) {
        console.error('Error fixing News table:', error);
    }
};

fixNewsTable();
