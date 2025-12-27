import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { GalleryController } from '../controllers/GalleryController.js';
import { authenticateJWT, isAdmin } from '../middleware/AuthMiddleware.js';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

import fs from 'fs';

// Configure Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'gallery-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) return cb(null, true);
        cb(new Error('Only images allowed'));
    }
});

// Routes
router.get('/', GalleryController.getAllImages);
router.post('/upload', authenticateJWT, isAdmin, upload.single('image'), GalleryController.uploadImage);
router.delete('/:id', authenticateJWT, isAdmin, GalleryController.deleteImage);

export default router;
