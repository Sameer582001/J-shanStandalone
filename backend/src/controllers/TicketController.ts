
import type { Request, Response } from 'express';
import { query } from '../config/db.js';

interface Ticket {
    id: number;
    user_id: number;
    subject: string;
    description: string;
    status: 'OPEN' | 'CLOSED';
    admin_response?: string;
    created_at: Date;
    closed_at?: Date;
}

export class TicketController {
    // User: Create a new ticket
    async createTicket(req: Request, res: Response) {
        const { subject, description } = req.body;
        const userId = (req as any).user.id;

        if (!subject || !description) {
            return res.status(400).json({ message: 'Subject and description are required' });
        }

        try {
            const result = await query(
                'INSERT INTO Tickets (user_id, subject, description) VALUES ($1, $2, $3) RETURNING *',
                [userId, subject, description]
            );
            res.status(201).json(result.rows[0]);
        } catch (error) {
            console.error('Create Ticket Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    // User: Get own tickets
    async getUserTickets(req: Request, res: Response) {
        const userId = (req as any).user.id;

        try {
            const result = await query(
                'SELECT * FROM Tickets WHERE user_id = $1 ORDER BY created_at DESC',
                [userId]
            );
            res.json(result.rows);
        } catch (error) {
            console.error('Get User Tickets Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    // Admin: Get all tickets
    async getAllTickets(req: Request, res: Response) {
        try {
            // Optional filter by status query param ?status=OPEN
            const { status } = req.query;
            let queryText = 'SELECT t.*, u.full_name as user_name FROM Tickets t JOIN Users u ON t.user_id = u.id';
            const params: any[] = [];

            if (status) {
                queryText += ' WHERE t.status = $1';
                params.push(status);
            }

            queryText += ' ORDER BY t.created_at DESC';

            const result = await query(queryText, params);
            res.json(result.rows);
        } catch (error) {
            console.error('Get All Tickets Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    // Admin: Close ticket with response
    async closeTicket(req: Request, res: Response) {
        const { id } = req.params;
        const { response } = req.body;

        if (!response) {
            return res.status(400).json({ message: 'Response is required to close a ticket' });
        }

        try {
            const result = await query(
                `UPDATE Tickets 
                 SET status = 'CLOSED', admin_response = $1, closed_at = CURRENT_TIMESTAMP 
                 WHERE id = $2 RETURNING *`,
                [response, id]
            );

            if (result.rowCount === 0) {
                return res.status(404).json({ message: 'Ticket not found' });
            }

            res.json(result.rows[0]);
        } catch (error) {
            console.error('Close Ticket Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
}
