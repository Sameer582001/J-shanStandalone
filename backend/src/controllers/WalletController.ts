import type { Request, Response } from 'express';
import { WalletService } from '../services/WalletService.js';

const walletService = new WalletService();

export class WalletController {
    static async getBalance(req: Request, res: Response) {
        try {
            // Assuming req.user is populated by AuthMiddleware
            const userId = (req as any).user.id;
            const balance = await walletService.getBalance(userId);
            res.status(200).json({ balance });
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    static async addFunds(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const { amount } = req.body;
            const result = await walletService.addFunds(userId, parseFloat(amount));
            res.status(200).json(result);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }
}
