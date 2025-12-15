import { query } from '../config/db.js';
import bcrypt from 'bcrypt';

export class AdminService {

    // Seed Root User & Node
    async seedRootUser(data: any) {
        const { name, email, password, mobile } = data;

        // 1. Validation
        if (!name || !email || !password || !mobile) {
            throw new Error('All fields (name, email, password, mobile) are required');
        }

        // 2. Check if System is already initialized (JSE-ROOT exists)
        const rootNodeReq = await query("SELECT id FROM Nodes WHERE referral_code = 'JSE-ROOT'");
        if (rootNodeReq.rows.length > 0) {
            throw new Error('System is already initialized. JSE-ROOT exists.');
        }

        // 3. Check if Admin/User already exists (by email/mobile)
        const userCheck = await query('SELECT id FROM Users WHERE email = $1 OR mobile = $2', [email, mobile]);
        if (userCheck.rows.length > 0) {
            throw new Error('User with this email or mobile already exists.');
        }

        try {
            // 4. Create User (Admin Role)
            const passwordHash = await bcrypt.hash(password, 10);

            // Adjust role to 'ADMIN' since this is the Root User
            // Assuming we want this user to be an admin.
            const userRes = await query(
                `INSERT INTO Users (auth_id, full_name, email, mobile, password_hash, role, master_wallet_balance)
                 VALUES ($1, $2, $3, $4, $5, 'USER', 0.00)
                 RETURNING id`,
                [`ROOT_${Date.now()}`, name, email, mobile, passwordHash]
            );
            const userId = userRes.rows[0].id;

            // 5. Create JSE-ROOT Node
            await query(
                `INSERT INTO Nodes (referral_code, owner_user_id, status, wallet_balance, direct_referrals_count, sponsor_node_id, self_pool_parent_id, auto_pool_parent_id)
                 VALUES ('JSE-ROOT', $1, 'ACTIVE', 0.00, 0, NULL, NULL, NULL)
                 RETURNING id`,
                [userId]
            );

            return { success: true, message: 'System initialized successfully. Root User and Node created.', userId };

        } catch (error) {
            console.error('Seed Root Error:', error);
            throw new Error('Failed to initialize system.');
        }
    }
    async getAllUsers(limit: number = 50, offset: number = 0) {
        const res = await query(`
            SELECT u.id, u.full_name, u.email, u.mobile, u.role, u.master_wallet_balance, u.created_at,
            (SELECT COUNT(*) FROM Nodes n WHERE n.owner_user_id = u.id) as node_count
            FROM Users u
            ORDER BY u.created_at DESC 
            LIMIT $1 OFFSET $2
        `, [limit, offset]);
        const countRes = await query('SELECT COUNT(*) as count FROM Users');
        return {
            users: res.rows,
            total: parseInt(countRes.rows[0].count)
        };
    }

    // Reset User Password (Admin Override)
    async resetUserPassword(targetUserIdOrEmail: string | number, newPassword: string) {
        // 1. Find User
        let queryStr = '';
        let param: any;

        if (typeof targetUserIdOrEmail === 'number' || !isNaN(Number(targetUserIdOrEmail))) {
            queryStr = 'SELECT id FROM Users WHERE id = $1';
            param = Number(targetUserIdOrEmail);
        } else {
            queryStr = 'SELECT id FROM Users WHERE email = $1';
            param = targetUserIdOrEmail;
        }

        const userRes = await query(queryStr, [param]);
        if (userRes.rows.length === 0) {
            throw new Error('User not found');
        }
        const userId = userRes.rows[0].id;

        // 2. Hash New Password
        const passwordHash = await bcrypt.hash(newPassword, 10);

        // 3. Update Password
        await query('UPDATE Users SET password_hash = $1 WHERE id = $2', [passwordHash, userId]);

        return { message: 'Password reset successfully' };
    }
}
