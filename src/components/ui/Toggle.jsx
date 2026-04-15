import React from 'react';
import { cn } from '../../utils/cn';

export const Toggle = React.forwardRef(({ checked, onChange, disabled, className, ...props }, ref) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      ref={ref}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-primary focus:ring-offset-2",
        checked ? "bg-primary shadow-[0_0_12px_rgba(79,70,229,0.5)]" : "bg-gray-200 dark:bg-slate-700",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
});
Toggle.displayName = "Toggle";
