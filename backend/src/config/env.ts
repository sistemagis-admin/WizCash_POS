import dotenv from 'dotenv';
import path from 'path';

// Load .env file
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:4200',
  db: {
    url: process.env.DATABASE_URL || '',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'wizcash_user',
    password: process.env.DB_PASSWORD || 'wizcash_password',
    database: process.env.DB_NAME || 'wizcash_db',
    ssl: process.env.DB_SSL === 'true' || Boolean(process.env.DATABASE_URL),
  },
};
