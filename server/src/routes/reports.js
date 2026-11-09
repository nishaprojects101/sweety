import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { isValidDateString, isFuture, todayString } from '../lib/dates.js';
import { computeStats, reportRange, REPORT_TYPES } from '../lib/reports.js';
import { SLOTS } from '../lib/slots.js';

const router = Router();
router.use(requireAuth);

// GET /reports/:type?date=YYYY-MM-DD   (type: daily | month-to-date | monthly)
router.get('/:type', async (req, res, next) => {
  try {
    const { type } = req.params;
    if (!REPORT_TYPES.includes(type)) {
      return res.status(404).json({ error: 'Unknown report type.' });
    }

    const date = req.query.date || todayString();
    if (!isValidDateString(date)) {
      return res.status(400).json({ error: 'Please enter a valid date.' });
    }
    if (isFuture(date)) {
      return res.status(400).json({ error: 'Date cannot be in the future.' });
    }

    const range = reportRange(type, date);
    const { rows } = await query(
      `SELECT id, reading_date AS date, slot, value FROM readings
       WHERE user_id = $1 AND reading_date BETWEEN $2 AND $3
       ORDER BY reading_date, array_position(
         ARRAY['morning','after_breakfast','after_lunch','after_dinner'], slot)`,
      [req.userId, range.from, range.to]
    );

    const body = { type, date, from: range.from, to: range.to, ...computeStats(rows) };
    if (type === 'daily') {
      body.readings = rows.map((r) => ({ ...r, slotLabel: SLOTS[r.slot] }));
    }
    res.json(body);
  } catch (err) {
    next(err);
  }
});

export default router;
