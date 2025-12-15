
import type { Request, Response } from 'express';
import { SetupService } from '../services/SetupService.js';

const setupService = new SetupService();

export class SetupController {

    static async getStatus(req: Request, res: Response) {
        try {
            const status = await setupService.getSystemStatus();
            res.json(status);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    static async initialize(req: Request, res: Response) {
        try {
            const result = await setupService.initializeSystem(req.body);
            res.status(201).json(result);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }
}
