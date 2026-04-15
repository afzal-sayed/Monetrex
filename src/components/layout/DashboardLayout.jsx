import React from 'react';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { Outlet } from 'react-router-dom';

export const DashboardLayout = () => (
  <div className="flex relative min-h-screen grid-bg">
    <Sidebar />
    <main className="flex-1 md:ml-64 min-h-screen pb-20 md:pb-8">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <Outlet />
      </div>
    </main>
    <MobileNav />
  </div>
);
