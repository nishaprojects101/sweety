import { MIN_VALUE, MAX_VALUE, todayString } from './constants.js';

/**
 * Quick checks in the browser so the user gets instant feedback.
 * The server repeats these and also checks the rules that need the database
 * (one reading per slot, max 4 per day), so it is always the final judge.
 * Returns an object like { value: "message", date: "message" }.
 */
export function validateReading({ date, slot, value }, today = todayString()) {
  const errors = {};

  if (value === undefined || value === null || String(value).trim() === '') {
    errors.value = 'Please enter a glucose value.';
  } else {
    const n = Number(value);
    if (!Number.isInteger(n) || n < MIN_VALUE || n > MAX_VALUE) {
      errors.value = `Value must be between ${MIN_VALUE} and ${MAX_VALUE} mg/dl.`;
    }
  }

  if (!slot) errors.slot = 'Please choose a time slot.';

  if (!date) errors.date = 'Please choose a date.';
  else if (date > today) errors.date = 'Date cannot be in the future.';

  return errors;
}
