import express from 'express';
import { AdminService } from '../services/AdminService.js';
import { AdminController } from '../controllers/AdminController.js';
import { query } from '../config/db.js';

const router = express.Router();
const adminService = new AdminService();

// Setup / Initialization Routes
import { SetupController } from '../controllers/SetupController.js';

router.post('/seed-root', SetupController.initialize);
router.get('/system-status', SetupController.getStatus);

// Get All Users
router.get('/users', AdminController.getUsers);

// Reset User Password
router.post('/reset-password', AdminController.resetPassword);

export default router;
