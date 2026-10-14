export const FREQUENCIES = ['weekly', 'biweekly', 'monthly', 'yearly'];

const MAX_STEPS = 5000;
const pad = (n) => String(n).padStart(2, '0');
const parse = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return { y, m, d };
};
const toStr = (date) => `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
const daysInMonth = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();

export const isValidDate = (s) => {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const { y, m, d } = parse(s);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
};

export const addDays = (s, k) => {
  const { y, m, d } = parse(s);
  return toStr(new Date(Date.UTC(y, m - 1, d + k)));
};

// Computed from the start date each time so month-end clamping never drifts.
export const occurrenceAt = (startDate, frequency, n) => {
  const { y, m, d } = parse(startDate);
  if (frequency === 'weekly' || frequency === 'biweekly') {
    return toStr(new Date(Date.UTC(y, m - 1, d + (frequency === 'weekly' ? 7 : 14) * n)));
  }
  const total = (m - 1) + (frequency === 'monthly' ? n : 12 * n);
  const year = y + Math.floor(total / 12);
  const month = (total % 12) + 1;
  return `${year}-${pad(month)}-${pad(Math.min(d, daysInMonth(year, month)))}`;
};

export const computeOccurrences = ({ start_date, frequency, next_due, end_date }, today, cap = 12) => {
  const limit = end_date && end_date < today ? end_date : today;
  const dates = [];
  for (let n = 0; dates.length < cap && n < MAX_STEPS; n++) {
    const date = occurrenceAt(start_date, frequency, n);
    if (date > limit) break;
    if (date >= next_due) dates.push(date);
  }
  return dates;
};

export const nextOnOrAfter = ({ start_date, frequency }, date) => {
  for (let n = 0; n < MAX_STEPS; n++) {
    const candidate = occurrenceAt(start_date, frequency, n);
    if (candidate >= date) return candidate;
  }
  return occurrenceAt(start_date, frequency, MAX_STEPS);
};
