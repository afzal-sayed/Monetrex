import React from 'react';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { MobileFAB } from './MobileFAB';
import { Outlet } from 'react-router-dom';

export const DashboardLayout = () => (
  <div className="flex relative min-h-screen grid-bg overflow-x-hidden">
    <Sidebar />
    <main className="flex-1 min-w-0 md:ml-64 min-h-screen pt-14 md:pt-0 pb-6 md:pb-8">
      <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 overflow-x-hidden">
        <Outlet />
      </div>
    </main>
    <MobileNav />
    <MobileFAB />
  </div>
);
