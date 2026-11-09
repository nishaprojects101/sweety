import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateReadingInput, checkDayRules } from '../src/lib/validation.js';

const TODAY = '2026-10-15';
const valid = { date: '2026-10-15', slot: 'after_lunch', value: 120 };
const messages = (input) => validateReadingInput(input, TODAY).errors.map((e) => e.message);

test('accepts a valid reading', () => {
  const { errors, clean } = validateReadingInput(valid, TODAY);
  assert.deepEqual(errors, []);
  assert.deepEqual(clean, valid);
});

test('accepts the value as a numeric string (form input)', () => {
  const { errors, clean } = validateReadingInput({ ...valid, value: '120' }, TODAY);
  assert.deepEqual(errors, []);
  assert.equal(clean.value, 120);
});

test('value is required', () => {
  for (const value of [undefined, null, '', '   ']) {
    assert.deepEqual(messages({ ...valid, value }), ['Please enter a glucose value.']);
  }
});

test('value must be a whole number between 40 and 600', () => {
  const expected = ['Value must be between 40 and 600 mg/dl.'];
  for (const value of [39, 601, 0, -5, 120.5, 'abc']) {
    assert.deepEqual(messages({ ...valid, value }), expected, `value=${value}`);
  }
});

test('boundary values 40 and 600 are allowed', () => {
  assert.deepEqual(messages({ ...valid, value: 40 }), []);
  assert.deepEqual(messages({ ...valid, value: 600 }), []);
});

test('date cannot be in the future, but today is fine', () => {
  assert.deepEqual(messages({ ...valid, date: '2026-10-16' }), ['Date cannot be in the future.']);
  assert.deepEqual(messages({ ...valid, date: '2026-10-15' }), []);
});

test('rejects impossible calendar dates', () => {
  assert.deepEqual(messages({ ...valid, date: '2026-02-30' }), ['Please enter a valid date.']);
});

test('rejects an unknown slot', () => {
  assert.deepEqual(messages({ ...valid, slot: 'midnight' }), ['Please choose a time slot.']);
});

test('only one reading per slot per day', () => {
  const err = checkDayRules({
    slot: 'after_lunch',
    existing: [{ id: 1, slot: 'after_lunch' }],
    isNew: true,
  });
  assert.equal(err.message, 'You already have an After lunch reading for this date.');
});

test('duplicate message uses "a" before Morning', () => {
  const err = checkDayRules({ slot: 'morning', existing: [{ id: 1, slot: 'morning' }], isNew: true });
  assert.equal(err.message, 'You already have a Morning reading for this date.');
});

test('maximum 4 readings per day', () => {
  const existing = ['morning', 'after_breakfast', 'after_lunch', 'after_dinner'].map((slot, i) => ({
    id: i,
    slot,
  }));
  const err = checkDayRules({ slot: 'morning', existing, isNew: true });
  assert.equal(err.message, 'You can add only 4 readings per day.');
});

test('a free slot on a day with other readings is allowed', () => {
  const err = checkDayRules({
    slot: 'after_dinner',
    existing: [{ id: 1, slot: 'morning' }],
    isNew: true,
  });
  assert.equal(err, null);
});

test('editing a reading to keep its own slot is allowed (caller excludes itself)', () => {
  const err = checkDayRules({ slot: 'morning', existing: [], isNew: false });
  assert.equal(err, null);
});
