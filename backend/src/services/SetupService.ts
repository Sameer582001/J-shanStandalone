
import { query } from '../config/db.js';
import bcrypt from 'bcrypt';
import pool from '../config/db.js';

export class SetupService {

    async getSystemStatus() {
        const res = await query('SELECT COUNT(*) FROM Users');
        const count = parseInt(res.rows[0].count);
        return { initialized: count > 0 };
    }

    async initializeSystem(data: any) {
        // Expect: adminMobile, adminPassword, rootName, rootEmail, rootMobile, rootPassword
        const { adminMobile, adminPassword, rootName, rootEmail, rootMobile, rootPassword } = data;

        if (!adminMobile || !adminPassword || !rootMobile || !rootPassword) {
            throw new Error('All admin and root user fields are required');
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Double Check Empty
            const check = await client.query('SELECT COUNT(*) FROM Users');
            if (parseInt(check.rows[0].count) > 0) {
                throw new Error('System already initialized');
            }

            // 2. Create System Admin (Isolated)
            const adminHash = await bcrypt.hash(adminPassword, 10);
            const adminRes = await client.query(
                `INSERT INTO Users (auth_id, full_name, email, mobile, password_hash, role)
                 VALUES ($1, 'System Admin', 'admin@system.local', $2, $3, 'ADMIN') RETURNING id`,
                ['ADMIN_SYS_001', adminMobile, adminHash]
            );
            const adminId = adminRes.rows[0].id;

            // 3. Create Root User (Owner of Tree)
            const rootHash = await bcrypt.hash(rootPassword, 10);
            const rootRes = await client.query(
                `INSERT INTO Users (auth_id, full_name, email, mobile, password_hash, role)
                 VALUES ($1, $2, $3, $4, $5, 'USER') RETURNING id`,
                ['ROOT_USER_001', rootName || 'Root User', rootEmail || 'root@system.local', rootMobile, rootHash]
            );
            const rootUserId = rootRes.rows[0].id;

            // 4. Create JSE-ROOT Node (For Root User)
            const rootNodeRes = await client.query(
                `INSERT INTO Nodes (referral_code, owner_user_id, status, wallet_balance, direct_referrals_count, sponsor_node_id, self_pool_parent_id, auto_pool_parent_id) 
                 VALUES ('JSE-ROOT', $1, 'ACTIVE', 0.00, 0, NULL, NULL, NULL) RETURNING id`,
                [rootUserId]
            );

            await client.query('COMMIT');
            return { message: 'System Initialized', adminId, rootUserId, rootNodeId: rootNodeRes.rows[0].id };

        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }
}
