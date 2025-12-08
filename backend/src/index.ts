import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import walletRoutes from './routes/walletRoutes.js';
import nodeRoutes from './routes/nodeRoutes.js';
import { initAutoPoolWorker } from './workers/AutoPoolWorker.js';

const app = express();

// Start Background Worker
initAutoPoolWorker();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/nodes', nodeRoutes);

app.listen(3000, () => console.log('Backend running on 3000'));
