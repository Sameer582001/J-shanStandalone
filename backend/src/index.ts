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

const app = express();

// Start Background Worker
initAutoPoolWorker();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/nodes', nodeRoutes);
app.use('/api/payout', payoutRoutes);
app.use('/api/admin', adminRoutes);

app.listen(3000, () => console.log('Backend running on 3000'));
