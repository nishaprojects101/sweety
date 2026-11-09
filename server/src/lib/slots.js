export const SLOTS = {
  morning: 'Morning (fasting)',
  after_breakfast: 'After breakfast',
  after_lunch: 'After lunch',
  after_dinner: 'After dinner',
};

export const SLOT_KEYS = Object.keys(SLOTS);

export const MAX_READINGS_PER_DAY = SLOT_KEYS.length;

export const MIN_VALUE = 40;
export const MAX_VALUE = 600;
