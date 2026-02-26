import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AnimatePresence, motion } from 'motion/react';
import { AtlasMessageBubble } from './AtlasMessageBubble';
import { AtlasWelcome } from './AtlasWelcome';
import { AtlasInputBar } from './AtlasInputBar';
import { ChatMessage } from '@/hooks/useAtlasChat';
import { AtlasOrb } from './AtlasOrb';

interface AtlasChatAreaProps {
  messages: ChatMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  isExecuting: boolean;
  chatInput: string;
  onInputChange: (v: string) => void;
  onSend: () => void;
  onPaste: (e: React.ClipboardEvent) => void;
  isPlanMode: boolean;
  onTogglePlan: () => void;
  isRecording: boolean;
  isTranscribing: boolean;
  recordingTime: number;
  onToggleRecording: () => void;
  pastedImages: string[];
  onRemoveImage: (idx: number) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  copiedIndex: number | null;
  onExecutePlan: (plan: any, index: number) => void;
  onRejectPlan: (index: number) => void;
  onCopy: (content: string, index: number) => void;
  onRetry: (index: number) => void;
  onFeedback: (type: 'positive' | 'negative', content: string) => void;
  quickActions: { label: string; prompt: string; icon: string }[];
  onQuickAction: (prompt: string) => void;
}

const TypingIndicator = ({ text = 'digitando' }: { text?: string }) => (
  <div className="flex justify-start gap-2.5">
    <div className="mt-1 shrink-0">
      <AtlasOrb size={28} />
    </div>
    <div className="rounded-lg px-4 py-3 flex items-center gap-1.5 bg-muted">
      <div className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-[hsl(var(--cofound-blue-light))] animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 rounded-full bg-[hsl(var(--cofound-blue-light))] animate-bounce" style={{ animationDelay: '200ms' }} />
        <span className="w-2 h-2 rounded-full bg-[hsl(var(--cofound-blue-light))] animate-bounce" style={{ animationDelay: '400ms' }} />
      </div>
      <span className="text-xs ml-1.5 text-muted-foreground">{text}</span>
    </div>
  </div>
);

export const AtlasChatArea: React.FC<AtlasChatAreaProps> = ({
  messages, isLoading, isStreaming, isExecuting,
  chatInput, onInputChange, onSend, onPaste,
  isPlanMode, onTogglePlan,
  isRecording, isTranscribing, recordingTime, onToggleRecording,
  pastedImages, onRemoveImage, textareaRef,
  copiedIndex, onExecutePlan, onRejectPlan, onCopy, onRetry, onFeedback,
  quickActions, onQuickAction,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const prevCountRef = useRef(messages.length);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, []);

  useEffect(() => {
    if (messages.length > prevCountRef.current) scrollToBottom();
    prevCountRef.current = messages.length;
  }, [messages.length, scrollToBottom]);

  useEffect(() => {
    if (isLoading || isStreaming || isExecuting) scrollToBottom();
  }, [isLoading, isStreaming, isExecuting, scrollToBottom]);

  const statusText = isExecuting ? 'executando' : (isLoading ? 'planejando' : 'digitando');
  const showIndicator = isLoading || isStreaming || isExecuting;

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {messages.length === 0 && !isLoading ? (
        <AtlasWelcome onQuickAction={onQuickAction} quickActions={quickActions} />
      ) : (
        <div className="flex-1 min-h-0 relative">
          <ScrollArea className="h-full" onScrollCapture={(e: any) => {
            const viewport = e.target;
            if (viewport?.hasAttribute?.('data-radix-scroll-area-viewport')) {
              const { scrollTop, clientHeight, scrollHeight } = viewport;
              setShowScrollBtn(scrollTop + clientHeight < scrollHeight - 100);
            }
          }}>
            <div className="space-y-4 p-4 max-w-3xl mx-auto">
              {messages.map((msg, index) => (
                <AtlasMessageBubble
                  key={index}
                  msg={msg}
                  index={index}
                  copiedIndex={copiedIndex}
                  onExecutePlan={onExecutePlan}
                  onRejectPlan={onRejectPlan}
                  onCopy={onCopy}
                  onRetry={onRetry}
                  onFeedback={onFeedback}
                />
              ))}
              {showIndicator && <TypingIndicator text={statusText} />}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <AnimatePresence>
            {showScrollBtn && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute bottom-2 left-1/2 -translate-x-1/2 h-8 w-8 rounded-full flex items-center justify-center shadow-lg z-10 bg-card border border-border"
                onClick={() => { scrollToBottom(); setShowScrollBtn(false); }}
              >
                <ChevronDown className="h-4 w-4 text-foreground" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      )}

      <AtlasInputBar
        chatInput={chatInput}
        onInputChange={onInputChange}
        onSend={onSend}
        onPaste={onPaste}
        isPlanMode={isPlanMode}
        onTogglePlan={onTogglePlan}
        isRecording={isRecording}
        isTranscribing={isTranscribing}
        recordingTime={recordingTime}
        onToggleRecording={onToggleRecording}
        isDisabled={isLoading || isStreaming || isExecuting}
        pastedImages={pastedImages}
        onRemoveImage={onRemoveImage}
        textareaRef={textareaRef}
      />
    </div>
  );
};
