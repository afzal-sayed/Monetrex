import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Receipt, PieChart, Users, Settings, LogOut, Wallet, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { useAppContext } from '../../context/useAppContext';

const navItems = [
  { name: 'Dashboard',    path: '/dashboard',    icon: LayoutDashboard },
  { name: 'Transactions', path: '/transactions', icon: Receipt         },
  { name: 'Analytics',    path: '/analytics',    icon: PieChart        },
  { name: 'Budgets',      path: '/budgets',      icon: Target          },
  { name: 'Family',       path: '/family',       icon: Users           },
  { name: 'Settings',     path: '/settings',     icon: Settings        },
];

export const Sidebar = () => {
  const { logout, user, transactions } = useAppContext();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  // Quick net balance shown in sidebar
  const netBalance = transactions.reduce((s, t) => s + t.amount, 0);
  const isPositive = netBalance >= 0;

  return (
    <aside className="w-64 h-screen fixed left-0 top-0 border-r border-slate-200/60 dark:border-white/[0.06] glass-panel z-40 hidden md:flex flex-col justify-between">
      <div className="p-5">
        {/* Brand */}
        <div className="flex items-center gap-3 mb-8 animate-fade-up">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent-purple flex items-center justify-center glow-pulse shadow-lg">
            <Wallet className="text-white" size={19} />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Monetrex</span>
            <p className="text-xs text-slate-400 font-medium -mt-0.5">Smart Finance</p>
          </div>
        </div>

        {/* Balance chip */}
        <div className={`mb-6 flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-bold
          ${isPositive
            ? 'bg-emerald-500/8 border-emerald-500/20 text-emerald-500 dark:text-emerald-400'
            : 'bg-red-500/8 border-red-500/20 text-red-500 dark:text-red-400'
          }`}
        >
          {isPositive ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
          <span className="tabular-nums">
            {isPositive ? '+' : ''}₹{Math.abs(netBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-xs font-normal ml-auto text-slate-400">Net</span>
        </div>

        {/* Nav */}
        <nav className="space-y-1">
          {navItems.map((item, i) => (
            <NavLink
              key={item.name}
              to={item.path}
              style={{ animationDelay: `${i * 40}ms` }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 animate-slide-in-left ${
                  isActive
                    ? 'bg-primary/10 dark:bg-primary/15 text-primary shadow-[inset_3px_0_0_var(--color-primary)] font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-white/[0.05] hover:text-slate-900 dark:hover:text-white'
                }`
              }
            >
              <item.icon size={19} />
              <span className="text-sm font-medium">{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Bottom section */}
      <div className="p-5 border-t border-slate-200/60 dark:border-white/[0.06] space-y-3">
        {user && (
          <div className="flex items-center gap-3 px-2 py-1">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-9 h-9 rounded-full border-2 border-primary/30 object-cover bg-primary/10"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-primary font-bold text-sm">
                {user.name?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3.5 py-2.5 w-full rounded-xl text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400 transition-all duration-200 text-sm font-medium"
        >
          <LogOut size={17} />
          Logout
        </button>
      </div>
    </aside>
  );
};
