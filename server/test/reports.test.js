import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeStats, reportRange } from '../src/lib/reports.js';
import { previousMonthRange, firstOfMonth, isValidDateString } from '../src/lib/dates.js';

test('computeStats: highest, lowest, average to 1 decimal, count', () => {
  const stats = computeStats([{ value: 100 }, { value: 150 }, { value: 121 }]);
  assert.deepEqual(stats, { count: 3, highest: 150, lowest: 100, average: 123.7 });
});

test('computeStats: a single reading', () => {
  assert.deepEqual(computeStats([{ value: 90 }]), { count: 1, highest: 90, lowest: 90, average: 90 });
});

test('computeStats: empty list returns nulls and zero count', () => {
  assert.deepEqual(computeStats([]), { count: 0, highest: null, lowest: null, average: null });
});

test('daily range is the selected date', () => {
  assert.deepEqual(reportRange('daily', '2026-10-15'), { from: '2026-10-15', to: '2026-10-15' });
});

test('month-to-date runs from the 1st to the selected date', () => {
  assert.deepEqual(reportRange('month-to-date', '2026-10-15'), { from: '2026-10-01', to: '2026-10-15' });
});

test('monthly is the whole previous month (30 days)', () => {
  assert.deepEqual(reportRange('monthly', '2026-10-15'), { from: '2026-09-01', to: '2026-09-30' });
});

test('monthly crosses the year boundary in January', () => {
  assert.deepEqual(previousMonthRange('2026-01-10'), { from: '2025-12-01', to: '2025-12-31' });
});

test('monthly handles leap-year February', () => {
  assert.deepEqual(previousMonthRange('2024-03-05'), { from: '2024-02-01', to: '2024-02-29' });
  assert.deepEqual(previousMonthRange('2026-03-05'), { from: '2026-02-01', to: '2026-02-28' });
});

test('unknown report type returns null', () => {
  assert.equal(reportRange('weekly', '2026-10-15'), null);
});

test('date helpers', () => {
  assert.equal(firstOfMonth('2026-10-15'), '2026-10-01');
  assert.equal(isValidDateString('2026-10-15'), true);
  assert.equal(isValidDateString('15-10-2026'), false);
  assert.equal(isValidDateString('2026-13-01'), false);
});
