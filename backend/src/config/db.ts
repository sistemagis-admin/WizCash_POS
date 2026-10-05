import { Pool, QueryResult, QueryResultRow } from 'pg';
import { config } from './env.js';

const poolConfig = config.db.url
  ? {
      connectionString: config.db.url,
      ssl: { rejectUnauthorized: false },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    }
  : {
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      ssl: config.db.ssl ? { rejectUnauthorized: false } : undefined,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    };

export const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('[DB Error] Unexpected error on idle client:', err.message);
});

export const query = async <T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> => {
  const start = Date.now();
  const res = await pool.query<T>(text, params);
  const duration = Date.now() - start;
  if (config.nodeEnv === 'development') {
    console.log('[DB Query]', { text: text.trim().replace(/\s+/g, ' '), duration: `${duration}ms`, rows: res.rowCount });
  }
  return res;
};

export const testDbConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    client.release();
    console.log('PostgreSQL Connected successfully!');
    console.log(`Server Time: ${result.rows[0].current_time}`);
    return true;
  } catch (error: any) {
    console.error('PostgreSQL Connection failed:', error?.message || error);
    return false;
  }
};
