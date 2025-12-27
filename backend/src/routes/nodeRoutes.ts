import { Router } from 'express';
import { NodeController } from '../controllers/NodeController.js';
import { authenticateJWT } from '../middleware/AuthMiddleware.js';

const router = Router();

router.post('/purchase', authenticateJWT, NodeController.purchaseNode);
router.get('/verify-sponsor/:code', authenticateJWT, NodeController.verifySponsor);
router.get('/my-nodes', authenticateJWT, NodeController.getUserNodes);
router.get('/:id/stats', authenticateJWT, NodeController.getNodeStats);
router.get('/:id/transactions', authenticateJWT, NodeController.getNodeTransactions);
router.get('/:id/direct-referrals', authenticateJWT, NodeController.getDirectReferrals);
router.get('/:id/genealogy', authenticateJWT, NodeController.getGenealogy);
router.get('/:id/fast-track', authenticateJWT, NodeController.getFastTrackStatus);
router.put('/:id/name', authenticateJWT, NodeController.updateNodeName);


export default router;
