import type { Request, Response } from 'express';
import { NodeService } from '../services/NodeService.js';

import { WalletService } from '../services/WalletService.js';

const nodeService = new NodeService();
const walletService = new WalletService();

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

    static async getUserNodes(req: any, res: any) {
        try {
            const userId = req.user.id;
            console.log(`[MyNodes] Fetching nodes for User ID: ${userId}`);
            const nodes = await nodeService.getUserNodes(userId);
            console.log(`[MyNodes] Found ${nodes.length} nodes.`);
            res.json(nodes);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    static async getNodeStats(req: any, res: any) {
        try {
            const nodeId = parseInt(req.params.id);
            const stats = await nodeService.getNodeStats(nodeId);
            res.json(stats);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    static async getNodeTransactions(req: any, res: any) {
        try {
            const nodeId = parseInt(req.params.id);
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
            const page = req.query.page ? parseInt(req.query.page as string) : 1;
            const offset = (page - 1) * limit;

            const transactions = await walletService.getNodeTransactions(nodeId, limit, offset);
            res.json(transactions);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }
    static async getGenealogy(req: any, res: any) {
        try {
            const nodeId = parseInt(req.params.id);
            const type = (req.query.type as 'SELF' | 'AUTO') || 'SELF';
            const isGlobal = req.query.global === 'true';
            const tree = await nodeService.getGenealogy(nodeId, type, isGlobal);
            res.json(tree);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }
}
