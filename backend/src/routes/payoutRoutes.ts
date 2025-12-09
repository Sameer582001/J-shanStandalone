import { Router } from 'express';
import { PayoutController } from '../controllers/PayoutController.js';
import { authenticateJWT, requireAdmin } from '../middleware/AuthMiddleware.js';

const router = Router();

// User Routes
router.post('/request', authenticateJWT, PayoutController.requestPayout);
router.get('/history', authenticateJWT, PayoutController.getMyPayouts);

// Admin Routes (Protected)
router.get('/admin/list', authenticateJWT, requireAdmin, PayoutController.getPendingPayouts);
router.post('/admin/process', authenticateJWT, requireAdmin, PayoutController.processPayout);

export default router;
