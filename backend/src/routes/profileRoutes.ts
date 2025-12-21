
import { Router } from 'express';
import { ProfileController } from '../controllers/ProfileController.js';
import { authenticateJWT } from '../middleware/AuthMiddleware.js';

const router = Router();

router.use(authenticateJWT); // Protect all routes

router.get('/', ProfileController.getProfile);
router.put('/bank', ProfileController.updateBankDetails);

export default router;
