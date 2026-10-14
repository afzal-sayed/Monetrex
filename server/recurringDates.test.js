import test from 'node:test';
import assert from 'node:assert/strict';
import { occurrenceAt, computeOccurrences, nextOnOrAfter, addDays, isValidDate } from './recurringDates.js';

test('monthly on the 31st clamps to month end and snaps back without drifting', () => {
  const dates = [0, 1, 2, 3].map((n) => occurrenceAt('2026-01-31', 'monthly', n));
  assert.deepEqual(dates, ['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30']);
});

test('monthly clamps to Feb 29 in a leap year', () => {
  assert.equal(occurrenceAt('2028-01-31', 'monthly', 1), '2028-02-29');
});

test('yearly on Feb 29 clamps in non-leap years and returns in leap years', () => {
  assert.equal(occurrenceAt('2024-02-29', 'yearly', 1), '2025-02-28');
  assert.equal(occurrenceAt('2024-02-29', 'yearly', 4), '2028-02-29');
});

test('weekly and biweekly step by 7 and 14 days', () => {
  assert.equal(occurrenceAt('2026-10-14', 'weekly', 2), '2026-10-28');
  assert.equal(occurrenceAt('2026-10-14', 'biweekly', 1), '2026-10-28');
});

test('monthly rolls over the year boundary', () => {
  assert.equal(occurrenceAt('2026-11-15', 'monthly', 3), '2027-02-15');
});

test('computeOccurrences backfills every missed date up to today', () => {
  const rule = { start_date: '2026-07-10', frequency: 'monthly', next_due: '2026-07-10', end_date: null };
  assert.deepEqual(computeOccurrences(rule, '2026-10-14'), ['2026-07-10', '2026-08-10', '2026-09-10', '2026-10-10']);
});

test('computeOccurrences starts at next_due, not start_date', () => {
  const rule = { start_date: '2026-07-10', frequency: 'monthly', next_due: '2026-09-10', end_date: null };
  assert.deepEqual(computeOccurrences(rule, '2026-10-14'), ['2026-09-10', '2026-10-10']);
});

test('computeOccurrences returns nothing when next_due is in the future', () => {
  const rule = { start_date: '2026-07-10', frequency: 'monthly', next_due: '2026-11-10', end_date: null };
  assert.deepEqual(computeOccurrences(rule, '2026-10-14'), []);
});

test('computeOccurrences caps a long backlog at 12 and keeps order', () => {
  const rule = { start_date: '2025-01-01', frequency: 'weekly', next_due: '2025-01-01', end_date: null };
  const dates = computeOccurrences(rule, '2026-10-14');
  assert.equal(dates.length, 12);
  assert.equal(dates[0], '2025-01-01');
  assert.equal(dates[11], '2025-03-19');
});

test('computeOccurrences stops at end_date', () => {
  const rule = { start_date: '2026-07-10', frequency: 'monthly', next_due: '2026-07-10', end_date: '2026-09-15' };
  assert.deepEqual(computeOccurrences(rule, '2026-10-14'), ['2026-07-10', '2026-08-10', '2026-09-10']);
});

test('nextOnOrAfter never returns a paused-period date earlier than the given day', () => {
  const rule = { start_date: '2026-07-10', frequency: 'monthly' };
  assert.equal(nextOnOrAfter(rule, '2026-10-14'), '2026-11-10');
  assert.equal(nextOnOrAfter(rule, '2026-10-10'), '2026-10-10');
  assert.equal(nextOnOrAfter(rule, '2026-01-01'), '2026-07-10');
});

test('addDays crosses month and year boundaries', () => {
  assert.equal(addDays('2026-02-28', 1), '2026-03-01');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
});

test('isValidDate rejects malformed and impossible dates', () => {
  assert.equal(isValidDate('2026-02-28'), true);
  assert.equal(isValidDate('2026-02-30'), false);
  assert.equal(isValidDate('2026-2-1'), false);
  assert.equal(isValidDate('abc'), false);
  assert.equal(isValidDate(undefined), false);
});
