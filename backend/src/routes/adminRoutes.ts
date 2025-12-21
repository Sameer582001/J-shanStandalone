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

// Get User Nodes
router.get('/users/:id/nodes', AdminController.getUserNodes);

// Reset User Password
// Reset User Password
router.post('/reset-password', AdminController.resetPassword);

// Transfer Node Ownership
router.post('/transfer-node', AdminController.transferNode);

// Fast Track Bonus
router.get('/fast-track/eligible', AdminController.getFastTrackClaims);
router.post('/fast-track/settle', AdminController.settleFastTrackClaim);

export default router;
