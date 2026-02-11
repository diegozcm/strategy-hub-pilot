import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Minus, Send, Sparkles, TrendingUp, AlertCircle, Lightbulb, History, Plus, Trash2, ArrowLeft, Check, XCircle, Mic, Square } from 'lucide-react';
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
  images?: string[];
  plan?: any;
  planStatus?: 'pending' | 'approved' | 'rejected' | 'executing' | 'done' | 'error';
  planResult?: any;
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

const TypingIndicator = ({ text = 'digitando' }: { text?: string }) => (
  <div className="flex justify-start">
    <div className="bg-muted rounded-lg px-4 py-3 flex items-center gap-1.5">
      <div className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-foreground/40 animate-[typing-bounce_1.4s_ease-in-out_infinite]" />
        <span className="w-2 h-2 rounded-full bg-foreground/40 animate-[typing-bounce_1.4s_ease-in-out_0.2s_infinite]" />
        <span className="w-2 h-2 rounded-full bg-foreground/40 animate-[typing-bounce_1.4s_ease-in-out_0.4s_infinite]" />
      </div>
      <span className="text-xs text-muted-foreground ml-1.5">{text}</span>
    </div>
  </div>
);

function extractPlan(content: string): { cleanContent: string; plan: any | null } {
  // Try with closing tag first
  let match = content.match(/\[ATLAS_PLAN\]\s*([\s\S]*?)\s*\[\/ATLAS_PLAN\]/);
  
  // Fallback: no closing tag — grab everything after [ATLAS_PLAN]
  if (!match) {
    match = content.match(/\[ATLAS_PLAN\]\s*([\s\S]*)/);
  }
  
  if (!match) return { cleanContent: content, plan: null };
  
  try {
    // Strip markdown code fences if present
    let jsonStr = match[1].trim();
    jsonStr = jsonStr.replace(/^```json?\s*/i, '').replace(/\s*```\s*$/, '');
    // Remove any trailing text after the JSON object
    const lastBrace = jsonStr.lastIndexOf('}');
    if (lastBrace !== -1 && lastBrace < jsonStr.length - 1) {
      jsonStr = jsonStr.substring(0, lastBrace + 1);
    }
    
    let plan = JSON.parse(jsonStr);
    
    // If the parsed JSON is an array, wrap it as actions
    if (Array.isArray(plan)) {
      plan = { actions: plan };
    }
    
    // Normalize action types to lowercase + aliases
    if (plan.actions && Array.isArray(plan.actions)) {
      plan.actions = plan.actions.map((a: any) => ({
        ...a,
        type: (a.type || '').toLowerCase()
          .replace('create_kr', 'create_key_result'),
      }));
    }
    
    let cleanContent = content
      .replace(/\[ATLAS_PLAN\][\s\S]*?(\[\/ATLAS_PLAN\]|$)/, '')
      .replace(/Preparei o plano acima\.?\s*Clique em \*?\*?Aprovar\*?\*? para que eu execute.*$/gi, '')
      .replace(/Clique em \*?\*?Aprovar\*?\*? para executar.*$/gi, '')
      .trim();
    return { cleanContent, plan };
  } catch {
    return { cleanContent: content, plan: null };
  }
}

