import React from 'react';

export function SpendingTimelineTip({ active, payload, label, cumulativeLabel = 'Cumulative' }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900/95 border border-white/10 rounded-xl px-4 py-3 shadow-2xl text-sm">
      <p className="text-slate-400 text-xs mb-2">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="font-medium" style={{ color: p.color }}>
          {p.dataKey === 'spend' ? 'Spent' : cumulativeLabel}:{' '}
          ₹{Number(p.value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </p>
      ))}
    </div>
  );
}
