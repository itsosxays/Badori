import express from 'express';
import cors from 'cors';
import { getDb } from './db/database';
import authRoutes from './routes/auth';
import accountRoutes from './routes/accounts';
import transactionRoutes from './routes/transactions';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Initialize DB on startup
getDb();

app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', app: 'Badori Bank', version: '1.0.0', countries: ['Rwanda', 'Djibouti'] });
});

app.listen(PORT, () => {
  console.log(`Badori Bank API running on http://localhost:${PORT}`);
});
