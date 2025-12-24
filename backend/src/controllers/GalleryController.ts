import type { Request, Response } from 'express';
import { query } from '../config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const GalleryController = {
    // Public: List all images
    getAllImages: async (req: Request, res: Response) => {
        try {
            const result = await query('SELECT * FROM Gallery ORDER BY created_at DESC');
            res.json(result.rows);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server Error' });
        }
    },

    // Admin: Upload Image
    uploadImage: async (req: Request, res: Response) => {
        try {
            if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

            const imageUrl = `/uploads/${req.file.filename}`;
            const caption = req.body.caption || '';

            const result = await query(
                'INSERT INTO Gallery (image_url, caption) VALUES ($1, $2) RETURNING *',
                [imageUrl, caption]
            );

            res.status(201).json(result.rows[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Upload Failed' });
        }
    },

    // Admin: Delete Image
    deleteImage: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            // Get file path first
            const check = await query('SELECT image_url FROM Gallery WHERE id = $1', [id]);
            if (check.rows.length === 0) return res.status(404).json({ message: 'Image not found' });

            const imageUrl = check.rows[0].image_url;
            const filePath = path.join(__dirname, '../../..', imageUrl); // Adjust path to root/uploads

            // Delete from DB
            await query('DELETE FROM Gallery WHERE id = $1', [id]);

            // Delete file
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            res.json({ message: 'Image deleted' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Delete Failed' });
        }
    }
};
