
import type { Request, Response } from 'express';
import { query } from '../config/db.js';

export class NewsController {

    // Create News (Admin)
    async createNews(req: Request, res: Response) {
        try {
            const { title, content } = req.body;
            if (!title || !content) {
                return res.status(400).json({ message: 'Title and content are required' });
            }

            await query(
                'INSERT INTO News (title, content, is_active) VALUES ($1, $2, TRUE)',
                [title, content]
            );

            res.status(201).json({ message: 'News created successfully' });
        } catch (error) {
            console.error('Create News Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    // Get Active News (Public/User)
    async getActiveNews(req: Request, res: Response) {
        try {
            const result = await query(
                'SELECT * FROM News WHERE is_active = TRUE ORDER BY created_at DESC'
            );
            res.json(result.rows);
        } catch (error) {
            console.error('Get Active News Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    // Get All News (Admin)
    async getAllNews(req: Request, res: Response) {
        try {
            const result = await query('SELECT * FROM News ORDER BY created_at DESC');
            res.json(result.rows);
        } catch (error) {
            console.error('Get All News Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    // Delete News (Admin)
    async deleteNews(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await query('DELETE FROM News WHERE id = $1', [id]);
            res.json({ message: 'News deleted successfully' });
        } catch (error) {
            console.error('Delete News Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
}
