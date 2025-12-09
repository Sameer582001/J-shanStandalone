import express from 'express';
import { AdminService } from '../services/AdminService.js';
import { AdminController } from '../controllers/AdminController.js';
import { query } from '../config/db.js';

const router = express.Router();
const adminService = new AdminService();

// Middleware to check for basic secret or similar if needed, 
// but for now relying on the fact that it's only accessible if JSE-ROOT doesn't exist,
// OR we should perhaps protect this? 
// The user asked for it in the "Admin Panel", implying they are ALREADY logged in as Admin?
// BUT wait, if the system is NOT initialized, there IS NO ADMIN.
// So this route must be public OR protected by a static secret key.
// Given constraints, I will make it public but it fails if JSE-ROOT exists.
// Code review note: In a real app, this should be protected by a setup token. 
// For this standalone/demo, the "Exists" check is the primary guard.

router.post('/seed-root', async (req, res) => {
    try {
        const result = await adminService.seedRootUser(req.body);
        res.status(201).json(result);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
});

// Check System Status
router.get('/system-status', async (req, res) => {
    try {
        // Quick check if JSE-ROOT exists
        const rootExists = await query("SELECT id FROM Nodes WHERE referral_code = 'JSE-ROOT'");
        res.json({ initialized: rootExists.rows.length > 0 });
    } catch (error) {
        res.status(500).json({ initialized: false, error: 'Database error' });
    }
});

// Get All Users
router.get('/users', AdminController.getUsers);

export default router;
