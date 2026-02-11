import React, { useState, useRef, useEffect } from 'react';
import { X, Minus, Send, Sparkles, TrendingUp, AlertCircle, Lightbulb, History, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatSession {
  id: string;
  session_title: string | null;
  created_at: string;
  updated_at: string | null;
}

interface FloatingAIChatProps {
  isOpen: boolean;
  isMinimized: boolean;
  position: { x: number; y: number };
  messages: ChatMessage[];
  onClose: () => void;
  onMinimize: () => void;
  onPositionChange: (position: { x: number; y: number }) => void;
  onMessagesChange: (messages: ChatMessage[]) => void;
}

export const FloatingAIChat: React.FC<FloatingAIChatProps> = ({
  isOpen,
  isMinimized,
  position,
  messages,
  onClose,
  onMinimize,
  onPositionChange,
  onMessagesChange
}) => {
  const { user, company } = useAuth();
  const [chatInput, setChatInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const quickActions = [
    { icon: TrendingUp, label: 'Análise de Performance', prompt: 'Me dê uma análise da performance atual' },
    { icon: AlertCircle, label: 'Pontos de Atenção', prompt: 'Quais são os principais pontos de atenção?' },
    { icon: Lightbulb, label: 'Sugestões', prompt: 'Me dê sugestões de melhorias' },
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.drag-handle')) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        onPositionChange({
          x: Math.max(0, Math.min(window.innerWidth - 400, e.clientX - dragOffset.x)),
          y: Math.max(0, Math.min(window.innerHeight - 600, e.clientY - dragOffset.y))
        });
      }
    };
    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, onPositionChange]);

  const fetchSessions = async () => {
    if (!user || !company?.id) return;
    setLoadingSessions(true);
    try {
      const { data, error } = await supabase
        .from('ai_chat_sessions')
        .select('id, session_title, created_at, updated_at')
        .eq('user_id', user.id)
        .eq('company_id', company.id)
        .order('updated_at', { ascending: false })
        .limit(30);

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoadingSessions(false);
    }
  };

  const loadSession = async (session: ChatSession) => {
    try {
      const { data, error } = await supabase
        .from('ai_chat_messages')
        .select('role, content, created_at')
        .eq('session_id', session.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const loadedMessages: ChatMessage[] = (data || []).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: new Date(m.created_at || Date.now()),
      }));

      onMessagesChange(loadedMessages);
      setSessionId(session.id);
      setShowHistory(false);
    } catch (error) {
      console.error('Error loading session:', error);
      toast({ title: 'Erro ao carregar conversa', variant: 'destructive' });
    }
  };

  const deleteSession = async (sessionIdToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      // Delete messages first, then session
      await supabase.from('ai_chat_messages').delete().eq('session_id', sessionIdToDelete);
      await supabase.from('ai_chat_sessions').delete().eq('id', sessionIdToDelete);

      setSessions(prev => prev.filter(s => s.id !== sessionIdToDelete));

      // If deleting the active session, reset
      if (sessionIdToDelete === sessionId) {
        setSessionId(null);
        onMessagesChange([]);
      }

      toast({ title: 'Conversa excluída' });
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({ title: 'Erro ao excluir conversa', variant: 'destructive' });
    }
  };

  const startNewConversation = () => {
    setSessionId(null);
    onMessagesChange([]);
    setShowHistory(false);
  };

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || chatInput.trim();
    if (!textToSend || isLoading || !user || !company?.id) return;

    const userMessage: ChatMessage = { role: 'user', content: textToSend, timestamp: new Date() };
    onMessagesChange([...messages, userMessage]);
    setChatInput('');
    setIsLoading(true);

    try {
      let currentSessionId = sessionId;
      if (!currentSessionId) {
        const { data: newSession, error: sessionError } = await supabase
          .from('ai_chat_sessions')
          .insert([{ user_id: user.id, company_id: company.id, session_title: textToSend.substring(0, 60) }])
          .select()
          .single();

        if (sessionError) throw sessionError;
        currentSessionId = newSession.id;
        setSessionId(currentSessionId);
      }

      // Save user message
      await supabase.from('ai_chat_messages').insert([{
        session_id: currentSessionId,
        role: 'user',
        content: textToSend,
        message_type: 'text'
      }]);

      const response = await supabase.functions.invoke('ai-chat', {
        body: { message: textToSend, session_id: currentSessionId, user_id: user.id, company_id: company.id }
      });

      if (response.error) {
        const errorMessage = response.error?.message || '';
        if (errorMessage.includes('429') || errorMessage.includes('rate')) {
          toast({ title: "Limite de requisições", description: "Aguarde alguns segundos e tente novamente.", variant: "destructive" });
        } else if (errorMessage.includes('402') || errorMessage.includes('payment')) {
          toast({ title: "Créditos esgotados", description: "Entre em contato com o administrador.", variant: "destructive" });
        } else {
          toast({ title: "Erro da IA", description: "Não foi possível processar sua solicitação.", variant: "destructive" });
        }
        return;
      }

      if (response.data?.success === false || response.data?.error) {
        toast({ title: "Erro da IA", description: response.data?.response || "Erro desconhecido", variant: "destructive" });
        return;
      }

      // Save assistant response
      await supabase.from('ai_chat_messages').insert([{
        session_id: currentSessionId,
        role: 'assistant',
        content: response.data.response,
        message_type: 'text',
        metadata: { model_used: response.data.model_used, context_summary: response.data.context_summary }
      }]);

      const assistantMessage: ChatMessage = { role: 'assistant', content: response.data.response, timestamp: new Date() };
      onMessagesChange([...messages, userMessage, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({ title: 'Erro ao enviar mensagem', description: 'Tente novamente mais tarde', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Card
      className={cn(
        "fixed z-50 shadow-2xl border-2 transition-all duration-300 bg-background",
        isMinimized ? "w-80 h-14" : "w-96 h-[600px]"
      )}
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      onMouseDown={handleMouseDown}
    >
      <CardHeader className="drag-handle cursor-move p-4 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {showHistory && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowHistory(false)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">{showHistory ? 'Histórico' : 'Account Pilot'}</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            {!showHistory && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setShowHistory(true); fetchSessions(); }} title="Histórico de conversas">
                <History className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onMinimize}>
              <Minus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {!isMinimized && (
        <CardContent className="p-4 flex flex-col h-[calc(100%-4rem)]">
          {showHistory ? (
            /* History Panel */
            <div className="flex flex-col h-full">
              <Button variant="outline" size="sm" className="mb-3 w-full" onClick={startNewConversation}>
                <Plus className="h-4 w-4 mr-2" /> Nova conversa
              </Button>
              <ScrollArea className="flex-1">
                {loadingSessions ? (
                  <div className="flex justify-center py-8"><LoadingSpinner size="sm" /></div>
                ) : sessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhuma conversa anterior</p>
                ) : (
                  <div className="space-y-2">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className={cn(
                          "p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors border group",
                          session.id === sessionId ? "border-primary bg-primary/5" : "border-transparent"
                        )}
                        onClick={() => loadSession(session)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{session.session_title || 'Sem título'}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {format(new Date(session.created_at), "dd MMM yyyy, HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                            onClick={(e) => deleteSession(session.id, e)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          ) : (
            /* Chat Panel */
            <>
              {messages.length === 0 && (
                <div className="mb-4 space-y-2">
                  <p className="text-sm text-muted-foreground mb-2">Ações rápidas:</p>
                  <div className="grid grid-cols-1 gap-2">
                    {quickActions.map((action, index) => (
                      <Button key={index} variant="outline" size="sm" className="justify-start h-auto py-2 text-left" onClick={() => handleSendMessage(action.prompt)}>
                        <action.icon className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="text-xs">{action.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <ScrollArea ref={scrollRef} className="flex-1 pr-4">
                <div className="space-y-4">
                  {messages.map((msg, index) => (
                    <div key={index} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                      <div className={cn("rounded-lg px-4 py-2 max-w-[80%]", msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted")}>
                        {msg.role === 'user' ? (
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        ) : (
                          <div className="text-sm prose prose-sm max-w-none dark:prose-invert">
                            <ReactMarkdown
                              components={{
                                h1: ({ children }) => <h1 className="text-base font-bold mt-3 mb-2">{children}</h1>,
                                h2: ({ children }) => <h2 className="text-base font-bold mt-3 mb-2">{children}</h2>,
                                h3: ({ children }) => <h3 className="text-sm font-bold mt-2 mb-1">{children}</h3>,
                                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                                li: ({ children }) => <li className="text-sm">{children}</li>,
                                strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                                em: ({ children }) => <em className="italic">{children}</em>,
                                code: ({ children }) => <code className="bg-background/50 px-1 py-0.5 rounded text-xs">{children}</code>,
                                pre: ({ children }) => <pre className="bg-background/50 p-2 rounded my-2 overflow-x-auto text-xs">{children}</pre>,
                              }}
                            >{msg.content}</ReactMarkdown>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg px-4 py-2"><LoadingSpinner size="sm" /></div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="flex gap-2 mt-4">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                  placeholder="Digite sua mensagem..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button onClick={() => handleSendMessage()} disabled={isLoading || !chatInput.trim()} size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
};
