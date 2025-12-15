
import { query } from '../config/db.js';
import 'dotenv/config';

async function cleanup() {
    console.log('--- Cleaning up invalid balances ---');

    // Set NULL to 0
    await query("UPDATE Users SET master_wallet_balance = 0 WHERE master_wallet_balance IS NULL");

    // Set 'NaN' to 0 (Postgres Numeric type supports 'NaN' value)
    const nanRes = await query("UPDATE Users SET master_wallet_balance = 0 WHERE master_wallet_balance = 'NaN'");
    console.log(`Updated ${nanRes.rowCount} users with 'NaN' balance.`);

    // If 'NaN' is stored as string (unlikely for DECIMAL but just in case of type confusion)
    // We can't query decimal column for string 'NaN'.
    // Assuming type safety in PG prevents 'NaN' string in DECIMAL.
    // The previous error likely came from JS side parsing NULL.

    console.log('Cleanup complete.');
    process.exit();
}

cleanup().catch(console.error);
