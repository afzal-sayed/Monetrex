import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts';
import { useAppContext } from '../../context/useAppContext';

const TIP = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900/95 border border-white/10 rounded-xl px-4 py-3 shadow-2xl text-sm">
      <p className="text-slate-400 text-xs mb-2">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="font-medium" style={{ color: p.color }}>
          {p.name}: ₹{Number(p.value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
        </p>
      ))}
    </div>
  );
};

export default function BudgetVsActualChart({ selectedMonth }) {
  const { transactions, budgetsRaw, activeGroupId, theme } = useAppContext();

  const tickColor = theme === 'dark' ? '#94a3b8' : '#64748b';

  const data = useMemo(() => {
    const groupBudgets = budgetsRaw?.[activeGroupId] ?? {};
    const monthBudgets = {
      ...(groupBudgets['default'] ?? {}),
      ...(groupBudgets[selectedMonth] ?? {}),
    };

    return Object.entries(monthBudgets)
      .filter(([, limit]) => parseFloat(limit) > 0)
      .map(([category, limit]) => {
        const spent = transactions
          .filter((t) => t.category === category && t.amount < 0 && t.date?.slice(0, 7) === selectedMonth)
          .reduce((s, t) => s + Math.abs(t.amount), 0);
        return { category, Budget: parseFloat(limit), Actual: spent };
      })
      .sort((a, b) => b.Budget - a.Budget);
  }, [transactions, budgetsRaw, activeGroupId, selectedMonth]);

  if (!data.length) {
    return (
      <div className="glass-panel rounded-2xl p-6 flex items-center justify-center h-48 text-slate-400 text-sm">
        Set category budgets to see the comparison chart.
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6">
      <div className="h-[220px] sm:h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.1)" />
            <XAxis
              dataKey="category"
              axisLine={false}
              tickLine={false}
              tick={{ fill: tickColor, fontSize: 10 }}
              interval={0}
              angle={-30}
              textAnchor="end"
              height={40}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: tickColor, fontSize: 10 }}
              dx={-4}
              tickFormatter={(v) => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`}
            />
            <Tooltip content={<TIP />} />
            <Legend wrapperStyle={{ fontSize: 11, color: tickColor, paddingTop: 8 }} />
            <Bar dataKey="Budget" name="Budget" fill="#6366F1" fillOpacity={0.35} radius={[4, 4, 0, 0]} maxBarSize={28} />
            <Bar dataKey="Actual" name="Actual" radius={[4, 4, 0, 0]} maxBarSize={28}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.Actual > entry.Budget ? '#EF4444' : '#10B981'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
