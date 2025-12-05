import { Router } from 'express';
import { WalletController } from '../controllers/WalletController.js';
import { authenticateJWT } from '../middleware/AuthMiddleware.js';

const router = Router();

router.get('/balance', authenticateJWT, WalletController.getBalance);
router.post('/add-funds', authenticateJWT, WalletController.addFunds);

export default router;
