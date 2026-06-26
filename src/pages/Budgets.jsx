import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Target, Settings2, TrendingUp, AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, ChevronDown, CalendarDays, Plus, Pin, PinOff, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { useAppContext } from '../context/useAppContext';
import { CATEGORY_EMOJI, CATEGORY_COLORS } from '../utils/helpers';
import BudgetVsActualChart from '../components/charts/BudgetVsActualChart';

const STATUS_COLORS = {
  safe:      { bar: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  warning:   { bar: 'bg-amber-500',   text: 'text-amber-600 dark:text-amber-400',     badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'     },
  critical:  { bar: 'bg-orange-500',  text: 'text-orange-600 dark:text-orange-400',   badge: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20'  },
  over:      { bar: 'bg-red-500',     text: 'text-red-600 dark:text-red-400',         badge: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'             },
  committed: { bar: 'bg-blue-500',    text: 'text-blue-600 dark:text-blue-400',       badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'         },
};

const STATUS_LABELS  = { safe: 'On track', warning: 'Warning', critical: 'Critical', over: 'Over budget!', committed: 'Committed' };
const STATUS_ICONS   = { safe: CheckCircle2, warning: TrendingUp, critical: AlertTriangle, over: AlertTriangle, committed: Pin };

const fmt = (n) => `₹${Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const getBudgetStatus = (budgetType, pct) => {
  if (budgetType === 'fixed') return 'committed';
  if (pct > 100) return 'over';
  if (pct > 90) return 'critical';
  if (pct > 70) return 'warning';
  return 'safe';
};

const getOverallStatus = (pct) => {
  if (pct > 100) return 'over';
  if (pct > 90) return 'critical';
  if (pct > 70) return 'warning';
  return 'safe';
};

const toLabel = (ym) => {
  const [y, m] = ym.split('-');
  return new Date(Number(y), Number(m) - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' });
};

const buildMonthList = (anchor, count = 12) => {
  const [y, m] = anchor.split('-').map(Number);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(y, m - 1 - i, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
};

const BudgetCard = ({ category, budget, spent, pct, status, remaining, budgetType, isAdmin, isToggling, onToggleType }) => {
  const colors     = STATUS_COLORS[status];
  const emoji      = CATEGORY_EMOJI[category] || '📦';
  const barColor   = CATEGORY_COLORS[category] || '#6366F1';
  const StatusIcon = STATUS_ICONS[status];
  const barWidth   = Math.min(pct, 100);
  const isFixed    = budgetType === 'fixed';

  return (
    <Card glass className="overflow-hidden">
      <CardContent className="p-5 space-y-3">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl leading-none">{emoji}</span>
            <span className="text-sm font-semibold text-slate-800 dark:text-white truncate">{category}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${colors.badge}`}>
              <StatusIcon size={11} />
              {STATUS_LABELS[status]}
            </span>
            {isAdmin && (
              <button
                onClick={() => onToggleType(category, budget)}
                disabled={isToggling}
                title={isFixed ? 'Mark as flexible' : 'Mark as fixed expense (e.g. rent)'}
                className={`p-1 rounded-lg transition-all ${
                  isFixed
                    ? 'text-blue-500 hover:bg-blue-500/10'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.07]'
                }`}
              >
                {isToggling && <Loader2 size={13} className="animate-spin" />}
                {!isToggling && isFixed && <Pin size={13} fill="currentColor" />}
                {!isToggling && !isFixed && <PinOff size={13} />}
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${isFixed ? 'bg-blue-500' : status !== 'safe' ? colors.bar : ''}`}
              style={{ width: `${barWidth}%`, ...((!isFixed && status === 'safe') ? { backgroundColor: barColor } : {}) }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{pct.toFixed(1)}% used</span>
            <span className={`font-semibold ${isFixed ? 'text-blue-500 dark:text-blue-400' : colors.text}`}>
              {fmt(spent)} <span className="font-normal">of {fmt(budget)}</span>
            </span>
          </div>
        </div>

        {/* Remaining */}
        <div className="text-xs">
          {isFixed ? (
            remaining >= 0 ? (
              <span className="text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-300">{fmt(remaining)}</span> unused
              </span>
            ) : (
              <span className="text-slate-500 dark:text-slate-400">
                <span className="font-semibold">{fmt(Math.abs(remaining))}</span> above fixed amount
              </span>
            )
          ) : (
            remaining >= 0 ? (
              <span className="text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-300">{fmt(remaining)}</span> remaining
              </span>
            ) : (
              <span className="text-red-500 dark:text-red-400 font-semibold">
                {fmt(Math.abs(remaining))} over budget
              </span>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const Budgets = () => {
  const {
    transactions, budgetsRaw, budgetTypesRaw, activeGroupId, currentMonth, isLoading,
    updateBudgets, isAdmin,
  } = useAppContext();

  const months = useMemo(() => buildMonthList(currentMonth, 12), [currentMonth]);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [pickerOpen,    setPickerOpen]    = useState(false);
  const pickerRef = useRef(null);
  const [editingCat,  setEditingCat]  = useState(null);
  const [editAmt,     setEditAmt]     = useState('');
  const [editType,    setEditType]    = useState('flexible');
  const [saving,      setSaving]      = useState(false);
  const [togglingCat, setTogglingCat] = useState(null);

  const isCurrentMonth = selectedMonth === currentMonth;
  const currentIdx     = months.indexOf(selectedMonth);

  const step = (dir) => {
    const next = currentIdx + dir;
    if (next >= 0 && next < months.length) setSelectedMonth(months[next]);
  };

  useEffect(() => {
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) setPickerOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const monthBudgets = useMemo(() => {
    const groupBudgets = budgetsRaw[activeGroupId] || {};
    return groupBudgets[selectedMonth] || groupBudgets['default'] || {};
  }, [budgetsRaw, activeGroupId, selectedMonth]);

  const monthBudgetTypes = useMemo(() => {
    const groupTypes = (budgetTypesRaw || {})[activeGroupId] || {};
    return groupTypes[selectedMonth] || groupTypes['default'] || {};
  }, [budgetTypesRaw, activeGroupId, selectedMonth]);

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
        const spent      = categorySpending[category] || 0;
        const limit      = parseFloat(budget);
        const pct        = limit > 0 ? (spent / limit) * 100 : 0;
        const budgetType = monthBudgetTypes[category] || 'flexible';
        const status     = getBudgetStatus(budgetType, pct);
        return { category, budget: limit, spent, pct, status, remaining: limit - spent, budgetType };
      }),
    [monthBudgets, monthBudgetTypes, categorySpending]
  );

  const committedItems     = useMemo(() => budgetItems.filter((i) => i.budgetType === 'fixed').sort((a, b) => b.pct - a.pct),    [budgetItems]);
  const discretionaryItems = useMemo(() => budgetItems.filter((i) => i.budgetType !== 'fixed').sort((a, b) => b.pct - a.pct), [budgetItems]);

  const unbudgetedCategories = useMemo(() =>
    Object.entries(categorySpending)
      .filter(([cat]) => !monthBudgets[cat] || parseFloat(monthBudgets[cat]) <= 0)
      .sort((a, b) => b[1] - a[1]),
    [categorySpending, monthBudgets]
  );

  const flexibleItems   = discretionaryItems;
  const totalBudget     = flexibleItems.reduce((s, i) => s + i.budget, 0);
  const totalSpent      = flexibleItems.reduce((s, i) => s + i.spent,  0);
  const overallPct      = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;
  const overallStatus   = getOverallStatus(overallPct);

  const committedTotal  = committedItems.reduce((s, i) => s + i.budget, 0);
  const committedSpent  = committedItems.reduce((s, i) => s + i.spent,  0);

  const handleSetBudget = async (category) => {
    const amount = parseFloat(editAmt);
    if (!amount || amount <= 0) return;
    setSaving(true);
    const ok = await updateBudgets(
      { ...monthBudgets, [category]: amount },
      selectedMonth,
      { ...monthBudgetTypes, [category]: editType }
    );
    if (ok) { setEditingCat(null); setEditAmt(''); setEditType('flexible'); }
    setSaving(false);
  };

  const handleToggleType = async (category, budget) => {
    if (!isAdmin) return;
    setTogglingCat(category);
    const currentType = monthBudgetTypes[category] || 'flexible';
    const newType = currentType === 'fixed' ? 'flexible' : 'fixed';
    await updateBudgets(
      { [category]: budget },
      selectedMonth,
      { [category]: newType }
    );
    setTogglingCat(null);
  };

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
          state={{ scrollTo: 'budget-goals' }}
          className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-primary transition-colors shrink-0 mt-1"
        >
          <Settings2 size={14} />
          Edit budgets
        </Link>
      </header>

      {/* Month navigator */}
      <div className="flex items-center gap-3">
        <div className="relative" ref={pickerRef}>
          <div className="flex items-center rounded-2xl overflow-hidden border border-slate-200/70 dark:border-white/[0.09] bg-white/80 dark:bg-white/[0.05] backdrop-blur-sm shadow-sm">
            <button
              onClick={() => step(1)}
              disabled={currentIdx >= months.length - 1}
              aria-label="Previous month"
              className="flex items-center justify-center w-10 h-10 shrink-0 text-slate-400 hover:text-primary hover:bg-primary/8 disabled:opacity-25 disabled:cursor-not-allowed transition-all border-r border-slate-200/60 dark:border-white/[0.08]"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPickerOpen((v) => !v)}
              className="flex items-center justify-center gap-2 px-3 py-2.5 min-w-[168px]"
            >
              <CalendarDays size={14} className="text-primary shrink-0" />
              <span className="text-sm font-semibold text-slate-800 dark:text-white truncate">{toLabel(selectedMonth)}</span>
              {!isCurrentMonth && (
                <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-amber-400/15 text-amber-500 dark:text-amber-400 shrink-0">Past</span>
              )}
              <ChevronDown size={13} className={`text-slate-400 shrink-0 transition-transform duration-200 ${pickerOpen ? 'rotate-180' : ''}`} />
            </button>
            <button
              onClick={() => step(-1)}
              disabled={currentIdx <= 0}
              aria-label="Next month"
              className="flex items-center justify-center w-10 h-10 shrink-0 text-slate-400 hover:text-primary hover:bg-primary/8 disabled:opacity-25 disabled:cursor-not-allowed transition-all border-l border-slate-200/60 dark:border-white/[0.08]"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {pickerOpen && (
            <div className="absolute left-0 top-[calc(100%+6px)] z-50 w-64 glass-panel border border-white/30 dark:border-white/[0.09] rounded-2xl shadow-2xl p-3 animate-fade-up">
              <div className="grid grid-cols-3 gap-1.5">
                {[...months].reverse().map((m) => {
                  const isSelected = m === selectedMonth;
                  const isCurrent  = m === currentMonth;
                  return (
                    <button
                      key={m}
                      onClick={() => { setSelectedMonth(m); setPickerOpen(false); }}
                      className={`px-2 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-primary text-white shadow-md shadow-primary/30'
                          : isCurrent
                          ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.08]'
                      }`}
                    >
                      {new Date(Number(m.split('-')[0]), Number(m.split('-')[1]) - 1)
                        .toLocaleString('en-IN', { month: 'short', year: '2-digit' })}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {!isCurrentMonth && (
          <button
            onClick={() => { setSelectedMonth(currentMonth); setPickerOpen(false); }}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/15 border border-primary/20 transition-all shrink-0"
          >
            <CalendarDays size={13} />
            Today
          </button>
        )}
      </div>

      {/* Empty state */}
      {budgetItems.length === 0 && (
        <Card glass>
          <CardContent className="p-10 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Target size={24} className="text-primary" />
            </div>
            <p className="text-slate-700 dark:text-slate-200 font-semibold">No budgets set for {toLabel(selectedMonth)}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isCurrentMonth ? (
                <>
                  Set monthly spending limits in{' '}
                  <Link to="/settings" state={{ scrollTo: 'budget-goals' }} className="text-primary hover:underline font-medium">
                    Settings → Budget Goals
                  </Link>.
                </>
              ) : 'No budget goals were configured for this month.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Committed expenses section */}
      {committedItems.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Pin size={15} className="text-blue-500" fill="currentColor" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Committed Expenses</h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">— fixed amounts (rent, subscriptions)</span>
            {committedTotal > 0 && (
              <span className="ml-auto text-xs text-blue-500 dark:text-blue-400 font-medium">{fmt(committedSpent)} / {fmt(committedTotal)}</span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {committedItems.map((item) => <BudgetCard key={item.category} {...item} isAdmin={isAdmin} isToggling={togglingCat === item.category} onToggleType={handleToggleType} />)}
          </div>
        </section>
      )}

      {/* Discretionary section with summary */}
      {discretionaryItems.length > 0 && (
        <section>
          {committedItems.length > 0 && (
            <div className="flex items-center gap-2 mb-3">
              <Target size={15} className="text-primary" />
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Discretionary</h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">— flexible spending limits</span>
            </div>
          )}

          {/* Summary card — only for discretionary */}
          <Card glass className="overflow-hidden mb-4">
            <CardContent className="p-5 sm:p-6">
              <div className="flex flex-wrap gap-6 mb-5">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Discretionary Budget</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{fmt(totalBudget)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Spent</p>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {discretionaryItems.map((item) => <BudgetCard key={item.category} {...item} isAdmin={isAdmin} isToggling={togglingCat === item.category} onToggleType={handleToggleType} />)}
          </div>
        </section>
      )}

      {/* Budget vs Actual */}
      <div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-3">Budget vs Actual — This Month</h3>
        <BudgetVsActualChart selectedMonth={selectedMonth} />
      </div>

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
                  {isAdmin && (
                    <button
                      onClick={() => { setEditingCat(category); setEditAmt(''); setEditType('flexible'); }}
                      className="ml-1 flex items-center gap-1 text-xs text-primary hover:underline shrink-0 cursor-pointer"
                      title="Set budget limit"
                    >
                      <Plus size={13} /> Set limit
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Set Budget Modal */}
            <Modal
              isOpen={!!editingCat}
              onClose={() => { setEditingCat(null); setEditAmt(''); setEditType('flexible'); }}
              title="Set Budget Limit"
            >
              {editingCat && (
                <div className="space-y-5">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-100 dark:bg-white/[0.06]">
                    <span className="text-2xl leading-none">{CATEGORY_EMOJI[editingCat] || '📦'}</span>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-white">{editingCat}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {fmt(unbudgetedCategories.find(([c]) => c === editingCat)?.[1] || 0)} spent this month
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Monthly limit (₹)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g. 5000"
                        value={editAmt}
                        onChange={(e) => setEditAmt(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSetBudget(editingCat)}
                        className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Fixed expense toggle */}
                  <button
                    type="button"
                    onClick={() => setEditType((t) => t === 'fixed' ? 'flexible' : 'fixed')}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                      editType === 'fixed'
                        ? 'border-blue-400/50 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20'
                    }`}
                  >
                    <Pin size={16} className={editType === 'fixed' ? 'text-blue-500' : 'text-slate-400'} fill={editType === 'fixed' ? 'currentColor' : 'none'} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Fixed expense</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Committed cost (rent, subscription) — no 70%/90% alerts</p>
                    </div>
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${editType === 'fixed' ? 'border-blue-500 bg-blue-500' : 'border-slate-300 dark:border-white/20'}`}>
                      {editType === 'fixed' && <div className="w-2 h-2 rounded-sm bg-white" />}
                    </div>
                  </button>

                  <div className="flex gap-3 pt-1">
                    <Button
                      variant="glass"
                      className="flex-1"
                      onClick={() => { setEditingCat(null); setEditAmt(''); setEditType('flexible'); }}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1"
                      disabled={saving || !editAmt || parseFloat(editAmt) <= 0}
                      onClick={() => handleSetBudget(editingCat)}
                    >
                      {saving ? 'Saving…' : 'Save Budget'}
                    </Button>
                  </div>
                </div>
              )}
            </Modal>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
