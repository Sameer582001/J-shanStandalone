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
}
