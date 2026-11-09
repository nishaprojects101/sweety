import { isValidDateString, isFuture, todayString } from './dates.js';
import { SLOTS, SLOT_KEYS, MAX_READINGS_PER_DAY, MIN_VALUE, MAX_VALUE } from './slots.js';

/**
 * Checks a reading's own fields (no database needed).
 * Returns { errors, clean } where errors is a list of { field, message }.
 */
export function validateReadingInput(input, today = todayString()) {
  const errors = [];
  const { date, slot, value } = input ?? {};

  // --- value ---
  let cleanValue;
  if (value === undefined || value === null || String(value).trim() === '') {
    errors.push({ field: 'value', message: 'Please enter a glucose value.' });
  } else {
    const n = typeof value === 'number' ? value : Number(String(value).trim());
    if (!Number.isInteger(n) || n < MIN_VALUE || n > MAX_VALUE) {
      errors.push({
        field: 'value',
        message: `Value must be between ${MIN_VALUE} and ${MAX_VALUE} mg/dl.`,
      });
    } else {
      cleanValue = n;
    }
  }

  // --- slot ---
  if (!SLOT_KEYS.includes(slot)) {
    errors.push({ field: 'slot', message: 'Please choose a time slot.' });
  }

  // --- date ---
  if (!date) {
    errors.push({ field: 'date', message: 'Please choose a date.' });
  } else if (!isValidDateString(date)) {
    errors.push({ field: 'date', message: 'Please enter a valid date.' });
  } else if (isFuture(date, today)) {
    errors.push({ field: 'date', message: 'Date cannot be in the future.' });
  }

  return { errors, clean: { date, slot, value: cleanValue } };
}

/**
 * Rules that need to know what is already saved for the day.
 * `existing` is the list of readings already on that date (excluding the one
 * being edited). `isNew` is true when creating, false when editing.
 */
export function checkDayRules({ slot, existing, isNew }) {
  if (isNew && existing.length >= MAX_READINGS_PER_DAY) {
    return { field: 'date', message: 'You can add only 4 readings per day.' };
  }
  if (existing.some((r) => r.slot === slot)) {
    const name = SLOTS[slot].replace(' (fasting)', '');
    const article = /^[aeiou]/i.test(name) ? 'an' : 'a';
    return {
      field: 'slot',
      message: `You already have ${article} ${name} reading for this date.`,
    };
  }
  return null;
}
