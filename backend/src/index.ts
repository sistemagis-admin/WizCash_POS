import app from './app.js';
import { config } from './config/env.js';
import { testDbConnection, pool } from './config/db.js';

const startServer = async () => {
  console.log('🚀 Starting WizCash Backend Server...');

  // Test Database Connection
  const isDbConnected = await testDbConnection();
  if (!isDbConnected) {
    console.warn('⚠️ Warning: Database connection failed. Make sure Docker PostgreSQL container is running!');
    console.warn('👉 Run `npm run docker:up` or `docker compose up -d` in backend folder.');
  }

  // Start Express Server
  const server = app.listen(config.port, () => {
    console.log(`\n==============================================`);
    console.log(`✨ Server running in ${config.nodeEnv.toUpperCase()} mode`);
    console.log(`📡 URL: http://localhost:${config.port}`);
    console.log(`🩺 Health Check: http://localhost:${config.port}/api/health`);
    console.log(`==============================================\n`);
  });

  // Graceful Shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n[${signal}] Shutting down gracefully...`);
    server.close(async () => {
      console.log('🛑 HTTP server closed.');
      await pool.end();
      console.log('🛑 Database connection pool closed.');
      process.exit(0);
    });

    // Force close after 10s
    setTimeout(() => {
      console.error('⚠️ Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

startServer();
