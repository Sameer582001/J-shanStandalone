
import { Router } from 'express';
import { NewsController } from '../controllers/NewsController.js';
import { authenticateJWT, requireAdmin } from '../middleware/AuthMiddleware.js';

const router = Router();
const newsController = new NewsController();

// Public / User Routes
router.get('/active', authenticateJWT, newsController.getActiveNews);

// Admin Routes
router.post('/', authenticateJWT, requireAdmin, newsController.createNews); // Create
router.get('/', authenticateJWT, requireAdmin, newsController.getAllNews); // List All
router.delete('/:id', authenticateJWT, requireAdmin, newsController.deleteNews); // Delete

export default router;
