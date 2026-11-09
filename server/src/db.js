import pg from 'pg';
import { config } from './config.js';

// Return DATE columns as plain "YYYY-MM-DD" strings instead of JS Date objects
// (which would shift by the server's time zone).
pg.types.setTypeParser(1082, (v) => v);

export const pool = new pg.Pool({ connectionString: config.databaseUrl });

export const query = (text, params) => pool.query(text, params);
