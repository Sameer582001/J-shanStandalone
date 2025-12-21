import { query } from '../config/db.js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function promoteToAdmin(mobile: string | undefined) {
    if (!mobile) {
        console.error('Please provide a mobile number.');
        process.exit(1);
    }

    try {
        console.log(`Attempting to promote user with mobile: ${mobile}...`);

        // Check if user exists
        const userCheck = await query('SELECT * FROM Users WHERE mobile = $1', [mobile]);
        if (userCheck.rows.length === 0) {
            console.error('User not found!');
            process.exit(1);
        }

        const user = userCheck.rows[0];
        console.log(`Found user: ${user.full_name} (Current Role: ${user.role})`);

        if (user.role === 'ADMIN') {
            console.log('User is already an ADMIN.');
            process.exit(0);
        }

        // Update role
        await query("UPDATE Users SET role = 'ADMIN' WHERE mobile = $1", [mobile]);
        console.log('Successfully promoted user to ADMIN.');
    } catch (error) {
        console.error('Error promoting user:', error);
    } finally {
        process.exit(0);
    }
}

const mobileNumber = process.argv[2];
promoteToAdmin(mobileNumber);
