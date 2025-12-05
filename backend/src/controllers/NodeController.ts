import type { Request, Response } from 'express';
import { NodeService } from '../services/NodeService.js';

const nodeService = new NodeService();

export class NodeController {
    static async purchaseNode(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const { sponsorCode } = req.body;

            if (!sponsorCode) {
                return res.status(400).json({ message: 'Sponsor Code is required' });
            }

            const result = await nodeService.purchaseNode(userId, sponsorCode);
            res.status(201).json(result);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }
}
