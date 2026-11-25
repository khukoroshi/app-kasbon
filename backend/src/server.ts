import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './config/database.js';
import { pushSync, pullSync } from './controllers/syncController.js';
import { getDashboardSummary } from './controllers/customerController.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/', (_req, res) => {
  res.json({
    status: 'online',
    app: 'WarungKasbon Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Dashboard reporting endpoint
app.get('/api/v1/dashboard/summary', getDashboardSummary);

// Offline-First Sync Endpoints
app.post('/api/v1/sync/push', pushSync);
app.get('/api/v1/sync/pull', pullSync);

const startServer = async () => {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`🚀 WarungKasbon Backend Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
