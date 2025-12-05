import { Router } from 'express';
import { NodeController } from '../controllers/NodeController.js';
import { authenticateJWT } from '../middleware/AuthMiddleware.js';

const router = Router();

router.post('/purchase', authenticateJWT, NodeController.purchaseNode);

export default router;
