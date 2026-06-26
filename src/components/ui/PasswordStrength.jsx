import { Check, X } from 'lucide-react';
import { PASSWORD_RULES } from '../../utils/passwordRules';

const STRENGTH_COLORS = ['bg-red-400', 'bg-amber-400', 'bg-amber-400', 'bg-emerald-500'];
const STRENGTH_LABELS = ['Weak', 'Fair', 'Good', 'Strong'];

export const PasswordStrength = ({ password }) => {
  if (!password) return null;

  const passedCount = PASSWORD_RULES.filter(r => r.test(password)).length;
  const colorClass  = STRENGTH_COLORS[passedCount - 1] || 'bg-slate-200 dark:bg-white/10';
  const label       = STRENGTH_LABELS[passedCount - 1] || '';

  return (
    <div className="space-y-2 animate-fade-up">
      {/* Strength bar */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1 flex-1">
          {PASSWORD_RULES.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                i < passedCount ? colorClass : 'bg-slate-200 dark:bg-white/10'
              }`}
            />
          ))}
        </div>
        {label && (
          <span className={`text-xs font-medium transition-colors duration-300 ${
            passedCount === 4 ? 'text-emerald-500' :
            passedCount >= 2  ? 'text-amber-500'   : 'text-red-400'
          }`}>
            {label}
          </span>
        )}
      </div>

      {/* Requirements checklist */}
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
        {PASSWORD_RULES.map((rule) => {
          const met = rule.test(password);
          return (
            <li key={rule.key} className={`flex items-center gap-1.5 text-xs transition-colors duration-200 ${
              met ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
            }`}>
              {met
                ? <Check size={11} strokeWidth={3} />
                : <X     size={11} strokeWidth={3} />
              }
              {rule.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
};
