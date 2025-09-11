
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { DashboardHeader } from './DashboardHeader';
import { Sidebar } from './Sidebar';
import { ImpersonationBanner } from '@/components/ui/ImpersonationBanner';
import { useIsMobile } from '@/hooks/use-mobile';

export const AppLayout: React.FC = () => {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <ImpersonationBanner />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={closeSidebar} 
        />
        <div className="flex-1 flex flex-col min-w-0">
          <DashboardHeader onToggleSidebar={toggleSidebar} />
          <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-background">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
