import React, { useState, useRef, useEffect, useCallback } from 'react';
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

const TypingIndicator = () => (
  <div className="flex justify-start">
    <div className="bg-muted rounded-lg px-4 py-3 flex items-center gap-1.5">
      <div className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-foreground/40 animate-[typing-bounce_1.4s_ease-in-out_infinite]" />
        <span className="w-2 h-2 rounded-full bg-foreground/40 animate-[typing-bounce_1.4s_ease-in-out_0.2s_infinite]" />
        <span className="w-2 h-2 rounded-full bg-foreground/40 animate-[typing-bounce_1.4s_ease-in-out_0.4s_infinite]" />
      </div>
      <span className="text-xs text-muted-foreground ml-1.5">digitando</span>
    </div>
  </div>
);

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
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [pastedImage, setPastedImage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const { toast } = useToast();

  const quickActions = [
    { icon: TrendingUp, label: 'Análise de Performance', prompt: 'Me dê uma análise da performance atual' },
    { icon: AlertCircle, label: 'Pontos de Atenção', prompt: 'Quais são os principais pontos de atenção?' },
    { icon: Lightbulb, label: 'Sugestões', prompt: 'Me dê sugestões de melhorias' },
  ];

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 50);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isStreaming, scrollToBottom]);

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
      await supabase.from('ai_chat_messages').delete().eq('session_id', sessionIdToDelete);
      await supabase.from('ai_chat_sessions').delete().eq('id', sessionIdToDelete);

      setSessions(prev => prev.filter(s => s.id !== sessionIdToDelete));

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

  const handleSendMessage = useCallback(async (messageText?: string) => {
    const textToSend = messageText || chatInput.trim();
    if (!textToSend || isLoading || isStreaming || !user || !company?.id) return;

    const userMessage: ChatMessage = { role: 'user', content: textToSend, timestamp: new Date() };
    const updatedMessages = [...messages, userMessage];
    onMessagesChange(updatedMessages);
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

      // Get auth token for streaming fetch
      const { data: { session: authSession } } = await supabase.auth.getSession();
      const accessToken = authSession?.access_token;
      if (!accessToken) throw new Error('No auth session');

      const supabaseUrl = 'https://pdpzxjlnaqwlyqoyoyhr.supabase.co';

      // Start streaming
      setIsLoading(false);
      setIsStreaming(true);
      setPastedImage(null);

      const abortController = new AbortController();
      abortRef.current = abortController;

      const response = await fetch(`${supabaseUrl}/functions/v1/ai-chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkcHp4amxuYXF3bHlxb3lveWhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyNTE1ODYsImV4cCI6MjA2NzgyNzU4Nn0.RUAqyDG5-eM35mH3QNFO3iuR_Wqe5q1tiJSHroH_upk',
        },
        body: JSON.stringify({
          message: textToSend,
          session_id: currentSessionId,
          user_id: user.id,
          company_id: company.id,
          stream: true,
          ...(pastedImage ? { image: pastedImage } : {}),
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.response || `HTTP ${response.status}`);
      }

      // Check if response is SSE stream or JSON fallback
      const contentType = response.headers.get('Content-Type') || '';

      if (contentType.includes('text/event-stream')) {
        // Process SSE stream — accumulate fully, then show complete message
        const reader = response.body?.getReader();
        if (!reader) throw new Error('No reader available');

        const decoder = new TextDecoder();
        let fullContent = '';
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                fullContent += delta;
              }
            } catch {
              // Skip unparseable lines
            }
          }
        }

        // Show complete message at once
        if (fullContent) {
          onMessagesChange([...updatedMessages, { role: 'assistant', content: fullContent, timestamp: new Date() }]);
          await supabase.from('ai_chat_messages').insert([{
            session_id: currentSessionId,
            role: 'assistant',
            content: fullContent,
            message_type: 'text',
          }]);
        }
      } else {
        // JSON fallback (non-streaming response)
        const data = await response.json();
        if (data.success === false || data.error) {
          throw new Error(data.response || 'Erro desconhecido');
        }

        await supabase.from('ai_chat_messages').insert([{
          session_id: currentSessionId,
          role: 'assistant',
          content: data.response,
          message_type: 'text',
          metadata: { model_used: data.model_used, context_summary: data.context_summary }
        }]);

        const assistantMessage: ChatMessage = { role: 'assistant', content: data.response, timestamp: new Date() };
        onMessagesChange([...updatedMessages, assistantMessage]);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('Error sending message:', error);
      toast({ title: 'Erro ao enviar mensagem', description: error.message || 'Tente novamente mais tarde', variant: 'destructive' });
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [chatInput, isLoading, isStreaming, user, company, messages, sessionId, onMessagesChange, toast]);

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @keyframes typing-bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
      `}</style>
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
              <CardTitle className="text-base">{showHistory ? 'Histórico' : 'Atlas'}</CardTitle>
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
              <>
                {messages.length === 0 && !isLoading && (
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
                    {(isLoading || (isStreaming && (messages.length === 0 || messages[messages.length - 1]?.role !== 'assistant'))) && <TypingIndicator />}
                  </div>
                </ScrollArea>

                {pastedImage && (
                  <div className="relative mb-2 inline-block">
                    <img src={pastedImage} alt="Preview" className="max-h-24 rounded-lg border" />
                    <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-5 w-5 rounded-full" onClick={() => setPastedImage(null)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                    onPaste={(e) => {
                      const items = e.clipboardData?.items;
                      if (!items) return;
                      for (const item of Array.from(items)) {
                        if (item.type.startsWith('image/')) {
                          e.preventDefault();
                          const file = item.getAsFile();
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => {
                            const base64 = reader.result as string;
                            setPastedImage(base64);
                          };
                          reader.readAsDataURL(file);
                          return;
                        }
                      }
                    }}
                    placeholder="Digite sua mensagem..."
                    disabled={isLoading || isStreaming}
                    className="flex-1"
                  />
                  <Button onClick={() => handleSendMessage()} disabled={isLoading || isStreaming || !chatInput.trim()} size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        )}
      </Card>
    </>
  );
};
