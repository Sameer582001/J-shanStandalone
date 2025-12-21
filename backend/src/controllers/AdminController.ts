import type { Request, Response } from 'express';
import { AdminService } from '../services/AdminService.js';
import { NodeService } from '../services/NodeService.js';

const adminService = new AdminService();
const nodeService = new NodeService();

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

    static async transferNode(req: Request, res: Response) {
        try {
            const { targetNodeId, newOwnerId, adminId } = req.body;
            console.log(`[AdminController] Transfer Request: Node ${targetNodeId} -> Owner ${newOwnerId} (Admin: ${adminId})`);

            // Admin ID is required for audit logs (ideally from auth token, but taking from body for now as per minimal setup)
            // Assuming simplified auth where "1" is admin for now or passed from frontend context
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
            // Lazy load service to avoid circular deps if any, or just new instance
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

            // Log admin action if needed
            console.log(`[Admin] Claim ${claimId} settled by Admin ${adminId}`);

            res.json(result);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }
}
