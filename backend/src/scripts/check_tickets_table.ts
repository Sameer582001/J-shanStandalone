
import { query } from '../config/db.js';

const checkTable = async () => {
    try {
        console.log('Checking Tickets table...');
        const result = await query(`
            SELECT table_name, column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'tickets';
        `);

        if (result.rows.length === 0) {
            console.log('Table Tickets does NOT exist.');
        } else {
            console.log('Table Tickets exists. Columns:');
            console.table(result.rows);
        }
    } catch (error) {
        console.error('Error checking table:', error);
    }
};

checkTable();
