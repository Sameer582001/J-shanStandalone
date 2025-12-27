
import type { Request, Response } from 'express';
import { ProfileService } from '../services/ProfileService.js';

const profileService = new ProfileService();

export class ProfileController {

    static async getProfile(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const profile = await profileService.getProfile(userId);
            res.json(profile);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    static async updateBankDetails(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const { account_holder_name, account_number, ifsc_code, bank_name } = req.body;

            if (!account_holder_name || !account_number || !ifsc_code || !bank_name) {
                return res.status(400).json({ message: 'All bank fields are required' });
            }

            const result = await profileService.updateBankDetails(userId, {
                account_holder_name,
                account_number,
                ifsc_code,
                bank_name
            });
            res.json(result);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }
    static async updateAddress(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const { address, city, state, zip } = req.body;

            if (!address || !city || !state || !zip) {
                return res.status(400).json({ message: 'All address fields are required' });
            }

            const result = await profileService.updateAddress(userId, {
                address,
                city,
                state,
                zip
            });
            res.json(result);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }
}