export const FloatingAIChat: React.FC<FloatingAIChatProps> = ({
  isOpen, isMinimized, position, messages, onClose, onMinimize, onPositionChange, onMessagesChange
}) => {
  const { user, company } = useAuth();
  const [chatInput, setChatInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [pastedImages, setPastedImages] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlanMode, setIsPlanMode] = useState(false);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const { toast } = useToast();

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      // Stop recording
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: 'Navegador não suporta reconhecimento de voz', description: 'Use Chrome ou Edge para esta funcionalidade.', variant: 'destructive' });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = true;
    recognition.interimResults = true;

    let finalTranscript = '';

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interim = transcript;
        }
      }
      setChatInput((finalTranscript + interim).trim());
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
      if (event.error !== 'aborted') {
        toast({ title: 'Erro no reconhecimento de voz', variant: 'destructive' });
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }, [isRecording, toast]);

  // handlePlanButton removed — Plan is now a toggle mode

  const quickActions = [
    { icon: TrendingUp, label: 'Análise de Performance', prompt: 'Me dê uma análise da performance atual' },
    { icon: AlertCircle, label: 'Pontos de Atenção', prompt: 'Quais são os principais pontos de atenção?' },
    { icon: Lightbulb, label: 'Sugestões', prompt: 'Me dê sugestões de melhorias' },
  ];

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      // Fallback: scroll the Radix viewport directly
      const viewport = document.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }, 100);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isStreaming, isExecuting, scrollToBottom]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.drag-handle')) {
      setIsDragging(true);
      setDragOffset({ x: e.clientX - position.x, y: e.clientY - position.y });
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
      const loadedMessages: ChatMessage[] = (data || []).map(m => {
        const { cleanContent, plan } = extractPlan(m.content);
        return {
          role: m.role as 'user' | 'assistant',
          content: cleanContent,
          timestamp: new Date(m.created_at || Date.now()),
          ...(plan ? { plan, planStatus: 'done' as const } : {}),
        };
      });
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

  const handleExecutePlan = useCallback(async (plan: any, msgIndex: number) => {
    if (!user || !company?.id) return;
    setIsExecuting(true);

    // Update message to executing
    const updated = [...messages];
    updated[msgIndex] = { ...updated[msgIndex], planStatus: 'executing' };
    onMessagesChange(updated);

    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      const accessToken = authSession?.access_token;
      if (!accessToken) throw new Error('No auth session');

      // Resolve actions from plan - handle different structures
      const actions = plan.actions || (Array.isArray(plan) ? plan : null);
      if (!actions || !Array.isArray(actions) || actions.length === 0) {
        throw new Error('Plano sem ações válidas para executar.');
      }

      const response = await fetch('https://pdpzxjlnaqwlyqoyoyhr.supabase.co/functions/v1/ai-agent-execute', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkcHp4amxuYXF3bHlxb3lveWhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyNTE1ODYsImV4cCI6MjA2NzgyNzU4Nn0.RUAqyDG5-eM35mH3QNFO3iuR_Wqe5q1tiJSHroH_upk',
        },
        body: JSON.stringify({ company_id: company.id, actions }),
      });

      const result = await response.json();

      const updatedAfter = [...messages];
      updatedAfter[msgIndex] = {
        ...updatedAfter[msgIndex],
        planStatus: result.success ? 'done' : 'error',
        planResult: result,
      };
      onMessagesChange(updatedAfter);

      if (result.success) {
        toast({ title: '✅ Plano executado com sucesso!' });
        // Add a confirmation message
        const confirmMsg: ChatMessage = {
          role: 'assistant',
          content: `✅ **Plano executado com sucesso!** Foram criados:\n${result.results.map((r: any) => `- ${r.type === 'create_objective' ? '🎯 Objetivo' : r.type === 'create_key_result' ? '📈 KR' : '🚀 Iniciativa'}: **${r.title}**`).join('\n')}\n\nVocê pode visualizar tudo no **Mapa Estratégico** pelo menu lateral.`,
          timestamp: new Date(),
        };
        onMessagesChange([...updatedAfter, confirmMsg]);
      } else {
        const errors = result.results?.filter((r: any) => !r.success).map((r: any) => r.error).join(', ');
        toast({ title: 'Erro ao executar plano', description: errors, variant: 'destructive' });
      }
    } catch (error: any) {
      console.error('Error executing plan:', error);
      const updatedErr = [...messages];
      updatedErr[msgIndex] = { ...updatedErr[msgIndex], planStatus: 'error' };
      onMessagesChange(updatedErr);
      toast({ title: 'Erro ao executar plano', description: error.message, variant: 'destructive' });
    } finally {
      setIsExecuting(false);
    }
  }, [user, company, messages, onMessagesChange, toast]);

  const handleRejectPlan = useCallback((msgIndex: number) => {
    const updated = [...messages];
    updated[msgIndex] = { ...updated[msgIndex], planStatus: 'rejected' };
    onMessagesChange(updated);
    toast({ title: 'Plano recusado' });
  }, [messages, onMessagesChange, toast]);

  const handleSendMessage = useCallback(async (messageText?: string) => {
    const textToSend = messageText || chatInput.trim();
    if (!textToSend || isLoading || isStreaming || !user || !company?.id) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: textToSend,
      timestamp: new Date(),
      images: pastedImages.length > 0 ? [...pastedImages] : undefined,
    };
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

      await supabase.from('ai_chat_messages').insert([{
        session_id: currentSessionId,
        role: 'user',
        content: textToSend,
        message_type: 'text'
      }]);

      const { data: { session: authSession } } = await supabase.auth.getSession();
      const accessToken = authSession?.access_token;
      if (!accessToken) throw new Error('No auth session');

      const supabaseUrl = 'https://pdpzxjlnaqwlyqoyoyhr.supabase.co';

      setIsLoading(false);
      setIsStreaming(true);
      setPastedImages([]);

      const abortController = new AbortController();
      abortRef.current = abortController;

      // If Plan mode is active, inject a hidden prefix for the AI
      const effectiveMessage = isPlanMode
        ? `[MODO PLAN ATIVO] O usuario está no modo Plan. Você DEVE responder com um plano detalhado e humanizado descrevendo o que será feito, seguido OBRIGATORIAMENTE do bloco [ATLAS_PLAN] com o JSON técnico. O usuario precisará aprovar antes da execução. A mensagem do usuario é: ${textToSend}`
        : textToSend;

      const response = await fetch(`${supabaseUrl}/functions/v1/ai-chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkcHp4amxuYXF3bHlxb3lveWhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyNTE1ODYsImV4cCI6MjA2NzgyNzU4Nn0.RUAqyDG5-eM35mH3QNFO3iuR_Wqe5q1tiJSHroH_upk',
        },
        body: JSON.stringify({
          message: effectiveMessage,
          session_id: currentSessionId,
          user_id: user.id,
          company_id: company.id,
          stream: true,
          ...(pastedImages.length > 0 ? { image: pastedImages[0] } : {}),
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.response || `HTTP ${response.status}`);
      }

      const contentType = response.headers.get('Content-Type') || '';

      if (contentType.includes('text/event-stream')) {
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
              if (delta) fullContent += delta;
            } catch { /* skip */ }
          }
        }

        if (fullContent) {
          const { cleanContent, plan } = extractPlan(fullContent);
          const assistantMsg: ChatMessage = {
            role: 'assistant',
            content: cleanContent,
            timestamp: new Date(),
            ...(plan ? { plan, planStatus: 'pending' as const } : {}),
          };
          onMessagesChange([...updatedMessages, assistantMsg]);
          await supabase.from('ai_chat_messages').insert([{
            session_id: currentSessionId,
            role: 'assistant',
            content: fullContent, // store raw content with plan
            message_type: 'text',
          }]);
        }
      } else {
        const data = await response.json();
        if (data.success === false || data.error) throw new Error(data.response || 'Erro desconhecido');

        const { cleanContent, plan } = extractPlan(data.response);

        await supabase.from('ai_chat_messages').insert([{
          session_id: currentSessionId,
          role: 'assistant',
          content: data.response,
          message_type: 'text',
          metadata: { model_used: data.model_used, context_summary: data.context_summary }
        }]);

        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: cleanContent,
          timestamp: new Date(),
          ...(plan ? { plan, planStatus: 'pending' as const } : {}),
        };
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
  }, [chatInput, isLoading, isStreaming, user, company, messages, sessionId, onMessagesChange, toast, pastedImages, isPlanMode]);

  if (!isOpen) return null;

  const statusText = isExecuting ? 'executando' : (isLoading ? 'planejando' : 'digitando');
  const showIndicator = isLoading || isStreaming || isExecuting;

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
                        <div key={session.id} className={cn(
                          "p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors border group",
                          session.id === sessionId ? "border-primary bg-primary/5" : "border-transparent"
                        )} onClick={() => loadSession(session)}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">{session.session_title || 'Sem título'}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {format(new Date(session.created_at), "dd MMM yyyy, HH:mm", { locale: ptBR })}
                              </p>
                            </div>
                            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                              onClick={(e) => deleteSession(session.id, e)}>
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

                <ScrollArea className="flex-1 pr-4">
                  <div className="space-y-4">
                    {messages.map((msg, index) => (
                      <div key={index} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                        <div className={cn("rounded-lg px-4 py-2 max-w-[80%]", msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted")}>
                          {/* User images */}
                          {msg.images && msg.images.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {msg.images.map((img, imgIdx) => (
                                <img key={imgIdx} src={img} alt={`Imagem ${imgIdx + 1}`} className="max-h-20 rounded border" />
                              ))}
                            </div>
                          )}
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
                          {/* Plan approval buttons */}
                          {msg.plan && msg.planStatus === 'pending' && (
                            <div className="flex gap-2 mt-3 pt-2 border-t border-border/50">
                              <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => handleExecutePlan(msg.plan, index)}>
                                <Check className="h-3.5 w-3.5 mr-1" /> Aprovar
                              </Button>
                              <Button size="sm" variant="outline" className="flex-1 text-destructive border-destructive/50 hover:bg-destructive/10" onClick={() => handleRejectPlan(index)}>
                                <XCircle className="h-3.5 w-3.5 mr-1" /> Reprovar
                              </Button>
                            </div>
                          )}
                          {msg.plan && msg.planStatus === 'executing' && (
                            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                              <LoadingSpinner size="sm" /> Executando plano...
                            </div>
                          )}
                          {msg.plan && msg.planStatus === 'done' && (
                            <div className="mt-3 pt-2 border-t border-border/50 text-xs text-green-600 font-medium">
                              ✅ Plano executado
                            </div>
                          )}
                          {msg.plan && msg.planStatus === 'rejected' && (
                            <div className="mt-3 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                              ❌ Plano recusado
                            </div>
                          )}
                          {msg.plan && msg.planStatus === 'error' && (
                            <div className="mt-3 pt-2 border-t border-border/50 text-xs text-destructive">
                              ⚠️ Erro ao executar
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {showIndicator && <TypingIndicator text={statusText} />}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {pastedImages.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {pastedImages.map((img, idx) => (
                      <div key={idx} className="relative inline-block">
                        <img src={img} alt="Preview" className="max-h-16 rounded-lg border" />
                        <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-5 w-5 rounded-full"
                          onClick={() => setPastedImages(prev => prev.filter((_, i) => i !== idx))}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
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
                          if (pastedImages.length >= 5) {
                            toast({ title: 'Limite de 5 imagens atingido', variant: 'destructive' });
                            return;
                          }
                          const file = item.getAsFile();
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => {
                            setPastedImages(prev => [...prev, reader.result as string]);
                          };
                          reader.readAsDataURL(file);
                          return;
                        }
                      }
                    }}
                    placeholder="Digite sua mensagem..."
                    disabled={isLoading || isStreaming || isExecuting}
                    className="flex-1"
                  />
                  <Button
                    onClick={toggleRecording}
                    disabled={isLoading || isStreaming || isExecuting}
                    size="icon"
                    variant={isRecording ? "destructive" : "outline"}
                    title={isRecording ? "Parar gravação" : "Gravar áudio"}
                  >
                    {isRecording ? <Square className="h-3.5 w-3.5 fill-current" /> : <Mic className="h-4 w-4" />}
                  </Button>
                  <Button
                    onClick={() => setIsPlanMode(prev => !prev)}
                    disabled={isLoading || isStreaming || isExecuting}
                    size="sm"
                    variant={isPlanMode ? "default" : "outline"}
                    className="text-xs font-medium px-3"
                  >
                    Plan
                  </Button>
                  <Button onClick={() => handleSendMessage()} disabled={isLoading || isStreaming || isExecuting || !chatInput.trim()} size="icon">
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
