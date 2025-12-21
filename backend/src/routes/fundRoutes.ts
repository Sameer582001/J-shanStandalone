import express from 'express';
import type { Request, Response } from 'express';
import { authenticateJWT, requireAdmin } from '../middleware/AuthMiddleware.js';
import type { AuthRequest } from '../middleware/AuthMiddleware.js';
import { FundService } from '../services/FundService.js';

const router = express.Router();
const fundService = new FundService();

// User: Get QR Code and UPI ID (Public/Protected)
router.get('/qr', authenticateJWT, async (req: Request, res: Response) => {
    try {
        const data = await fundService.getQrCodeAndUpi();
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// User: Create Fund Request
router.post('/request', authenticateJWT, async (req: AuthRequest, res: Response) => {
    try {
        const { amount, utrNumber } = req.body;
        const request = await fundService.createRequest(req.user.id, amount, utrNumber);
        res.status(201).json(request);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// User: Get My Requests
router.get('/my-requests', authenticateJWT, async (req: AuthRequest, res: Response) => {
    try {
        const requests = await fundService.getUserRequests(req.user.id);
        res.json(requests);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Admin: Get All Requests
router.get('/admin/requests', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
    try {
        const { status } = req.query;
        const requests = await fundService.getAllRequests(status as string);
        res.json(requests);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Admin: Verify Request
router.post('/admin/verify', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
    try {
        const { requestId, adminUtr, adminAmount } = req.body;
        const result = await fundService.verifyRequest(requestId, adminUtr, adminAmount);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Admin: Reject Request
router.post('/admin/reject', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
    try {
        const { requestId, remarks } = req.body;
        const result = await fundService.rejectRequest(requestId, remarks);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Admin: Update QR Code (Now updates Payee Name & UPI ID)
router.post('/admin/qr', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
    try {
        const { payeeName, upiId } = req.body;
        await fundService.updateQrCode(payeeName, upiId);
        res.json({ message: 'Payment Settings updated successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
