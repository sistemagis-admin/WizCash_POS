import { Request, Response } from 'express';
import { pool } from '../config/db.js';
import { config } from '../config/env.js';

export const getHealth = async (req: Request, res: Response) => {
  const startDb = Date.now();
  let dbStatus = 'disconnected';
  let dbLatency = 0;
  let dbDetails: any = null;

  try {
    const dbRes = await pool.query('SELECT NOW() as now, version() as version');
    dbLatency = Date.now() - startDb;
    dbStatus = 'connected';
    dbDetails = {
      serverTime: dbRes.rows[0].now,
      version: dbRes.rows[0].version.split(' ')[0] + ' ' + dbRes.rows[0].version.split(' ')[1],
      latencyMs: dbLatency,
    };
  } catch (error: any) {
    dbStatus = 'error';
    dbDetails = { error: error.message };
  }

  const isHealthy = dbStatus === 'connected';

  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    status: isHealthy ? 'OK' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: config.nodeEnv,
    services: {
      api: {
        status: 'up',
        port: config.port,
      },
      database: {
        type: 'PostgreSQL',
        status: dbStatus,
        ...dbDetails,
      },
    },
  });
};
