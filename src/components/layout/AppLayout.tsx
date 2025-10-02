
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { DashboardHeader } from './DashboardHeader';
import { Sidebar } from './Sidebar';
import { ImpersonationBanner } from '@/components/ui/ImpersonationBanner';
import { FloatingAIButton } from '@/components/ai/FloatingAIButton';
import { FloatingAIChat } from '@/components/ai/FloatingAIChat';
import { useFloatingAI } from '@/hooks/useFloatingAI';
import { useIsMobile } from '@/hooks/use-mobile';

export const AppLayout: React.FC = () => {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const floatingAI = useFloatingAI();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  // Debug logs
  console.log('🤖 AppLayout - isMobile:', isMobile, 'window.innerWidth:', window.innerWidth);

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

      {/* Floating AI Copilot - Desktop Only */}
      {!isMobile && (
        <>
          {!floatingAI.isOpen && (
            <FloatingAIButton
              onClick={floatingAI.openChat}
              unreadCount={floatingAI.unreadCount}
            />
          )}
          <FloatingAIChat
            isOpen={floatingAI.isOpen}
            isMinimized={floatingAI.isMinimized}
            position={floatingAI.position}
            messages={floatingAI.messages}
            onClose={floatingAI.closeChat}
            onMinimize={floatingAI.toggleMinimize}
            onPositionChange={floatingAI.updatePosition}
            onMessagesChange={floatingAI.setMessages}
          />
        </>
      )}
    </div>
  );
};
