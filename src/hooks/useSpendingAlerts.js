import { useEffect, useRef } from 'react';
import { useAppContext } from '../context/useAppContext';

export function useSpendingAlerts() {
  const { transactions, budgets, activeGroupId, showToast } = useAppContext();
  // Tracks 'category-YYYY-MM-80' / 'category-YYYY-MM-100' already toasted this session
  const alertedRef = useRef(new Set());

  useEffect(() => {
    if (!budgets || !activeGroupId) return;

    const thisMonth = new Date().toISOString().slice(0, 7);
    const groupBudgets = budgets[activeGroupId] ?? {};
    const monthBudgets = {
      ...(groupBudgets['default'] ?? {}),
      ...(groupBudgets[thisMonth] ?? {}),
    };

    Object.entries(monthBudgets).forEach(([category, rawLimit]) => {
      const limit = parseFloat(rawLimit);
      if (!limit || limit <= 0) return;

      const spent = transactions
        .filter((t) => t.category === category && t.amount < 0 && t.date?.slice(0, 7) === thisMonth)
        .reduce((s, t) => s + Math.abs(t.amount), 0);

      const pct = (spent / limit) * 100;
      const fmt = (v) => v.toLocaleString('en-IN', { maximumFractionDigits: 0 });

      const key100 = `${category}-${thisMonth}-100`;
      const key80  = `${category}-${thisMonth}-80`;

      if (pct >= 100 && !alertedRef.current.has(key100)) {
        alertedRef.current.add(key100);
        showToast(`${category} budget exceeded! ₹${fmt(spent)} of ₹${fmt(limit)}`, 'error');
      } else if (pct >= 80 && !alertedRef.current.has(key80)) {
        alertedRef.current.add(key80);
        showToast(`${category} at ${Math.round(pct)}% of budget (₹${fmt(spent)} / ₹${fmt(limit)})`, 'warning');
      }
    });
  }, [transactions, budgets, activeGroupId, showToast]);
}
