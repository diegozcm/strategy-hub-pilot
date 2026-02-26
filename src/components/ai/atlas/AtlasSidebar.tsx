import React, { useEffect } from 'react';
import { Plus, Trash2, Lightbulb, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ChatSession } from '@/hooks/useAtlasChat';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AtlasSidebarProps {
  sessions: ChatSession[];
  loadingSessions: boolean;
  currentSessionId: string | null;
  onNewConversation: () => void;
  onLoadSession: (session: ChatSession) => void;
  onDeleteSession: (id: string) => void;
  onFetchSessions: () => void;
  onShowInsights: () => void;
  collapsed?: boolean;
}

export const AtlasSidebar: React.FC<AtlasSidebarProps> = ({
  sessions, loadingSessions, currentSessionId,
  onNewConversation, onLoadSession, onDeleteSession, onFetchSessions,
  onShowInsights, collapsed = false,
}) => {
  useEffect(() => {
    onFetchSessions();
  }, [onFetchSessions]);

  if (collapsed) return null;

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: '#0A1C2E', borderRight: '1px solid rgba(56, 182, 255, 0.08)' }}>
      {/* Header */}
      <div className="p-3 space-y-2" style={{ borderBottom: '1px solid rgba(56, 182, 255, 0.08)' }}>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 border-[hsl(var(--cofound-blue-light))]/30 text-[hsl(var(--cofound-blue-light))] hover:bg-[hsl(var(--cofound-blue-light))]/10 bg-transparent"
          onClick={onNewConversation}
        >
          <Plus className="h-4 w-4" />
          Nova conversa
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 hover:bg-white/5"
          style={{ color: '#CDD966' }}
          onClick={onShowInsights}
        >
          <Lightbulb className="h-4 w-4" />
          Insights
        </Button>
      </div>

      {/* Sessions list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {loadingSessions ? (
            <div className="flex justify-center py-8"><LoadingSpinner size="sm" /></div>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-center py-8 text-white/30">Nenhuma conversa anterior</p>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={cn(
                  "p-2.5 rounded-lg cursor-pointer transition-colors group flex items-start justify-between gap-1",
                  session.id === currentSessionId
                    ? "border-l-2"
                    : "hover:bg-white/5"
                )}
                style={session.id === currentSessionId
                  ? { backgroundColor: 'rgba(205, 217, 102, 0.1)', borderColor: '#CDD966' }
                  : {}
                }
                onClick={() => onLoadSession(session)}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5 shrink-0 text-white/30" />
                    <p className="text-sm font-medium truncate text-white/80">{session.session_title || 'Sem título'}</p>
                  </div>
                  <p className="text-xs text-white/30 mt-0.5 pl-5">
                    {format(new Date(session.created_at), "dd MMM, HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <button
                  className="h-6 w-6 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity shrink-0 hover:bg-red-500/10"
                  onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-400" />
                </button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
