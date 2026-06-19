import React, { useState } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../../context/useAppContext';
import { useSpendingTimeline } from '../../hooks/useSpendingTimeline';

function formatRupee(v) {
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000)   return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${v.toLocaleString('en-IN')}`;
}

const TipContent = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900/95 border border-white/10 rounded-xl px-3 py-2 shadow-2xl text-xs">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.dataKey === 'spend' ? 'Spent' : 'Total'}:{' '}
          ₹{Number(p.value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </p>
      ))}
    </div>
  );
};

export default function SpendingTimelineWidget() {
  const { transactions } = useAppContext();
  const [periodOffset, setPeriodOffset] = useState(0);

  const { buckets, totalSpend, periodLabel, canGoBack, canGoForward } =
    useSpendingTimeline(transactions, { range: 'month', granularity: 'day', periodOffset });

  return (
    <div className="glass-panel rounded-2xl p-5 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPeriodOffset((o) => o - 1)}
            disabled={!canGoBack}
            aria-label="Previous month"
            className="p-1 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
          >
            <ChevronLeft size={15} />
          </button>
          <span className="text-sm font-semibold text-slate-900 dark:text-white min-w-[90px] text-center">
            {periodLabel}
          </span>
          <button
            onClick={() => setPeriodOffset((o) => o + 1)}
            disabled={!canGoForward}
            aria-label="Next month"
            className="p-1 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
          >
            <ChevronRight size={15} />
          </button>
        </div>
        <span className="text-xs text-slate-400">
          <span className="text-slate-900 dark:text-white font-semibold text-sm">
            {formatRupee(totalSpend)}
          </span>
        </span>
      </div>

      {/* Chart */}
      <div className="h-[160px] sm:h-[180px]">
        {buckets.length === 0 || totalSpend === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-xs">
            No expenses this month
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={buckets} margin={{ top: 2, right: 4, left: -28, bottom: 0 }}>
              <XAxis dataKey="label" hide />
              <YAxis hide />
              <Tooltip content={<TipContent />} cursor={{ fill: 'rgba(148,163,184,0.06)' }} />
              <Bar dataKey="spend" name="spend" fill="#6366F1" radius={[3, 3, 0, 0]} maxBarSize={18} fillOpacity={0.85} />
              <Line type="monotone" dataKey="cumulative" name="cumulative" stroke="#F59E0B" strokeWidth={1.5} dot={false} activeDot={{ r: 3, fill: '#F59E0B' }} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer */}
      <div className="text-right">
        <Link to="/analytics" className="text-xs text-primary hover:underline transition-colors">
          View full chart →
        </Link>
      </div>
    </div>
  );
}
