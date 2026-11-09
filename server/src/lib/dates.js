// All dates in this app are plain "YYYY-MM-DD" strings. We never convert them
// to local-time Date objects, which avoids off-by-one-day timezone bugs.

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function pad(n) {
  return String(n).padStart(2, '0');
}

export function isValidDateString(s) {
  if (typeof s !== 'string') return false;
  const m = DATE_RE.exec(s);
  if (!m) return false;
  const [, y, mo, d] = m.map(Number);
  if (mo < 1 || mo > 12 || d < 1) return false;
  return d <= daysInMonth(y, mo);
}

export function daysInMonth(year, month) {
  // month is 1-12. Day 0 of the next month is the last day of this month.
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Today's date as YYYY-MM-DD in the server's local time zone. */
export function todayString(now = new Date()) {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Plain string comparison works because the format is zero-padded. */
export function isFuture(dateStr, today = todayString()) {
  return dateStr > today;
}

export function firstOfMonth(dateStr) {
  return `${dateStr.slice(0, 7)}-01`;
}

/** First and last day of the month before the month of dateStr. */
export function previousMonthRange(dateStr) {
  let year = Number(dateStr.slice(0, 4));
  let month = Number(dateStr.slice(5, 7)) - 1;
  if (month === 0) {
    month = 12;
    year -= 1;
  }
  return {
    from: `${year}-${pad(month)}-01`,
    to: `${year}-${pad(month)}-${pad(daysInMonth(year, month))}`,
  };
}
