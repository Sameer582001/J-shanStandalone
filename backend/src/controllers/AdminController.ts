import type { Request, Response } from 'express';
import { AdminService } from '../services/AdminService.js';

const adminService = new AdminService();

export class AdminController {

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
            // Expect targetUserId (or email) and newPassword in body
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
}
