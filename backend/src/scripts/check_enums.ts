
import pool, { query } from '../config/db.js';

const checkSchema = async () => {
    try {
        console.log('--- Checking Transactions Schema ---');
        // Check enum values for 'transaction_type' if it exists, or check check constraints
        const res = await query(`
            SELECT pg_type.typname, pg_enum.enumlabel
            FROM pg_type
            JOIN pg_enum ON pg_enum.enumtypid = pg_type.oid
            WHERE pg_type.typname = 'transaction_type';
        `);

        if (res.rows.length > 0) {
            console.log('Enum transaction_type values:', res.rows.map(r => r.enumlabel));
        } else {
            console.log('No enum type found for transaction_type. Checking Check Constraints...');
            const checkRes = await query(`
                SELECT conname, pg_get_constraintdef(oid)
                FROM pg_constraint
                WHERE conrelid = 'Transactions'::regclass AND contype = 'c';
            `);
            console.log('Check Constraints:', checkRes.rows);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
};

checkSchema();
