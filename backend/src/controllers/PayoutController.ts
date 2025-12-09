import type { Request, Response } from 'express';
import { WalletService } from '../services/WalletService.js';

const walletService = new WalletService();

export class PayoutController {

    // User: Request Payout
    static async requestPayout(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const { amount } = req.body;
            if (!amount) throw new Error('Amount is required');

            const result = await walletService.requestPayout(userId, parseFloat(amount));
            res.status(201).json(result);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    // User: Get History
    static async getMyPayouts(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const payouts = await walletService.getPayouts(userId);
            res.json(payouts);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    // Admin: Get Pending
    static async getPendingPayouts(req: Request, res: Response) {
        try {
            const status = (req.query.status as string) || 'PENDING';
            const payouts = await walletService.getAllPayouts(status);
            res.json(payouts);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    // Admin: Process
    static async processPayout(req: Request, res: Response) {
        try {
            const { payoutId, status, note } = req.body;
            if (!payoutId || !status) throw new Error('Payout ID and Status required');
            if (!['PAID', 'REJECTED'].includes(status)) throw new Error('Invalid Status');

            const result = await walletService.processPayout(payoutId, status, note);
            res.json(result);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }
}
