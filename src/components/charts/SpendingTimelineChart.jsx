import React, { useState } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppContext } from '../../context/useAppContext';
import { useSpendingTimeline } from '../../hooks/useSpendingTimeline';

const RANGES = [
  { key: 'week',   label: 'Week' },
  { key: 'month',  label: 'Month' },
  { key: '2month', label: '2M' },
  { key: '3month', label: '3M' },
];

const GRANULARITIES = [
  { key: 'day',  label: 'Day' },
  { key: 'week', label: 'Week' },
];

function formatRupee(v) {
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000)   return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${v.toLocaleString('en-IN')}`;
}

const TipContent = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900/95 border border-white/10 rounded-xl px-4 py-3 shadow-2xl text-sm">
      <p className="text-slate-400 text-xs mb-2">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="font-medium" style={{ color: p.color }}>
          {p.dataKey === 'spend' ? 'Spent' : 'Cumulative'}:{' '}
          ₹{Number(p.value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </p>
      ))}
    </div>
  );
};

export default function SpendingTimelineChart() {
  const { transactions } = useAppContext();
  const [range, setRange]               = useState('month');
  const [granularity, setGranularity]   = useState('day');
  const [periodOffset, setPeriodOffset] = useState(0);

  const { buckets, totalSpend, periodLabel, canGoBack, canGoForward } =
    useSpendingTimeline(transactions, { range, granularity, periodOffset });

  function handleRangeChange(r) {
    setRange(r);
    setPeriodOffset(0);
  }

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPeriodOffset((o) => o - 1)}
            disabled={!canGoBack}
            aria-label="Previous period"
            className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <ChevronLeft size={18} />
          </button>
          <h3 className="font-semibold text-base text-slate-900 dark:text-white min-w-[120px] text-center">
            {periodLabel}
          </h3>
          <button
            onClick={() => setPeriodOffset((o) => o + 1)}
            disabled={!canGoForward}
            aria-label="Next period"
            className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <p className="text-sm text-slate-400">
          Total:{' '}
          <span className="text-slate-900 dark:text-white font-semibold">
            {formatRupee(totalSpend)}
          </span>
        </p>
      </div>

      {/* Controls row */}
      <div className="flex flex-wrap gap-2 mb-5">
        <div className="flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/[0.07]">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => handleRangeChange(r.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all min-h-[36px] ${
                range === r.key
                  ? 'bg-primary text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/[0.07]">
          {GRANULARITIES.map((g) => (
            <button
              key={g.key}
              onClick={() => setGranularity(g.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all min-h-[36px] ${
                granularity === g.key
                  ? 'bg-primary text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      {buckets.length === 0 || totalSpend === 0 ? (
        <div className="flex items-center justify-center h-[280px] text-slate-400 text-sm">
          No expenses in this period
        </div>
      ) : (
        <div className="h-[220px] sm:h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={buckets} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.1)" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                interval="preserveStartEnd"
                height={50}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickFormatter={formatRupee}
                width={55}
                dx={-4}
              />
              <Tooltip content={<TipContent />} cursor={{ fill: 'rgba(148,163,184,0.06)' }} />
              <Legend
                wrapperStyle={{ fontSize: 11, color: '#94a3b8', paddingTop: 8 }}
                formatter={(v) => (v === 'spend' ? 'Daily Spend' : 'Cumulative')}
              />
              <Bar dataKey="spend" name="spend" fill="#6366F1" radius={[4, 4, 0, 0]} maxBarSize={32} fillOpacity={0.85} />
              <Line type="monotone" dataKey="cumulative" name="cumulative" stroke="#F59E0B" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#F59E0B' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
