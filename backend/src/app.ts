import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { requestLogger } from './middlewares/logger.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFoundHandler } from './middlewares/notFound.js';
import apiRouter from './routes/index.js';

const app = express();

// Middlewares
app.use(
  cors({
    origin: config.corsOrigin === '*' ? '*' : config.corsOrigin.split(','),
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'WizCash Backend API',
    version: '1.0.0',
    status: 'online',
    endpoints: {
      health: '/api/health',
      wallets: '/api/wallets',
      transactions: '/api/transactions',
      summary: '/api/transactions/summary',
    },
  });
});

// Main API Routes
app.use('/api', apiRouter);

// 404 & Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
