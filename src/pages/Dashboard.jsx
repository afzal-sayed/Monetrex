import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Plus, ArrowUpRight, ArrowDownRight, TrendingUp, CreditCard, Wallet, Repeat } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { useAppContext } from '../context/useAppContext';
import { AddExpenseModal } from '../components/features/AddExpenseModal';
import { InsightsPanel } from '../components/features/InsightsPanel';
import { CATEGORY_COLORS, CATEGORY_EMOJI, formatDate } from '../utils/helpers';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900/95 border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-white text-sm font-bold">
          ₹{p.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </p>
      ))}
    </div>
  );
};

export const Dashboard = () => {
  const {
    user, transactions, isLoading,
    groups, activeGroupId, setActiveGroupId,
    budgets, monthlyData,
  } = useAppContext();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statsPeriod, setStatsPeriod] = useState('month'); // 'month' | 'all'

  // ── Stats ───────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const now  = new Date();
    const mKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const currentMonthKey = mKey(now);

    const scopedTxns = statsPeriod === 'month'
      ? transactions.filter((t) => t.date?.slice(0, 7) === currentMonthKey)
      : transactions;

    const income  = scopedTxns.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const expense = scopedTxns.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
    const balance = income - expense;
    const fmt = (v) => `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // Spend trend vs previous month (only shown in month mode)
    let spendTrend = null;
    if (statsPeriod === 'month') {
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMSpend = transactions
        .filter((t) => t.date?.slice(0, 7) === mKey(prev) && t.amount < 0)
        .reduce((s, t) => s + Math.abs(t.amount), 0);
      if (lastMSpend > 0) spendTrend = ((expense - lastMSpend) / lastMSpend * 100).toFixed(1);
    }

    return [
      { id: 1, title: 'Balance',  value: fmt(balance), trend: null,       isPositive: balance >= 0, icon: Wallet      },
      { id: 2, title: 'Income',   value: fmt(income),  trend: null,       isPositive: true,         icon: TrendingUp  },
      { id: 3, title: 'Expenses', value: fmt(expense), trend: spendTrend, isPositive: spendTrend !== null ? parseFloat(spendTrend) <= 0 : true, icon: CreditCard },
    ];
  }, [transactions, statsPeriod]);

  // ── Category breakdown ──────────────────────────────────────────────────
  const categoryData = useMemo(() => {
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const scopedTxns = statsPeriod === 'month'
      ? transactions.filter((t) => t.date?.slice(0, 7) === currentMonthKey)
      : transactions;
    const cats = {};
    scopedTxns.filter((t) => t.amount < 0).forEach((t) => {
      cats[t.category] = (cats[t.category] || 0) + Math.abs(t.amount);
    });
    return Object.entries(cats)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value, color: CATEGORY_COLORS[name] || '#6366F1' }));
  }, [transactions, statsPeriod]);

  // ── Budget progress ─────────────────────────────────────────────────────
  const budgetProgress = useMemo(() => {
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const thisMonthSpend = transactions
      .filter((t) => t.amount < 0 && t.date?.slice(0, 7) === thisMonth)
      .reduce((s, t) => s + Math.abs(t.amount), 0);
    const totalBudget = Object.values(budgets).reduce((s, v) => s + (parseFloat(v) || 0), 0);
    return { spent: thisMonthSpend, total: totalBudget };
  }, [transactions, budgets]);

  const budgetPct = budgetProgress.total > 0
    ? Math.min((budgetProgress.spent / budgetProgress.total) * 100, 100)
    : 0;

  const recentTxns = transactions.slice(0, 6);
  const recurringCount = transactions.filter((t) => t.is_recurring).length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-1/3 skeleton" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 stagger-children">
          {[1, 2, 3].map((i) => <div key={i} className="h-32 skeleton" />)}
        </div>
        <div className="h-20 skeleton" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 h-80 skeleton" />
          <div className="h-80 skeleton" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">

      {/* Header */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Welcome back,{' '}
            <span className="gradient-text">{user?.name?.split(' ')[0] || 'there'}</span> 👋
          </h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <p className="text-slate-500 dark:text-slate-400 text-sm">Here's your financial snapshot</p>
            {groups.length > 1 ? (
              <select
                value={activeGroupId}
                onChange={(e) => setActiveGroupId(e.target.value)}
                className="bg-primary/10 dark:bg-primary/15 border-none text-xs font-bold text-primary rounded-lg px-2 py-1 outline-none cursor-pointer"
              >
                {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            ) : groups.length === 1 ? (
              <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-lg">{groups[0].name}</span>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Period toggle */}
          <div className="hidden sm:flex gap-0.5 p-0.5 rounded-xl bg-slate-100 dark:bg-white/[0.07]">
            {[['month', 'This Month'], ['all', 'All Time']].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setStatsPeriod(val)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  statsPeriod === val
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <Button variant="primary" className="gap-2" onClick={() => setIsModalOpen(true)}>
            <Plus size={17} />
            <span className="hidden sm:inline">Add</span>
          </Button>
        </div>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children">
        {stats.map((stat) => (
          <Card key={stat.id} interactive glass className="neon-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {stat.title}
              </CardTitle>
              <div className="p-2 rounded-xl bg-primary/10">
                <stat.icon size={16} className="text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight animate-count-up">
                {stat.value}
              </div>
              {stat.trend !== null && (
                <p className={`text-xs mt-1 font-medium flex items-center gap-1 ${stat.isPositive ? 'text-secondary' : 'text-red-400'}`}>
                  {stat.isPositive ? <ArrowDownRight size={13} /> : <ArrowUpRight size={13} />}
                  {Math.abs(parseFloat(stat.trend))}% vs last month
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Insights Panel */}
      <InsightsPanel />

      {/* Charts + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left: Charts */}
        <div className="lg:col-span-2 space-y-5">

          {/* Spending bar chart */}
          <Card glass className="p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-slate-900 dark:text-white">Monthly Overview</h3>
              {recurringCount > 0 && (
                <span className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-100 dark:bg-white/[0.06] px-2.5 py-1 rounded-lg">
                  <Repeat size={12} /> {recurringCount} recurring
                </span>
              )}
            </div>
            <div className="h-48 sm:h-64">
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} barGap={4}>
                    <defs>
                      <linearGradient id="expenseBar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#4F46E5" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#7C3AED" stopOpacity={0.4} />
                      </linearGradient>
                      <linearGradient id="incomeBar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#10B981" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#10B981" stopOpacity={0.3} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.1)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} dx={-8} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148,163,184,0.06)' }} />
                    <Bar dataKey="expenses" name="Expenses" fill="url(#expenseBar)" radius={[6, 6, 0, 0]} barSize={20} />
                    <Bar dataKey="income"   name="Income"   fill="url(#incomeBar)"  radius={[6, 6, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                  Add transactions to see your chart
                </div>
              )}
            </div>
            {/* Legend */}
            <div className="flex gap-4 mt-3 justify-center">
              <span className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-2.5 h-2.5 rounded-sm bg-primary inline-block"/>Expenses</span>
              <span className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-2.5 h-2.5 rounded-sm bg-secondary inline-block"/>Income</span>
            </div>
          </Card>

          {/* Category + Budget row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Card glass>
              <CardHeader><CardTitle className="text-slate-900 dark:text-white text-base">Category Split</CardTitle></CardHeader>
              <CardContent>
                {categoryData.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    <div className="h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Tooltip
                            formatter={(v) => [`₹${v.toFixed(2)}`, '']}
                            contentStyle={{ backgroundColor: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#fff' }}
                          />
                          <Pie data={categoryData} innerRadius={48} outerRadius={62} paddingAngle={4} dataKey="value" strokeWidth={0}>
                            {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Legend */}
                    <div className="flex flex-col gap-1 max-h-28 overflow-y-auto scrollbar-thin pr-1">
                      {categoryData.map((entry) => (
                        <div key={entry.name} className="flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                            <span className="text-slate-600 dark:text-slate-300 truncate">{entry.name}</span>
                          </div>
                          <span className="text-slate-500 dark:text-slate-400 tabular-nums shrink-0">₹{entry.value.toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-44 flex items-center justify-center">
                    <p className="text-slate-400 text-sm text-center">No expense data yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card glass>
              <CardHeader><CardTitle className="text-slate-900 dark:text-white text-base">Monthly Budget</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {budgetProgress.total > 0 ? (
                  <>
                    <div>
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-slate-500 dark:text-slate-400">
                          ₹{budgetProgress.spent.toLocaleString('en-IN', { minimumFractionDigits: 0 })} spent
                        </span>
                        <span className={`font-bold ${budgetPct > 80 ? 'text-red-400' : 'text-secondary'}`}>
                          {budgetPct.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-200/70 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${
                            budgetPct > 90 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                            : budgetPct > 70 ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                            : 'bg-gradient-to-r from-secondary to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                          }`}
                          style={{ width: `${budgetPct}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-400 mt-2">
                        ₹{Math.max(0, budgetProgress.total - budgetProgress.spent).toFixed(0)} of ₹{budgetProgress.total.toLocaleString('en-IN')} remaining
                      </p>
                    </div>
                    {/* Per-category mini bars — sorted by spent descending */}
                    <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-thin pr-1">
                      {(() => {
                        const now = new Date();
                        const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                        return Object.entries(budgets)
                          .map(([cat, limit]) => {
                            const spent = transactions
                              .filter((t) => t.category === cat && t.amount < 0 && t.date?.slice(0, 7) === thisMonth)
                              .reduce((s, t) => s + Math.abs(t.amount), 0);
                            return { cat, limit: parseFloat(limit), spent };
                          })
                          .sort((a, b) => b.spent - a.spent)
                          .map(({ cat, limit, spent }) => {
                            const pct = Math.min((spent / limit) * 100, 100);
                            return (
                              <div key={cat}>
                                <div className="flex justify-between text-xs text-slate-400 mb-1">
                                  <span>{cat}</span><span>{pct.toFixed(0)}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-200/60 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all duration-700"
                                    style={{ width: `${pct}%`, backgroundColor: CATEGORY_COLORS[cat] || '#6366F1' }}
                                  />
                                </div>
                              </div>
                            );
                          });
                      })()}
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-slate-400">No budget set yet.</p>
                    <p className="text-xs text-slate-500">Go to <strong className="text-primary">Settings → Budget Goals</strong> to set monthly limits.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right: Recent Activity */}
        <Card glass className="flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-slate-900 dark:text-white text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 space-y-1">
            {recentTxns.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <p className="text-slate-400 text-sm">No transactions yet.</p>
                <button onClick={() => setIsModalOpen(true)} className="text-primary text-xs mt-2 hover:underline">
                  Add your first one →
                </button>
              </div>
            ) : (
              recentTxns.map((txn) => (
                <div
                  key={txn.id}
                  className="flex items-center justify-between rounded-xl p-2.5 hover:bg-slate-100/50 dark:hover:bg-white/[0.04] transition-colors cursor-default group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 border border-slate-200/50 dark:border-white/[0.07]"
                      style={{ backgroundColor: `${CATEGORY_COLORS[txn.category] || '#6366F1'}18` }}
                    >
                      {txn.amount > 0 ? '💰' : CATEGORY_EMOJI[txn.category] || '💳'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{txn.title}</p>
                      <p className="text-xs text-slate-400">{txn.category} · {formatDate(txn.date)}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold tabular-nums ml-3 shrink-0 ${txn.amount > 0 ? 'text-secondary' : 'text-slate-900 dark:text-white'}`}>
                    {txn.amount > 0 ? '+' : '−'}₹{Math.abs(txn.amount).toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
          {transactions.length > 6 && (
            <div className="p-4 pt-0">
              <Link to="/transactions" className="text-xs text-primary hover:underline block text-center">
                View all {transactions.length} transactions →
              </Link>
            </div>
          )}
        </Card>
      </div>

      <AddExpenseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
