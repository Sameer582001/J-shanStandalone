import type { Request, Response } from 'express';
import { query } from '../config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const DocumentController = {
    getAllDocuments: async (req: Request, res: Response) => {
        try {
            const result = await query('SELECT * FROM Documents ORDER BY created_at DESC');
            res.json(result.rows);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server Error' });
        }
    },

    uploadDocument: async (req: Request, res: Response) => {
        try {
            if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

            const fileUrl = `/uploads/${req.file.filename}`;
            const title = req.body.title || req.file.originalname;

            const result = await query(
                'INSERT INTO Documents (title, file_url) VALUES ($1, $2) RETURNING *',
                [title, fileUrl]
            );

            res.status(201).json(result.rows[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Upload Failed' });
        }
    },

    deleteDocument: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            const check = await query('SELECT file_url FROM Documents WHERE id = $1', [id]);
            if (check.rows.length === 0) return res.status(404).json({ message: 'Document not found' });

            const fileUrl = check.rows[0].file_url;
            const filePath = path.join(__dirname, '../../..', fileUrl);

            await query('DELETE FROM Documents WHERE id = $1', [id]);

            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            res.json({ message: 'Document deleted' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Delete Failed' });
        }
    }
};
