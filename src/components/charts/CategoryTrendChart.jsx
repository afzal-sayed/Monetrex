import React, { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { useAppContext } from '../../context/useAppContext';
import { computeCategoryMonthlyData, CATEGORY_COLORS } from '../../utils/helpers';

const FALLBACK_COLORS = ['#6366F1','#10B981','#F59E0B','#EF4444','#8B5CF6','#06B6D4'];

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

export default function CategoryTrendChart({ months = 6 }) {
  const { transactions, theme, customCategories } = useAppContext();

  const customColorMap = useMemo(() => {
    const m = {};
    (customCategories || []).forEach((c) => { m[c.name] = c.color; });
    return m;
  }, [customCategories]);

  const data = useMemo(
    () => computeCategoryMonthlyData(transactions, months),
    [transactions, months]
  );

  const categories = useMemo(() => {
    if (!data.length) return [];
    return Object.keys(data[0]).filter((k) => k !== 'name' && k !== 'key');
  }, [data]);

  const tickColor = theme === 'dark' ? '#94a3b8' : '#64748b';

  if (!categories.length) {
    return (
      <div className="glass-panel rounded-2xl p-6 flex items-center justify-center h-64 text-slate-400 text-sm">
        Add expense transactions to see category trends.
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6">
      <div className="h-[240px] sm:h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.1)" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: tickColor, fontSize: 11 }} dy={8} />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: tickColor, fontSize: 11 }}
              dx={-8}
              tickFormatter={(v) => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`}
            />
            <Tooltip content={<TIP />} />
            <Legend wrapperStyle={{ fontSize: 11, color: tickColor, paddingTop: 8 }} />
            {categories.map((cat, i) => (
              <Line
                key={cat}
                type="monotone"
                dataKey={cat}
                name={cat}
                stroke={CATEGORY_COLORS[cat] || customColorMap[cat] || FALLBACK_COLORS[i % FALLBACK_COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
