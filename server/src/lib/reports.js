import { firstOfMonth, previousMonthRange } from './dates.js';

/** Highest, lowest, average (1 decimal) and count for a list of readings. */
export function computeStats(readings) {
  if (readings.length === 0) {
    return { count: 0, highest: null, lowest: null, average: null };
  }
  const values = readings.map((r) => r.value);
  const sum = values.reduce((a, b) => a + b, 0);
  return {
    count: values.length,
    highest: Math.max(...values),
    lowest: Math.min(...values),
    average: Math.round((sum / values.length) * 10) / 10,
  };
}

/** The date range each report covers, for a selected date. */
export function reportRange(type, date) {
  switch (type) {
    case 'daily':
      return { from: date, to: date };
    case 'month-to-date':
      return { from: firstOfMonth(date), to: date };
    case 'monthly':
      return previousMonthRange(date);
    default:
      return null;
  }
}

export const REPORT_TYPES = ['daily', 'month-to-date', 'monthly'];
