import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runInit() {
  console.log('🔄 Initializing database schema and seed data...');
  try {
    const sqlPath = path.join(__dirname, 'init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await pool.query(sql);
    console.log('✅ Database initialized successfully!');
    await pool.end();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Database initialization failed:', error?.message || error);
    await pool.end().catch(() => {});
    process.exit(1);
  }
}

runInit();
