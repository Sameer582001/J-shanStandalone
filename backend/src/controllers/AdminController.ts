import type { Request, Response } from 'express';
import { AdminService } from '../services/AdminService.js';
import { NodeService } from '../services/NodeService.js';
import { AuthService } from '../services/AuthService.js';
import { WalletService } from '../services/WalletService.js';
import pool from '../config/db.js';

const adminService = new AdminService();
const nodeService = new NodeService();
const walletService = new WalletService();

export class AdminController {

    static async migrateUser(req: Request, res: Response) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const { fullName, email, mobile, sponsorCode } = req.body;
            console.log(`[Migration] Migrating User: ${email}, Sponsor: ${sponsorCode}`);

            const authService = new AuthService();
            let userId;

            try {
                // 1. Create User (Skip OTP)
                const regResult = await authService.register({ fullName, email, mobile }, true);
                userId = regResult.userId;
            } catch (err: any) {
                if (err.message.includes('User already exists')) {
                    const userRes = await client.query('SELECT id FROM Users WHERE email = $1', [email]);
                    userId = userRes.rows[0].id;
                    console.log(`[Migration] User already exists (ID: ${userId}). Proceeding to Node check.`);
                } else {
                    throw err;
                }
            }

            // 2. Credit Wallet (Virtual Fund)
            // Commit needed before NodeService (which makes its own connection) can verify funds?
            // Actually, NodeService.purchaseNode checks balance. Balance check is a SELECT.
            // If we credit in THIS transaction, other transactions WON'T see it until commit.
            // NodeService.purchaseNode uses pool.connect() -> NEW CLIENT.
            // So we MUST COMMIT the credit first.

            await walletService.creditMasterWallet(
                userId,
                1750,
                'Migration Credit (Virtual Fund)',
                client
            );

            await client.query('COMMIT');
            client.release();

            // 3. Purchase Node (Starts its own transaction)
            const nodeResult = await nodeService.purchaseNode(userId, sponsorCode);

            res.json({
                success: true,
                userId,
                nodeId: nodeResult.nodeId,
                referralCode: nodeResult.referralCode,
                message: 'User Migrated & Node Activated Successfully'
            });

        } catch (error: any) {
            try { await client.query('ROLLBACK'); } catch (e) { }
            try { client.release(); } catch (e) { }
            console.error('[Migration Error]', error);
            res.status(500).json({ message: error.message });
        }
    }

    static async getUsers(req: Request, res: Response) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 50;
            const offset = (page - 1) * limit;

            const result = await adminService.getAllUsers(limit, offset);
            res.json(result);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    static async resetPassword(req: Request, res: Response) {
        try {
            const { userId, email, newPassword } = req.body;

            if (!newPassword || (!userId && !email)) {
                return res.status(400).json({ message: 'User ID/Email and New Password are required' });
            }

            const target = userId || email;
            const result = await adminService.resetUserPassword(target, newPassword);
            res.status(200).json(result);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    static async transferNode(req: Request, res: Response) {
        try {
            const { targetNodeId, newOwnerId, adminId } = req.body;
            console.log(`[AdminController] Transfer Request: Node ${targetNodeId} -> Owner ${newOwnerId} (Admin: ${adminId})`);
            const actingAdminId = adminId || 1;
            const result = await nodeService.transferNode(targetNodeId, newOwnerId, actingAdminId);
            res.json(result);
        } catch (error: any) {
            console.error('[AdminController] Transfer Failed:', error);
            res.status(400).json({ message: error.message });
        }
    }

    static async getUserNodes(req: Request, res: Response) {
        try {
            const userId = parseInt(req.params.id || '');
            if (isNaN(userId)) throw new Error('Invalid User ID');
            const nodes = await nodeService.getUserNodes(userId);
            res.json(nodes);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    static async getFastTrackClaims(req: Request, res: Response) {
        try {
            const { FastTrackService } = await import('../services/FastTrackService.js');
            const fastTrackService = new FastTrackService();
            const result = await fastTrackService.getEligibleList();
            res.json(result);
        } catch (error: any) {
            console.error('FastTrack List Error:', error);
            res.status(500).json({ message: error.message });
        }
    }

    static async settleFastTrackClaim(req: Request, res: Response) {
        try {
            const { claimId, productCodes, adminId } = req.body;
            if (!claimId || !productCodes) {
                return res.status(400).json({ message: 'Claim ID and Product Codes are required' });
            }
            const { FastTrackService } = await import('../services/FastTrackService.js');
            const fastTrackService = new FastTrackService();
            const result = await fastTrackService.settleClaim(claimId, productCodes);
            console.log(`[Admin] Claim ${claimId} settled by Admin ${adminId}`);
            res.json(result);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    static async impersonateUser(req: Request, res: Response) {
        try {
            const { userId } = req.body;
            if (!userId) {
                return res.status(400).json({ message: 'Target User ID is required' });
            }

            const { query } = await import('../config/db.js');
            const userRes = await query('SELECT * FROM Users WHERE id = $1', [userId]);

            if (userRes.rows.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }

            const user = userRes.rows[0];
            const jwt = (await import('jsonwebtoken')).default;
            const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_change_me';

            console.log(`[Admin] Impersonating User ${userId} (${user.full_name})`);

            const token = jwt.sign(
                { id: user.id, role: user.role },
                JWT_SECRET,
                { expiresIn: '1h' }
            );

            res.json({
                message: 'Impersonation successful',
                token,
                user: { id: user.id, mobile: user.mobile, role: user.role, name: user.full_name }
            });

        } catch (error: any) {
            console.error('Impersonation Error:', error);
            res.status(500).json({ message: error.message });
        }
    }
}
