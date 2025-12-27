import { Router } from 'express';
import { AuthController } from '../controllers/AuthController.js';

const router = Router();

router.post('/send-otp', AuthController.sendOtp);
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/forgot-password', AuthController.sendPasswordResetOtp);
router.post('/reset-password', AuthController.resetPassword);

export default router;
