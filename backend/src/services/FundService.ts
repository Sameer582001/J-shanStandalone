import { query } from '../config/db.js';

export class FundService {

    constructor() {
    }

    // User: Create Fund Request
    async createRequest(userId: number, amount: number, utrNumber: string) {
        if (!amount || amount <= 0) throw new Error('Invalid amount');
        if (!utrNumber) throw new Error('UTR Number is required');

        // Check for duplicate UTR
        const duplicateCheck = await query('SELECT id FROM FundRequests WHERE utr_number = $1', [utrNumber]);
        if (duplicateCheck.rows.length > 0) {
            throw new Error('This UTR number has already been submitted.');
        }

        const result = await query(
            `INSERT INTO FundRequests (user_id, amount, utr_number, status) 
             VALUES ($1, $2, $3, 'PENDING') RETURNING *`,
            [userId, amount, utrNumber]
        );
        return result.rows[0];
    }

    // User: Get My Requests
    async getUserRequests(userId: number) {
        const result = await query(
            `SELECT * FROM FundRequests WHERE user_id = $1 ORDER BY created_at DESC`,
            [userId]
        );
        return result.rows;
    }

    // Admin: Get All Requests (with filters)
    async getAllRequests(status?: string) {
        let sql = `SELECT fr.*, u.full_name, u.email, u.mobile 
                   FROM FundRequests fr 
                   JOIN Users u ON fr.user_id = u.id`;
        const params: any[] = [];

        if (status) {
            sql += ` WHERE fr.status = $1`;
            params.push(status);
        }

        sql += ` ORDER BY fr.created_at DESC`;
        const result = await query(sql, params);
        return result.rows;
    }

    // Admin: Verify and Approve
    async verifyRequest(requestId: number, adminUtr: string, adminAmount: number) {
        const res = await query('SELECT * FROM FundRequests WHERE id = $1', [requestId]);
        const request = res.rows[0];

        if (!request) throw new Error('Request not found');
        if (request.status !== 'PENDING') throw new Error('Request is already processed');

        console.log(`[FundService] Strict Verification: AdminUTR=${adminUtr}, UserUTR=${request.utr_number}, AdminAmt=${adminAmount}, UserAmt=${request.amount}`);

        // STRICT VERIFICATION
        if (request.utr_number.trim() !== adminUtr.trim()) {
            throw new Error('UTR Mismatch! The provided UTR does not match the user request.');
        }
        // Precision handling for amount comparison
        if (Number(request.amount) !== Number(adminAmount)) {
            throw new Error('Amount Mismatch! The provided amount does not match the user request.');
        }

        // Identify wallet owner (Master Wallet usually belongs to user themselves)
        // NOTE: Since our db.ts 'query' helper does not support persistent transaction clients,
        // we will execute these standard queries sequentially. 
        // Ideally, we should refactor db.ts to support client.connect() for true transactions.

        try {
            console.log(`[FundService] Verifying Request ${requestId} for User ${request.user_id}`);

            // 1. Update Request Status
            // We do this first. If it fails, nothing else happens.
            await query(
                `UPDATE FundRequests SET status = 'APPROVED', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
                [requestId]
            );

            // 2. Add Funds to User's Master Wallet
            await query(
                `UPDATE Users SET master_wallet_balance = master_wallet_balance + $1 WHERE id = $2`,
                [request.amount, request.user_id]
            );

            // 3. Log Transaction
            await query(
                `INSERT INTO Transactions (wallet_owner_id, amount, type, description, status) 
                 VALUES ($1, $2, 'CREDIT', 'Fund Added via UTR: ' || $3, 'COMPLETED')`,
                [request.user_id, request.amount, request.utr_number]
            );

        } catch (error) {
            console.error("Error processing fund approval", error);
            // Since we can't rollback easily with current db setup, we log critical error.
            throw error;
        }

        return { message: 'Funds Approved and Credited Successfully' };
    }

    // Admin: Reject Request
    async rejectRequest(requestId: number, remarks: string) {
        await query(
            `UPDATE FundRequests SET status = 'REJECTED', admin_remarks = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
            [remarks, requestId]
        );
        return { message: 'Request Rejected' };
    }

    // QR Code Management (via SystemSettings)
    async getQrCodeAndUpi() {
        // We now generate QR from UPI ID + Payee Name (optional)
        // Repurposing 'admin_qr_code_url' key? No, let's use 'admin_payee_name'
        const payeeRes = await query(`SELECT value FROM SystemSettings WHERE key = 'admin_payee_name'`);
        const upiRes = await query(`SELECT value FROM SystemSettings WHERE key = 'admin_upi_id'`);
        return {
            payeeName: payeeRes.rows[0]?.value || '',
            upiId: upiRes.rows[0]?.value || ''
        };
    }

    async updateQrCode(payeeName: string, upiId: string) {
        // Upsert Payee Name
        await query(`
            INSERT INTO SystemSettings (key, value) VALUES ('admin_payee_name', $1)
            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
        `, [payeeName]);

        // Upsert UPI ID
        await query(`
            INSERT INTO SystemSettings (key, value) VALUES ('admin_upi_id', $1)
            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
        `, [upiId]);
    }
}
