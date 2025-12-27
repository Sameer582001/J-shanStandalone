
import { query } from '../config/db.js';

export class ProfileService {

    async getProfile(userId: number) {
        const res = await query(
            `SELECT id, full_name, email, mobile, auth_id, 
                    account_holder_name, account_number, ifsc_code, bank_name, bank_details_locked,
                    address_line, city, state, zip_code, address_locked,
                    created_at 
             FROM Users WHERE id = $1`,
            [userId]
        );
        if (res.rows.length === 0) throw new Error('User not found');
        return res.rows[0];
    }

    async updateBankDetails(userId: number, details: {
        account_holder_name: string;
        account_number: string;
        ifsc_code: string;
        bank_name: string;
    }) {
        // 1. Check if locked
        const checkRes = await query('SELECT bank_details_locked FROM Users WHERE id = $1', [userId]);
        if (checkRes.rows.length === 0) throw new Error('User not found');

        if (checkRes.rows[0].bank_details_locked) {
            throw new Error('Bank details are locked and cannot be edited. Contact Admin.');
        }

        // 2. Update and Lock
        await query(
            `UPDATE Users 
             SET account_holder_name = $1, 
                 account_number = $2, 
                 ifsc_code = $3, 
                 bank_name = $4, 
                 bank_details_locked = TRUE,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $5`,
            [details.account_holder_name, details.account_number, details.ifsc_code, details.bank_name, userId]
        );

        return { message: 'Bank details updated and locked successfully.' };
    }

    async updateAddress(userId: number, details: {
        address: string;
        city: string;
        state: string;
        zip: string;
    }) {
        // 1. Check if locked
        const checkRes = await query('SELECT address_locked FROM Users WHERE id = $1', [userId]);
        if (checkRes.rows.length === 0) throw new Error('User not found');

        if (checkRes.rows[0].address_locked) {
            throw new Error('Address is locked and cannot be edited. Contact Admin.');
        }

        // 2. Update and Lock
        await query(
            `UPDATE Users 
             SET address_line = $1, 
                 city = $2, 
                 state = $3, 
                 zip_code = $4,
                 address_locked = TRUE,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $5`,
            [details.address, details.city, details.state, details.zip, userId]
        );

        return { message: 'Address updated and locked successfully.' };
    }
}
