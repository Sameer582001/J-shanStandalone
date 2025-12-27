import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { DocumentController } from '../controllers/DocumentController.js';
import { authenticateJWT, requireAdmin } from '../middleware/AuthMiddleware.js';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

import fs from 'fs';

// Configure Multer for PDF
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
        cb(null, 'doc-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') return cb(null, true);
        cb(new Error('Only PDF files are allowed'));
    }
});

// Routes
router.get('/', DocumentController.getAllDocuments);
router.post('/upload', authenticateJWT, requireAdmin, upload.single('file'), DocumentController.uploadDocument);
router.delete('/:id', authenticateJWT, requireAdmin, DocumentController.deleteDocument);

export default router;
