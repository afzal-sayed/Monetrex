import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveMonthBudget } from './budgetResolve.js';

const groupBudgets = {
  '2026-08': { Food: 100 },
  '2026-10': { Food: 200, Rent: 500 },
  default:   { Food: 50 },
};

test('uses the month itself when it has budgets', () => {
  assert.deepEqual(resolveMonthBudget(groupBudgets, '2026-10'), { key: '2026-10', data: groupBudgets['2026-10'] });
});

test('carries the latest earlier month forward', () => {
  assert.deepEqual(resolveMonthBudget(groupBudgets, '2026-12'), { key: '2026-10', data: groupBudgets['2026-10'] });
  assert.equal(resolveMonthBudget(groupBudgets, '2026-09').key, '2026-08');
});

test('never back-fills from a later month', () => {
  assert.equal(resolveMonthBudget({ '2026-10': { Food: 1 } }, '2026-09').key, null);
});

test('falls back to default when no earlier month exists', () => {
  assert.equal(resolveMonthBudget(groupBudgets, '2026-01').key, 'default');
});

test('ignores empty month maps and handles missing input', () => {
  assert.equal(resolveMonthBudget({ '2026-09': {}, '2026-08': { Food: 1 } }, '2026-10').key, '2026-08');
  assert.deepEqual(resolveMonthBudget(undefined, '2026-10'), { key: null, data: {} });
});
