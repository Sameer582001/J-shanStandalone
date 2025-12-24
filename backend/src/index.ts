import 'dotenv/config';
import './scripts/ensure_admin_user.js'; // Ensure Admin Exists
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import walletRoutes from './routes/walletRoutes.js';
import payoutRoutes from './routes/payoutRoutes.js';
import nodeRoutes from './routes/nodeRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { initAutoPoolWorker } from './workers/AutoPoolWorker.js';
import { CronService } from './services/CronService.js';

const app = express();

// Start Background Worker
initAutoPoolWorker();
const cronService = new CronService();
// cronService.start(); // Disabled (Synchronous Logic Implemented)

app.use(cors());
app.use(express.json());
// Serve static uploads
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Serve from project specific path if needed, or relative to src/..
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

import profileRoutes from './routes/profileRoutes.js';

app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/nodes', nodeRoutes);
app.use('/api/payout', payoutRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);
import fundRoutes from './routes/fundRoutes.js';
app.use('/api/funds', fundRoutes);
import newsRoutes from './routes/newsRoutes.js';
app.use('/api/news', newsRoutes);
import ticketRoutes from './routes/ticketRoutes.js';
app.use('/api/tickets', ticketRoutes);
import galleryRoutes from './routes/galleryRoutes.js';
app.use('/api/gallery', galleryRoutes);
import documentRoutes from './routes/documentRoutes.js';
app.use('/api/documents', documentRoutes);

app.listen(3000, () => console.log('Backend running on 3000'));
