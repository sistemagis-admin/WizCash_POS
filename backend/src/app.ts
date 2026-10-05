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

// Root route: API Landing & Documentation Dashboard
app.get('/', (req, res) => {
  if (req.headers.accept && req.headers.accept.includes('text/html')) {
    res.setHeader('Content-Type', 'text/html');
    return res.send(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WizCash POS API - Live Dashboard</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090d16;
      --card-bg: rgba(22, 28, 45, 0.7);
      --card-border: rgba(255, 255, 255, 0.08);
      --primary: #6366f1;
      --primary-glow: rgba(99, 102, 241, 0.35);
      --accent: #10b981;
      --accent-glow: rgba(16, 185, 129, 0.3);
      --text: #f8fafc;
      --text-muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 20px;
      position: relative;
      overflow-x: hidden;
    }
    body::before {
      content: '';
      position: absolute;
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, var(--primary-glow) 0%, transparent 70%);
      top: -100px;
      left: 50%;
      transform: translateX(-50%);
      pointer-events: none;
      z-index: 0;
    }
    .container {
      width: 100%;
      max-width: 860px;
      z-index: 1;
    }
    .header {
      text-align: center;
      margin-bottom: 36px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.35);
      color: #34d399;
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 0.85rem;
      font-weight: 600;
      margin-bottom: 16px;
    }
    .badge-dot {
      width: 8px;
      height: 8px;
      background: #34d399;
      border-radius: 50%;
      box-shadow: 0 0 10px #34d399;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.85); }
    }
    h1 {
      font-size: 2.5rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      background: linear-gradient(135deg, #ffffff 40%, #a5b4fc 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 8px;
    }
    p.subtitle {
      color: var(--text-muted);
      font-size: 1.05rem;
    }
    .status-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      backdrop-filter: blur(12px);
      border-radius: 16px;
      padding: 20px 24px;
      margin-bottom: 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }
    .status-info {
      display: flex;
      gap: 24px;
      flex-wrap: wrap;
    }
    .info-item {
      display: flex;
      flex-direction: column;
    }
    .info-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
    }
    .info-value {
      font-weight: 600;
      font-size: 0.95rem;
      color: #e2e8f0;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
      margin-bottom: 32px;
    }
    @media (min-width: 640px) {
      .grid { grid-template-columns: 1fr 1fr; }
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 14px;
      padding: 20px;
      transition: all 0.25s ease;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      backdrop-filter: blur(8px);
    }
    .card:hover {
      border-color: rgba(99, 102, 241, 0.4);
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgba(99, 102, 241, 0.15);
    }
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    .method-tag {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 4px 8px;
      border-radius: 6px;
      background: rgba(99, 102, 241, 0.2);
      color: #818cf8;
      border: 1px solid rgba(99, 102, 241, 0.3);
    }
    .endpoint-path {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.95rem;
      color: #f1f5f9;
      font-weight: 600;
      margin-bottom: 6px;
    }
    .endpoint-desc {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-bottom: 16px;
      line-height: 1.4;
    }
    .btn-test {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: rgba(255, 255, 255, 0.06);
      color: #e2e8f0;
      text-decoration: none;
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      transition: all 0.2s;
      border: 1px solid var(--card-border);
    }
    .btn-test:hover {
      background: var(--primary);
      color: #ffffff;
      border-color: var(--primary);
    }
    footer {
      text-align: center;
      color: #64748b;
      font-size: 0.85rem;
      margin-top: auto;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">
        <span class="badge-dot"></span>
        API Online & Ready
      </div>
      <h1>WizCash POS Backend</h1>
      <p class="subtitle">High Performance Express.js API with PostgreSQL Cloud</p>
    </div>

    <div class="status-card">
      <div class="status-info">
        <div class="info-item">
          <span class="info-label">Database</span>
          <span class="info-value">PostgreSQL (Neon Cloud)</span>
        </div>
        <div class="info-item">
          <span class="info-label">Runtime</span>
          <span class="info-value">Node.js Serverless (Vercel)</span>
        </div>
        <div class="info-item">
          <span class="info-label">Environment</span>
          <span class="info-value">Production</span>
        </div>
      </div>
      <a href="/api/health" class="btn-test" target="_blank">🩺 Test Health API</a>
    </div>

    <div class="grid">
      <div class="card">
        <div>
          <div class="card-header">
            <span class="method-tag">GET</span>
          </div>
          <div class="endpoint-path">/api/health</div>
          <p class="endpoint-desc">Cek status server dan koneksi database PostgreSQL secara realtime.</p>
        </div>
        <a href="/api/health" target="_blank" class="btn-test">Buka Endpoint &rarr;</a>
      </div>

      <div class="card">
        <div>
          <div class="card-header">
            <span class="method-tag">GET</span>
          </div>
          <div class="endpoint-path">/api/wallets</div>
          <p class="endpoint-desc">Mengambil daftar akun dompet (Kas Toko, Bank BCA, dll) beserta saldo terkini.</p>
        </div>
        <a href="/api/wallets" target="_blank" class="btn-test">Buka Endpoint &rarr;</a>
      </div>

      <div class="card">
        <div>
          <div class="card-header">
            <span class="method-tag">GET</span>
          </div>
          <div class="endpoint-path">/api/transactions</div>
          <p class="endpoint-desc">Mengambil riwayat transaksi pemasukan, pengeluaran, dan transfer kasir.</p>
        </div>
        <a href="/api/transactions" target="_blank" class="btn-test">Buka Endpoint &rarr;</a>
      </div>

      <div class="card">
        <div>
          <div class="card-header">
            <span class="method-tag">GET</span>
          </div>
          <div class="endpoint-path">/api/transactions/summary</div>
          <p class="endpoint-desc">Ringkasan total pemasukan, total pengeluaran, dan net cashflow.</p>
        </div>
        <a href="/api/transactions/summary" target="_blank" class="btn-test">Buka Endpoint &rarr;</a>
      </div>
    </div>

    <footer>
      WizCash POS &copy; 2026 &bull; Powered by Express.js, TypeScript & Neon PostgreSQL
    </footer>
  </div>
</body>
</html>`);
  }

  // Default JSON response for API clients / tools
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
