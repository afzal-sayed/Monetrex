import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Receipt, PieChart, Users, Settings,
  LogOut, Target, Menu, X, Wallet, TrendingUp, TrendingDown,
} from 'lucide-react';
import { useAppContext } from '../../context/useAppContext';

const NAV = [
  { name: 'Dashboard',    path: '/dashboard',    icon: LayoutDashboard },
  { name: 'Transactions', path: '/transactions', icon: Receipt         },
  { name: 'Analytics',    path: '/analytics',    icon: PieChart        },
  { name: 'Budgets',      path: '/budgets',      icon: Target          },
  { name: 'Family',       path: '/family',       icon: Users           },
  { name: 'Settings',     path: '/settings',     icon: Settings        },
];

export const MobileNav = () => {
  const { logout, user, transactions } = useAppContext();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  const handleLogout = () => {
    close();
    logout();
    navigate('/auth');
  };

  const netBalance = transactions.reduce((s, t) => s + t.amount, 0);
  const isPositive = netBalance >= 0;

  return (
    <>
      {/* ── Fixed top header bar (mobile only) ── */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 flex items-center justify-between px-4 h-14 glass-panel border-b border-slate-200/60 dark:border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent-purple flex items-center justify-center shadow-md">
            <Wallet className="text-white" size={15} />
          </div>
          <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">Monetrex</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          aria-label="Open navigation menu"
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.07] transition-colors"
        >
          <Menu size={22} />
        </button>
      </header>

      {/* ── Backdrop ── */}
      <div
        aria-hidden="true"
        onClick={close}
        className={`md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* ── Slide-in drawer ── */}
      <aside
        className={`md:hidden fixed inset-y-0 right-0 z-50 w-72 glass-panel border-l border-slate-200/60 dark:border-white/[0.07] flex flex-col transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 h-14 border-b border-slate-200/60 dark:border-white/[0.06] shrink-0">
          <span className="font-bold text-slate-900 dark:text-white text-sm tracking-wide">Navigation</span>
          <button
            onClick={close}
            aria-label="Close navigation menu"
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.07] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* User info + balance */}
        {user && (
          <div className="px-5 py-4 border-b border-slate-200/60 dark:border-white/[0.06] shrink-0 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                {user.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user.name}</p>
                <p className="text-xs text-slate-400 truncate">{user.email}</p>
              </div>
            </div>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold ${
              isPositive
                ? 'bg-emerald-500/8 border-emerald-500/20 text-emerald-500 dark:text-emerald-400'
                : 'bg-red-500/8 border-red-500/20 text-red-500 dark:text-red-400'
            }`}>
              {isPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              <span className="tabular-nums">
                {isPositive ? '+' : ''}₹{Math.abs(netBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <span className="font-normal ml-auto text-slate-400">Net</span>
            </div>
          </div>
        )}

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={close}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-200 ${
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

        {/* Logout */}
        <div className="px-3 py-4 border-t border-slate-200/60 dark:border-white/[0.06] shrink-0">
          <button
            onClick={handleLogout}
            aria-label="Logout"
            className="flex items-center gap-3 px-3.5 py-3 w-full rounded-xl text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400 transition-all duration-200 text-sm font-medium"
          >
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};
