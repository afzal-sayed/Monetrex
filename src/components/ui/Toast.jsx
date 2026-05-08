import React from 'react';
import { CheckCircle2, XCircle, Info, AlertTriangle } from 'lucide-react';

const VARIANTS = {
  success: {
    bg:   'bg-slate-900/95 dark:bg-slate-900/95 border-emerald-500/40',
    icon: <CheckCircle2 size={17} className="text-emerald-400 shrink-0" />,
    bar:  'bg-emerald-400',
  },
  error: {
    bg:   'bg-slate-900/95 dark:bg-slate-900/95 border-red-500/40',
    icon: <XCircle size={17} className="text-red-400 shrink-0" />,
    bar:  'bg-red-400',
  },
  info: {
    bg:   'bg-slate-900/95 dark:bg-slate-900/95 border-blue-500/40',
    icon: <Info size={17} className="text-blue-400 shrink-0" />,
    bar:  'bg-blue-400',
  },
  warning: {
    bg:   'bg-slate-900/95 dark:bg-slate-900/95 border-amber-500/40',
    icon: <AlertTriangle size={17} className="text-amber-400 shrink-0" />,
    bar:  'bg-amber-400',
  },
};

export const Toast = ({ toasts = [] }) => {
  if (!toasts.length) return null;

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none">
      {toasts.map((toast) => {
        const v = VARIANTS[toast.type] || VARIANTS.success;
        return (
          <div
            key={toast.id}
            className={`min-w-64 max-w-sm rounded-xl border shadow-2xl backdrop-blur-xl overflow-hidden toast-enter ${v.bg}`}
          >
            <div className="flex items-center gap-3 px-4 py-3">
              {v.icon}
              <span className="text-sm font-medium text-white">{toast.message}</span>
            </div>
            <div className={`h-0.5 ${v.bar}`} style={{ animation: 'shrink 3.5s linear forwards', transformOrigin: 'left' }} />
          </div>
        );
      })}
    </div>
  );
};
