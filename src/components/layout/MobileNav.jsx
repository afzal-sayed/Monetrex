import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, PieChart, Users, Settings, LogOut } from 'lucide-react';
import { useAppContext } from '../../context/useAppContext';

const NAV = [
  { name: 'Home',         path: '/dashboard',    icon: LayoutDashboard },
  { name: 'Transactions', path: '/transactions', icon: Receipt         },
  { name: 'Analytics',    path: '/analytics',    icon: PieChart        },
  { name: 'Family',       path: '/family',       icon: Users           },
  { name: 'Settings',     path: '/settings',     icon: Settings        },
];

export const MobileNav = () => {
  const { logout } = useAppContext();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden glass-panel border-t border-slate-200/60 dark:border-white/8">
      <div className="flex">
        {NAV.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors ${
                isActive
                  ? 'text-primary'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`p-1.5 rounded-lg transition-colors ${isActive ? 'bg-primary/10' : ''}`}>
                  <item.icon size={20} />
                </span>
                {item.name === 'Transactions' ? 'Txns' : item.name}
              </>
            )}
          </NavLink>
        ))}

        <button
          onClick={logout}
          aria-label="Logout"
          className="flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
        >
          <span className="p-1.5 rounded-lg">
            <LogOut size={20} />
          </span>
          Logout
        </button>
      </div>
    </nav>
  );
};
