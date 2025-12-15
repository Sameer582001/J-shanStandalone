import { Router } from 'express';
import { NodeController } from '../controllers/NodeController.js';
import { authenticateJWT } from '../middleware/AuthMiddleware.js';

const router = Router();

router.post('/purchase', authenticateJWT, NodeController.purchaseNode);
router.get('/my-nodes', authenticateJWT, NodeController.getUserNodes);
router.get('/:id/stats', authenticateJWT, NodeController.getNodeStats);
router.get('/:id/transactions', authenticateJWT, NodeController.getNodeTransactions);
router.get('/:id/genealogy', authenticateJWT, NodeController.getGenealogy);

export default router;
