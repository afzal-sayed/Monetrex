import React from 'react';
import { cn } from '../../utils/cn';

export const Input = React.forwardRef(({ className, label, icon: Icon, error, ...props }, ref) => {
  return (
    <div className="relative w-full flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">
          {label}
        </label>
      )}
      <div className="relative group">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
            <Icon size={18} />
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            "flex h-11 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/40 px-4 py-2 text-sm text-slate-900 dark:text-white transition-all duration-300",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium",
            "placeholder:text-slate-400 dark:placeholder:text-gray-500",
            "focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary/50 focus-visible:bg-white dark:focus-visible:bg-slate-900/80 shadow-sm",
            "disabled:cursor-not-allowed disabled:opacity-50",
            Icon && "pl-10",
            error && "border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500",
            className
          )}
          {...props}
        />
        {/* Animated bottom gradient border effect on focus */}
        <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-linear-to-r from-primary to-accent-purple transition-all duration-300 group-focus-within:w-full rounded-b-xl opacity-70"></div>
      </div>
      {error && (
        <p className="text-xs text-red-500 ml-1 animate-fade-up">{error}</p>
      )}
    </div>
  );
});
Input.displayName = "Input";
