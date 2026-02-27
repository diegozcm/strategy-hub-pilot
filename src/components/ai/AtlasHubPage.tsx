import React, { useState, useCallback } from 'react';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { useAtlasChat } from '@/hooks/useAtlasChat';
import { AtlasSidebar } from './atlas/AtlasSidebar';
import { AtlasChatArea } from './atlas/AtlasChatArea';
import { AtlasInsightsPanel } from './atlas/AtlasInsightsPanel';
import { AnimatePresence, motion } from 'motion/react';

export const AtlasHubPage: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<'chat' | 'insights'>('chat');
  const chat = useAtlasChat();

  const handleShowInsights = useCallback(() => {
    setViewMode('insights');
  }, []);

  const handleBackToChat = useCallback((message?: string) => {
    setViewMode('chat');
    if (message) {
      chat.setChatInput(message);
    }
  }, [chat]);

  const handleNewConversation = useCallback(() => {
    chat.startNewConversation();
    setViewMode('chat');
  }, [chat]);

  const handleLoadSession = useCallback((session: any) => {
    chat.loadSession(session);
    setViewMode('chat');
  }, [chat]);

  return (
    <div className="h-full w-full flex flex-col bg-background">
      <PanelGroup direction="horizontal" className="flex-1">
        {/* Sidebar Panel */}
        {!sidebarCollapsed && (
          <>
            <Panel defaultSize={22} minSize={15} maxSize={35} className="relative">
              <AtlasSidebar
                sessions={chat.sessions}
                loadingSessions={chat.loadingSessions}
                currentSessionId={chat.sessionId}
                onNewConversation={handleNewConversation}
                onLoadSession={handleLoadSession}
                onDeleteSession={chat.deleteSession}
                onFetchSessions={chat.fetchSessions}
                onShowInsights={handleShowInsights}
                isInsightsActive={viewMode === 'insights'}
              />
            </Panel>
            <PanelResizeHandle className="w-px bg-border hover:bg-[hsl(var(--cofound-blue-light))]/30 transition-colors" />
          </>
        )}

        {/* Main Panel */}
        <Panel defaultSize={sidebarCollapsed ? 100 : 78}>
          <AnimatePresence mode="wait">
            {viewMode === 'insights' ? (
              <motion.div
                key="insights"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <AtlasInsightsPanel onSwitchToChat={handleBackToChat} />
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="h-full flex flex-col"
              >
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
              </motion.div>
            )}
          </AnimatePresence>
        </Panel>
      </PanelGroup>
    </div>
  );
};
