import React from 'react';
import { CalendarDays } from 'lucide-react';
import { Input } from '../ui/Input';
import { FREQUENCY_OPTIONS } from '../../utils/recurring';

export const RecurringFields = ({ frequency, endDate, onChange }) => (
  <div className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
    <div className="flex flex-col gap-1.5">
      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Repeats</p>
      <div className="flex flex-wrap gap-1.5">
        {FREQUENCY_OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange('frequency', o.value)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              frequency === o.value
                ? 'bg-primary text-white shadow-md shadow-primary/25'
                : 'bg-slate-100 dark:bg-white/[0.07] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/[0.12]'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
    <Input
      label="Ends on (optional)" icon={CalendarDays}
      type="date"
      value={endDate}
      onChange={(e) => onChange('endDate', e.target.value)}
    />
  </div>
);
