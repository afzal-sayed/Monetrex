import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Target, Settings2, TrendingUp, AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { useAppContext } from '../context/useAppContext';
import { CATEGORY_EMOJI, CATEGORY_COLORS } from '../utils/helpers';

const STATUS_COLORS = {
  safe:     { bar: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  warning:  { bar: 'bg-amber-500',   text: 'text-amber-600 dark:text-amber-400',   badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'   },
  critical: { bar: 'bg-orange-500',  text: 'text-orange-600 dark:text-orange-400', badge: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' },
  over:     { bar: 'bg-red-500',     text: 'text-red-600 dark:text-red-400',       badge: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'           },
};

const STATUS_LABELS  = { safe: 'On track', warning: 'Warning', critical: 'Critical', over: 'Over budget!' };
const STATUS_ICONS   = { safe: CheckCircle2, warning: TrendingUp, critical: AlertTriangle, over: AlertTriangle };

const fmt = (n) => `₹${Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const toLabel = (ym) => {
  const [y, m] = ym.split('-');
  return new Date(Number(y), Number(m) - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' });
};

// Build last N months from the given anchor, newest first
const buildMonthList = (anchor, count = 12) => {
  const [y, m] = anchor.split('-').map(Number);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(y, m - 1 - i, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
};

export const Budgets = () => {
  const {
    transactions, budgetsRaw, activeGroupId, currentMonth, isLoading,
  } = useAppContext();

  const months = useMemo(() => buildMonthList(currentMonth, 12), [currentMonth]);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const isCurrentMonth = selectedMonth === currentMonth;
  const currentIdx     = months.indexOf(selectedMonth);

  const step = (dir) => {
    const next = currentIdx + dir;
    if (next >= 0 && next < months.length) setSelectedMonth(months[next]);
  };

  // Budget data for the selected month (falls back to 'default' if none set)
  const monthBudgets = useMemo(() => {
    const groupBudgets = budgetsRaw[activeGroupId] || {};
    return groupBudgets[selectedMonth] || groupBudgets['default'] || {};
  }, [budgetsRaw, activeGroupId, selectedMonth]);

  const categorySpending = useMemo(() =>
    transactions
      .filter((t) => t.amount < 0 && t.date?.slice(0, 7) === selectedMonth)
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
        return acc;
      }, {}),
    [transactions, selectedMonth]
  );

  const budgetItems = useMemo(() =>
    Object.entries(monthBudgets)
      .filter(([, amount]) => parseFloat(amount) > 0)
      .map(([category, budget]) => {
        const spent  = categorySpending[category] || 0;
        const limit  = parseFloat(budget);
        const pct    = limit > 0 ? (spent / limit) * 100 : 0;
        const status = pct > 100 ? 'over' : pct > 90 ? 'critical' : pct > 70 ? 'warning' : 'safe';
        return { category, budget: limit, spent, pct, status, remaining: limit - spent };
      })
      .sort((a, b) => b.pct - a.pct),
    [monthBudgets, categorySpending]
  );

  const unbudgetedCategories = useMemo(() =>
    Object.entries(categorySpending)
      .filter(([cat]) => !monthBudgets[cat] || parseFloat(monthBudgets[cat]) <= 0)
      .sort((a, b) => b[1] - a[1]),
    [categorySpending, monthBudgets]
  );

  const totalBudget   = budgetItems.reduce((s, i) => s + i.budget, 0);
  const totalSpent    = budgetItems.reduce((s, i) => s + i.spent,  0);
  const overallPct    = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;
  const overallStatus = overallPct > 90 ? (overallPct > 100 ? 'over' : 'critical') : overallPct > 70 ? 'warning' : 'safe';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Target size={26} className="text-primary" />
            Budget Tracker
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Monthly spending limits per category</p>
        </div>
        <Link
          to="/settings"
          className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-primary transition-colors shrink-0 mt-1"
        >
          <Settings2 size={14} />
          Edit budgets
        </Link>
      </header>

      {/* Month selector */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => step(1)}
          disabled={currentIdx >= months.length - 1}
          aria-label="Previous month"
          className="p-2 rounded-xl border border-slate-200/60 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.07] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="flex-1">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200/60 dark:border-white/10 bg-white dark:bg-slate-900/40 text-sm font-semibold text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-primary transition-colors text-center appearance-none cursor-pointer"
          >
            {months.map((m) => (
              <option key={m} value={m}>
                {toLabel(m)}{m === currentMonth ? ' (current)' : ''}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => step(-1)}
          disabled={currentIdx <= 0}
          aria-label="Next month"
          className="p-2 rounded-xl border border-slate-200/60 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.07] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={16} />
        </button>

        {!isCurrentMonth && (
          <button
            onClick={() => setSelectedMonth(currentMonth)}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/15 transition-colors shrink-0"
          >
            Today
          </button>
        )}
      </div>

      {/* Summary card */}
      {budgetItems.length > 0 && (
        <Card glass className="overflow-hidden">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-wrap gap-6 mb-5">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Total Budget</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{fmt(totalBudget)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Total Spent</p>
                <p className={`text-2xl font-bold tabular-nums ${STATUS_COLORS[overallStatus].text}`}>{fmt(totalSpent)}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Remaining</p>
                <p className="text-2xl font-bold tabular-nums">
                  {totalSpent > totalBudget ? (
                    <span className="text-red-500 dark:text-red-400">-{fmt(totalSpent - totalBudget)}</span>
                  ) : (
                    <span className="text-slate-900 dark:text-white">{fmt(totalBudget - totalSpent)}</span>
                  )}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Overall usage</span>
                <span className={`font-semibold ${STATUS_COLORS[overallStatus].text}`}>
                  {((totalBudget > 0 ? totalSpent / totalBudget : 0) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${STATUS_COLORS[overallStatus].bar}`}
                  style={{ width: `${overallPct}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {budgetItems.length === 0 && (
        <Card glass>
          <CardContent className="p-10 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Target size={24} className="text-primary" />
            </div>
            <p className="text-slate-700 dark:text-slate-200 font-semibold">
              No budgets set for {toLabel(selectedMonth)}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isCurrentMonth ? (
                <>
                  Set monthly spending limits in{' '}
                  <Link to="/settings" className="text-primary hover:underline font-medium">
                    Settings → Budget Goals
                  </Link>
                  .
                </>
              ) : (
                'No budget goals were configured for this month.'
              )}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Budget items grid */}
      {budgetItems.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgetItems.map(({ category, budget, spent, pct, status, remaining }) => {
            const colors     = STATUS_COLORS[status];
            const emoji      = CATEGORY_EMOJI[category] || '📦';
            const barColor   = CATEGORY_COLORS[category] || '#6366F1';
            const StatusIcon = STATUS_ICONS[status];
            const barWidth   = Math.min(pct, 100);

            return (
              <Card key={category} glass className="overflow-hidden">
                <CardContent className="p-5 space-y-3">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xl leading-none">{emoji}</span>
                      <span className="text-sm font-semibold text-slate-800 dark:text-white truncate">{category}</span>
                    </div>
                    <span className={`shrink-0 flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${colors.badge}`}>
                      <StatusIcon size={11} />
                      {STATUS_LABELS[status]}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${status !== 'safe' ? colors.bar : ''}`}
                        style={{ width: `${barWidth}%`, ...(status === 'safe' ? { backgroundColor: barColor } : {}) }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>{pct.toFixed(1)}% used</span>
                      <span className={`font-semibold ${colors.text}`}>
                        {fmt(spent)} <span className="font-normal">of {fmt(budget)}</span>
                      </span>
                    </div>
                  </div>

                  {/* Remaining */}
                  <div className="text-xs">
                    {remaining >= 0 ? (
                      <span className="text-slate-500 dark:text-slate-400">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{fmt(remaining)}</span> remaining
                      </span>
                    ) : (
                      <span className="text-red-500 dark:text-red-400 font-semibold">
                        {fmt(Math.abs(remaining))} over budget
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Unbudgeted spending */}
      {unbudgetedCategories.length > 0 && (
        <Card glass>
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-white text-base flex items-center gap-2">
              Unbudgeted Spending
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">— no limit set</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {unbudgetedCategories.map(([category, spent]) => (
                <div
                  key={category}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06]"
                >
                  <span className="text-lg leading-none">{CATEGORY_EMOJI[category] || '📦'}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{category}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{fmt(spent)} spent</p>
                  </div>
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[category] || '#94A3B8' }} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
