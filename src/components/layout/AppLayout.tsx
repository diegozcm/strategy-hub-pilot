
import React from 'react';
import { Outlet } from 'react-router-dom';
import { DashboardHeader } from './DashboardHeader';
import { Sidebar } from './Sidebar';
import { ImpersonationBanner } from '@/components/ui/ImpersonationBanner';

export const AppLayout: React.FC = () => {
  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <ImpersonationBanner />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <DashboardHeader />
          <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-background">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
