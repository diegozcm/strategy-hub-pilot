import React, { useState } from 'react';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { PanelLeftClose, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAtlasChat } from '@/hooks/useAtlasChat';
import { AtlasSidebar } from './atlas/AtlasSidebar';
import { AtlasChatArea } from './atlas/AtlasChatArea';

export const AtlasHubPage: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const chat = useAtlasChat();

  return (
    <div className="h-full -m-4 lg:-m-6 flex flex-col">
      <PanelGroup direction="horizontal" className="flex-1">
        {/* Sidebar Panel */}
        {!sidebarCollapsed && (
          <>
            <Panel defaultSize={22} minSize={15} maxSize={35} className="relative">
              <AtlasSidebar
                sessions={chat.sessions}
                loadingSessions={chat.loadingSessions}
                currentSessionId={chat.sessionId}
                onNewConversation={chat.startNewConversation}
                onLoadSession={chat.loadSession}
                onDeleteSession={chat.deleteSession}
                onFetchSessions={chat.fetchSessions}
                onShowInsights={() => navigate('/app/ai-copilot')}
              />
            </Panel>
            <PanelResizeHandle className="w-px bg-border hover:bg-primary/30 transition-colors" />
          </>
        )}

        {/* Chat Panel */}
        <Panel defaultSize={sidebarCollapsed ? 100 : 78}>
          <div className="flex flex-col h-full">
            {/* Mini header with sidebar toggle */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-card">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              >
                {sidebarCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              </Button>
              <span className="text-sm font-medium text-foreground">Atlas Hub</span>
            </div>

            {/* Chat area */}
            <AtlasChatArea
              messages={chat.messages}
              isLoading={chat.isLoading}
              isStreaming={chat.isStreaming}
              isExecuting={chat.isExecuting}
              chatInput={chat.chatInput}
              onInputChange={chat.setChatInput}
              onSend={() => chat.handleSendMessage()}
              onPaste={chat.handlePaste}
              isPlanMode={chat.isPlanMode}
              onTogglePlan={() => chat.setIsPlanMode(prev => !prev)}
              isRecording={chat.isRecording}
              isTranscribing={chat.isTranscribing}
              recordingTime={chat.recordingTime}
              onToggleRecording={chat.toggleRecording}
              pastedImages={chat.pastedImages}
              onRemoveImage={chat.removePastedImage}
              textareaRef={chat.textareaRef as React.RefObject<HTMLTextAreaElement>}
              copiedIndex={chat.copiedIndex}
              onExecutePlan={chat.handleExecutePlan}
              onRejectPlan={chat.handleRejectPlan}
              onCopy={chat.handleCopyMessage}
              onRetry={chat.handleRetry}
              onFeedback={chat.handleFeedback}
              quickActions={chat.quickActions}
              onQuickAction={(prompt) => chat.handleSendMessage(prompt)}
            />
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
};
