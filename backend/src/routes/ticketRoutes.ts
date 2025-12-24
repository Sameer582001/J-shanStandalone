
import { Router } from 'express';
import { TicketController } from '../controllers/TicketController.js';
import { authenticateJWT, authorizeRole } from '../middleware/AuthMiddleware.js';

const router = Router();
const ticketController = new TicketController();

// User Routes
router.post('/', authenticateJWT, ticketController.createTicket);
router.get('/my', authenticateJWT, ticketController.getUserTickets);

// Admin Routes
router.get('/admin', authenticateJWT, authorizeRole('ADMIN'), ticketController.getAllTickets);
router.put('/admin/:id/close', authenticateJWT, authorizeRole('ADMIN'), ticketController.closeTicket);

export default router;
