import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { useAppContext } from '../context/useAppContext';
import { computeMonthlyData, CATEGORY_COLORS } from '../utils/helpers';

const TIP = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900/95 border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-slate-400 text-xs mb-2">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-sm font-medium" style={{ color: p.color }}>
          {p.name}: ₹{p.value.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
        </p>
      ))}
    </div>
  );
};

export const Analytics = () => {
  const { transactions, isLoading, theme, customCategories } = useAppContext();
  const [range, setRange] = useState(6); // months to show

  const tickColor = theme === 'dark' ? '#94a3b8' : '#64748b';

  // ── Real computed data ────────────────────────────────────────────────
  const monthlyData = useMemo(
    () => computeMonthlyData(transactions, range),
    [transactions, range]
  );

  // ── Summary stats from real data ──────────────────────────────────────
  const summaryStats = useMemo(() => {
    if (monthlyData.length === 0) return null;
    const totalExpenses = monthlyData.reduce((s, m) => s + m.expenses, 0);
    const totalIncome   = monthlyData.reduce((s, m) => s + m.income,   0);
    const avgExpense    = totalExpenses / monthlyData.length;
    const avgIncome     = totalIncome   / monthlyData.length;
    const savingsRate   = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100) : 0;
    return { totalExpenses, totalIncome, avgExpense, avgIncome, savingsRate };
  }, [monthlyData]);

  // ── Category breakdown ────────────────────────────────────────────────
  const categoryData = useMemo(() => {
    const customColorMap = {};
    (customCategories || []).forEach((c) => { customColorMap[c.name] = c.color; });
    const cats = {};
    transactions.filter((t) => t.amount < 0).forEach((t) => {
      cats[t.category] = (cats[t.category] || 0) + Math.abs(t.amount);
    });
    return Object.entries(cats)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value, fill: CATEGORY_COLORS[name] || customColorMap[name] || '#6366F1' }));
  }, [transactions, customCategories]);

  // ── Monthly savings (income - expenses) ──────────────────────────────
  const savingsData = useMemo(
    () => monthlyData.map((m) => ({ ...m, savings: m.income - m.expenses })),
    [monthlyData]
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-1/3 skeleton" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map((i) => <div key={i} className="h-24 skeleton" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="h-80 skeleton" /><div className="h-80 skeleton" />
        </div>
      </div>
    );
  }

  const noData = transactions.length === 0;

  return (
    <div className="space-y-6 animate-fade-up">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Analytics</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Deep dive into your financial trends.</p>
        </div>
        {/* Range selector */}
        <div className="flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/[0.07] w-fit">
          {[3, 6, 12].map((m) => (
            <button
              key={m}
              onClick={() => setRange(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                range === m
                  ? 'bg-primary text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {m}M
            </button>
          ))}
        </div>
      </header>

      {/* Summary cards */}
      {summaryStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
          {[
            { label: 'Avg Monthly Spend', value: `₹${summaryStats.avgExpense.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, color: 'text-red-400' },
            { label: 'Avg Monthly Income', value: `₹${summaryStats.avgIncome.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, color: 'text-secondary' },
            { label: 'Savings Rate', value: `${Math.max(0, summaryStats.savingsRate).toFixed(1)}%`, color: 'text-primary' },
            { label: 'Transactions', value: transactions.length.toString(), color: 'text-accent-purple' },
          ].map((item, i) => (
            <Card glass key={i} className="text-center py-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">{item.label}</p>
              <p className={`text-2xl font-bold mt-1.5 ${item.color} animate-count-up`}>{item.value}</p>
            </Card>
          ))}
        </div>
      )}

      {noData ? (
        <Card glass className="py-20 text-center">
          <p className="text-slate-400">Add transactions to see analytics.</p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 stagger-children">

            {/* Income vs Expenses */}
            <Card glass>
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white">Income vs Expenses</CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400">Monthly cash flow comparison</CardDescription>
              </CardHeader>
              <CardContent className="h-48 sm:h-64">
                <div role="img" aria-label="Line chart comparing monthly income and expenses over time" className="h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.1)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: tickColor, fontSize: 11 }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: tickColor, fontSize: 11 }} dx={-8} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                    <Tooltip content={<TIP />} />
                    <Line type="monotone" dataKey="income"   name="Income"   stroke="#10B981" strokeWidth={2.5} dot={{ r: 4, fill: '#10B981', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 4, fill: '#EF4444', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Spending velocity */}
            <Card glass>
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white">Spending Velocity</CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400">Expense rate over time</CardDescription>
              </CardHeader>
              <CardContent className="h-48 sm:h-64">
                <div role="img" aria-label="Area chart showing spending velocity (expense rate) over time" className="h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#4F46E5" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}    />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.1)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: tickColor, fontSize: 11 }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: tickColor, fontSize: 11 }} dx={-8} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                    <Tooltip content={<TIP />} />
                    {summaryStats && (
                      <ReferenceLine y={summaryStats.avgExpense} stroke="rgba(79,70,229,0.5)" strokeDasharray="5 3" label={{ value: 'Avg', position: 'insideTopRight', fill: '#94a3b8', fontSize: 10 }} />
                    )}
                    <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#4F46E5" strokeWidth={2.5} fillOpacity={1} fill="url(#spendGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Net savings per month */}
            <Card glass>
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white">Monthly Savings</CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400">Income minus expenses per month</CardDescription>
              </CardHeader>
              <CardContent className="h-48 sm:h-64">
                <div role="img" aria-label="Bar chart showing net monthly savings (income minus expenses) per month" className="h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={savingsData}>
                    <defs>
                      <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#10B981" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#10B981" stopOpacity={0.3} />
                      </linearGradient>
                      <linearGradient id="deficitGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#EF4444" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#EF4444" stopOpacity={0.3} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.1)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: tickColor, fontSize: 11 }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: tickColor, fontSize: 11 }} dx={-8} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                    <Tooltip content={<TIP />} />
                    <ReferenceLine y={0} stroke="rgba(148,163,184,0.3)" />
                    <Bar dataKey="savings" name="Savings" radius={[6, 6, 0, 0]} barSize={28}
                      fill="url(#savingsGrad)"
                      label={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Category breakdown */}
            <Card glass>
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white">Spending by Category</CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400">All-time expense breakdown</CardDescription>
              </CardHeader>
              <CardContent className="h-48 sm:h-64">
                {categoryData.length > 0 ? (
                  <div role="img" aria-label="Horizontal bar chart showing spending breakdown by category" className="h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(148,163,184,0.1)" />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: tickColor, fontSize: 11 }} tickFormatter={(v) => `₹${(v/1000).toFixed(1)}k`} />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: tickColor, fontSize: 11 }} width={80} />
                      <Tooltip content={<TIP />} />
                      <Bar dataKey="value" name="Amount" radius={[0, 6, 6, 0]} barSize={18}>
                        {categoryData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-slate-400 text-sm">No expense data yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};
