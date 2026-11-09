import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { pool } from '../db.js';

const here = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(join(here, '..', 'schema.sql'), 'utf8');

try {
  await pool.query(sql);
  console.log('Database tables are ready.');
} finally {
  await pool.end();
}
