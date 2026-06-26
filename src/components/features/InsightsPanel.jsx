import React from 'react';
import { TrendingUp, TrendingDown, Tag, Target, PiggyBank, Sparkles } from 'lucide-react';
import { useAppContext } from '../../context/useAppContext';
import { computeInsights } from '../../utils/helpers';

const ICONS = { TrendingUp, TrendingDown, Tag, Target, PiggyBank };

const TYPE_STYLES = {
  positive: {
    bg:     'bg-emerald-500/10 dark:bg-emerald-500/10',
    border: 'border-emerald-500/20',
    icon:   'text-emerald-400',
    title:  'text-emerald-500 dark:text-emerald-400',
  },
  warning: {
    bg:     'bg-amber-500/10',
    border: 'border-amber-500/20',
    icon:   'text-amber-400',
    title:  'text-amber-500 dark:text-amber-400',
  },
  neutral: {
    bg:     'bg-blue-500/10',
    border: 'border-blue-500/20',
    icon:   'text-blue-400',
    title:  'text-blue-500 dark:text-blue-400',
  },
  info: {
    bg:     'bg-primary/10',
    border: 'border-primary/20',
    icon:   'text-primary',
    title:  'text-primary',
  },
};

export const InsightsPanel = () => {
  const { transactions, budgets, budgetTypes } = useAppContext();
  const insights = computeInsights(transactions, budgets, budgetTypes);

  if (insights.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles size={16} className="text-primary" />
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Smart Insights
        </h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {insights.map((insight, i) => {
          const styles = TYPE_STYLES[insight.type] || TYPE_STYLES.info;
          const Icon = ICONS[insight.icon] || Sparkles;
          return (
            <div
              key={i}
              className={`rounded-xl border p-3 ${styles.bg} ${styles.border} animate-fade-up`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon size={14} className={styles.icon} />
                <span className={`text-xs font-bold ${styles.title}`}>{insight.title}</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{insight.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
