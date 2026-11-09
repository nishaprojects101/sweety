import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { pad, daysInMonth, todayString } from '../lib/dates.js';
import { SLOT_KEYS } from '../lib/slots.js';

const DEMO = { name: 'Demo Patient', email: 'demo@sweety.test', password: 'demo1234' };

// Deterministic pseudo-random so the seed gives the same data every run.
function makeRng(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/** Dates (YYYY-MM-DD) from the 1st of last month through today. */
function seedDates() {
  const today = todayString();
  let y = Number(today.slice(0, 4));
  let m = Number(today.slice(5, 7)) - 1;
  if (m === 0) {
    m = 12;
    y -= 1;
  }
  const dates = [];
  const lastMonthDays = daysInMonth(y, m);
  for (let d = 1; d <= lastMonthDays; d++) dates.push(`${y}-${pad(m)}-${pad(d)}`);
  const thisMonth = today.slice(0, 7);
  const todayDay = Number(today.slice(8, 10));
  for (let d = 1; d <= todayDay; d++) dates.push(`${thisMonth}-${pad(d)}`);
  return dates;
}

try {
  await pool.query('DELETE FROM users WHERE lower(email) = $1', [DEMO.email]); // cascades to readings
  const hash = await bcrypt.hash(DEMO.password, 10);
  const { rows } = await pool.query(
    'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
    [DEMO.name, DEMO.email, hash]
  );
  const userId = rows[0].id;

  const rng = makeRng(42);
  // Typical ranges per slot: fasting is lower, post-meal is higher.
  const base = { morning: 105, after_breakfast: 150, after_lunch: 145, after_dinner: 140 };
  let count = 0;
  for (const date of seedDates()) {
    for (const slot of SLOT_KEYS) {
      if (rng() < 0.2) continue; // leave some gaps, like real life
      const value = Math.round(base[slot] + (rng() - 0.5) * 60);
      await pool.query(
        'INSERT INTO readings (user_id, reading_date, slot, value) VALUES ($1, $2, $3, $4)',
        [userId, date, slot, value]
      );
      count++;
    }
  }
  console.log(`Seeded ${count} readings.`);
  console.log(`Log in with  ${DEMO.email}  /  ${DEMO.password}`);
} finally {
  await pool.end();
}
