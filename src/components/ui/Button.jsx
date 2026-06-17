import React from 'react';
import { cn } from '../../utils/cn';

export const Button = React.forwardRef(({ className, variant = 'primary', size = 'default', children, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-300 ease-out focus:outline-hidden focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-95 cursor-pointer",
        
        {
          /* Primary: Gradient background with inner glow and outer hover glow */
          "bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_24px_rgba(124,58,237,0.5)] border border-white/10 hover:-translate-y-0.5": variant === 'primary',
          
          /* Secondary: Neon Emerald style */
          "bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30 hover:bg-[#10B981]/20 hover:border-[#10B981]/60 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:-translate-y-0.5": variant === 'secondary',
          
          /* Glass: Translucent blur */
          "glass-panel text-slate-800 dark:text-white bg-white/80 dark:bg-slate-800/40 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:-translate-y-0.5 hover:shadow-lg": variant === 'glass',
          
          /* Ghost: Subtle text button that lights up on hover */
          "text-slate-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary hover:bg-primary/5": variant === 'ghost',
        },
        {
          "h-10 px-4 py-2 text-sm": size === 'default',
          "h-9 px-3 text-xs": size === 'sm',
          "h-12 px-8 text-base": size === 'lg',
          "h-10 w-10 p-2": size === 'icon',
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});
Button.displayName = "Button";
