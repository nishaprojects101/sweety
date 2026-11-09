import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { validateReadingInput, checkDayRules } from '../lib/validation.js';
import { isValidDateString } from '../lib/dates.js';
import { SLOTS } from '../lib/slots.js';

const router = Router();
router.use(requireAuth);

const COLUMNS = 'id, reading_date AS date, slot, value';
const withLabel = (r) => ({ ...r, slotLabel: SLOTS[r.slot] });

const fail = (res, status, errors) => res.status(status).json({ error: errors[0].message, errors });

/** Readings the user already has on a date, optionally ignoring one (when editing). */
async function readingsOnDate(userId, date, ignoreId = null) {
  const { rows } = await query(
    'SELECT id, slot FROM readings WHERE user_id = $1 AND reading_date = $2 AND id <> $3',
    [userId, date, ignoreId ?? -1]
  );
  return rows;
}

// GET /readings?date=YYYY-MM-DD&from=...&to=...&page=1&limit=20
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const { date, from, to } = req.query;

    for (const d of [date, from, to]) {
      if (d !== undefined && !isValidDateString(d)) {
        return fail(res, 400, [{ field: 'date', message: 'Please enter a valid date.' }]);
      }
    }

    const where = ['user_id = $1'];
    const params = [req.userId];
    if (date) {
      params.push(date);
      where.push(`reading_date = $${params.length}`);
    }
    if (from) {
      params.push(from);
      where.push(`reading_date >= $${params.length}`);
    }
    if (to) {
      params.push(to);
      where.push(`reading_date <= $${params.length}`);
    }
    const whereSql = where.join(' AND ');

    const total = await query(`SELECT count(*)::int AS n FROM readings WHERE ${whereSql}`, params);
    const { rows } = await query(
      `SELECT ${COLUMNS} FROM readings WHERE ${whereSql}
       ORDER BY reading_date DESC, array_position(
         ARRAY['morning','after_breakfast','after_lunch','after_dinner'], slot)
       LIMIT ${limit} OFFSET ${(page - 1) * limit}`,
      params
    );

    res.json({
      readings: rows.map(withLabel),
      page,
      limit,
      total: total.rows[0].n,
      totalPages: Math.max(1, Math.ceil(total.rows[0].n / limit)),
    });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { errors, clean } = validateReadingInput(req.body);
    if (errors.length) return fail(res, 400, errors);

    const existing = await readingsOnDate(req.userId, clean.date);
    const dayError = checkDayRules({ slot: clean.slot, existing, isNew: true });
    if (dayError) return fail(res, 409, [dayError]);

    const { rows } = await query(
      `INSERT INTO readings (user_id, reading_date, slot, value)
       VALUES ($1, $2, $3, $4) RETURNING ${COLUMNS}`,
      [req.userId, clean.date, clean.slot, clean.value]
    );
    res.status(201).json({ reading: withLabel(rows[0]) });
  } catch (err) {
    // Two requests racing past the check: the DB unique constraint catches it.
    if (err.code === '23505') {
      return fail(res, 409, [
        { field: 'slot', message: 'You already have a reading for this slot on this date.' },
      ]);
    }
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) return fail(res, 404, [{ message: 'Reading not found.' }]);

    const current = await query('SELECT id FROM readings WHERE id = $1 AND user_id = $2', [
      id,
      req.userId,
    ]);
    if (current.rowCount === 0) return fail(res, 404, [{ message: 'Reading not found.' }]);

    const { errors, clean } = validateReadingInput(req.body);
    if (errors.length) return fail(res, 400, errors);

    const existing = await readingsOnDate(req.userId, clean.date, id);
    const dayError = checkDayRules({ slot: clean.slot, existing, isNew: false });
    if (dayError) return fail(res, 409, [dayError]);

    const { rows } = await query(
      `UPDATE readings SET reading_date = $1, slot = $2, value = $3
       WHERE id = $4 AND user_id = $5 RETURNING ${COLUMNS}`,
      [clean.date, clean.slot, clean.value, id, req.userId]
    );
    res.json({ reading: withLabel(rows[0]) });
  } catch (err) {
    if (err.code === '23505') {
      return fail(res, 409, [
        { field: 'slot', message: 'You already have a reading for this slot on this date.' },
      ]);
    }
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = Number.isInteger(id)
      ? await query('DELETE FROM readings WHERE id = $1 AND user_id = $2', [id, req.userId])
      : { rowCount: 0 };
    if (result.rowCount === 0) return fail(res, 404, [{ message: 'Reading not found.' }]);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
