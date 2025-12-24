
import { query } from '../config/db.js';

const checkUsersTable = async () => {
    try {
        console.log('Checking Users table columns...');
        const result = await query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users';
        `);
        console.table(result.rows);
    } catch (error) {
        console.error('Error checking Users table:', error);
    }
};

checkUsersTable();
