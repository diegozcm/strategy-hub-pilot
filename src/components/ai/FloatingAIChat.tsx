import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Sparkles, TrendingUp, AlertCircle, Lightbulb, History, Plus, Trash2, ArrowLeft, Check, XCircle, Mic, Square, RefreshCw, ThumbsUp, ThumbsDown, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  position: { x: number; y: number };
  messages: ChatMessage[];
  onClose: () => void;
  onPositionChange: (position: { x: number; y: number }) => void;
  onMessagesChange: (messages: ChatMessage[]) => void;
}

const TypingIndicator = ({ text = 'digitando' }: { text?: string }) => (
  <div className="flex justify-start">
    <div className="rounded-lg px-4 py-3 flex items-center gap-1.5" style={{ background: '#151525' }}>
      <div className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full animate-[typing-bounce_1.4s_ease-in-out_infinite]" style={{ background: 'oklch(68% 0.22 150)' }} />
        <span className="w-2 h-2 rounded-full animate-[typing-bounce_1.4s_ease-in-out_0.2s_infinite]" style={{ background: 'oklch(75% 0.22 230)' }} />
        <span className="w-2 h-2 rounded-full animate-[typing-bounce_1.4s_ease-in-out_0.4s_infinite]" style={{ background: 'oklch(72% 0.20 200)' }} />
      </div>
      <span className="text-xs ml-1.5" style={{ color: '#888' }}>{text}</span>
    </div>
  </div>
);

function extractPlan(content: string): { cleanContent: string; plan: any | null } {
  let match = content.match(/\[ATLAS_PLAN\]\s*([\s\S]*?)\s*\[\/ATLAS_PLAN\]/);
  if (!match) {
    match = content.match(/\[ATLAS_PLAN\]\s*([\s\S]*)/);
  }
  if (!match) return { cleanContent: content, plan: null };
  try {
    let jsonStr = match[1].trim();
    jsonStr = jsonStr.replace(/^```json?\s*/i, '').replace(/\s*```\s*$/, '');
    const lastBrace = jsonStr.lastIndexOf('}');
    if (lastBrace !== -1 && lastBrace < jsonStr.length - 1) {
      jsonStr = jsonStr.substring(0, lastBrace + 1);
    }
    let plan = JSON.parse(jsonStr);
    if (Array.isArray(plan)) {
      plan = { actions: plan };
    }
    if (plan.action && plan.data && !plan.actions) {
      const actions: any[] = [];
      const d = plan.data;
      if (d.objective) {
        const obj = d.objective;
        actions.push({
          type: 'create_objective',
          data: {
            title: obj.title || obj.name,
            pillar_name: obj.pillar_name || obj.pillar || obj.pilar,
            description: obj.description || obj.descricao,
            target_date: obj.target_date || obj.deadline || obj.prazo,
          }
        });
      }
      if (Array.isArray(d.key_results)) {
        d.key_results.forEach((kr: any) => {
          actions.push({
            type: 'create_key_result',
            data: {
              title: kr.title || kr.name,
              target_value: kr.target_value ?? kr.goal ?? kr.meta ?? kr.value,
              unit: kr.unit || kr.metric_type || kr.unidade || '%',
              description: kr.description || kr.descricao,
              objective_ref: kr.objective_ref ?? 0,
              monthly_targets: kr.monthly_targets,
              frequency: kr.frequency || kr.frequencia,
            }
          });
        });
      }
      if (Array.isArray(d.initiatives)) {
        d.initiatives.forEach((init: any) => {
          actions.push({
            type: 'create_initiative',
            data: {
              title: init.title || init.name,
              description: init.description || init.descricao,
              priority: init.priority || init.prioridade || 'medium',
              start_date: init.start_date || init.inicio,
              end_date: init.end_date || init.fim || init.deadline,
              key_result_ref: init.key_result_ref ?? 1,
            }
          });
        });
      }
      if (actions.length > 0) {
        plan = { actions };
      }
    }
    if (plan.actions && Array.isArray(plan.actions)) {
      plan.actions = plan.actions.map((a: any) => {
        let type = (a.type || a.action || '').toLowerCase()
          .replace('create_kr', 'create_key_result')
          .replace('create_strategic_objective', 'create_objective')
          .replace('create_strategic_pillar', 'create_pillar')
          .replace('create_strategic_project', 'create_project');
        let data = a.data;
        if (!data) {
          const { type: _t, action: _a, ...rest } = a;
          data = rest;
        }
        return { type, data };
      });
      const firstObjIdx = plan.actions.findIndex((a: any) => a.type === 'create_objective');
      const firstKrIdx = plan.actions.findIndex((a: any) => a.type === 'create_key_result');
      plan.actions.forEach((a: any) => {
        if (a.type === 'create_key_result' && firstObjIdx !== -1) {
          if (a.data.objective_ref == null && !a.data.objective_id && !a.data.parent_objective && !a.data.parent_objective_title) {
            a.data.objective_ref = firstObjIdx;
          }
        }
        if (a.type === 'create_initiative' && firstKrIdx !== -1) {
          if (a.data.key_result_ref == null && !a.data.key_result_id && !a.data.parent_kr && !a.data.parent_kr_title) {
            a.data.key_result_ref = firstKrIdx;
          }
        }
      });
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
  isOpen, position, messages, onClose, onPositionChange, onMessagesChange
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
  const chatRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (chatRef.current && !chatRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Delay to avoid immediate close on the same click that opens
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
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
    recognition.onend = () => setIsRecording(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }, [isRecording, toast]);

  const quickActions = [
    { icon: TrendingUp, label: 'Análise de Performance', prompt: 'Me dê uma análise da performance atual' },
    { icon: AlertCircle, label: 'Pontos de Atenção', prompt: 'Quais são os principais pontos de atenção?' },
    { icon: Lightbulb, label: 'Sugestões', prompt: 'Me dê sugestões de melhorias' },
  ];

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      const viewport = document.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }, 100);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isStreaming, isExecuting, scrollToBottom]);

  // Improved drag: user-select none during drag, free positioning
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.drag-handle')) {
      setIsDragging(true);
      setDragOffset({ x: e.clientX - position.x, y: e.clientY - position.y });
      document.body.style.userSelect = 'none';
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        onPositionChange({
          x: Math.max(0, Math.min(window.innerWidth - 400, e.clientX - dragOffset.x)),
          y: Math.max(0, Math.min(window.innerHeight - 100, e.clientY - dragOffset.y))
        });
      }
    };
    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.userSelect = '';
    };
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
    const updated = [...messages];
    updated[msgIndex] = { ...updated[msgIndex], planStatus: 'executing' };
    onMessagesChange(updated);
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      const accessToken = authSession?.access_token;
      if (!accessToken) throw new Error('No auth session');
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
        const typeLabel = (type: string) => {
          if (type === 'create_pillar') return '🏛️ Pilar';
          if (type === 'create_objective') return '🎯 Objetivo';
          if (type === 'create_key_result') return '📈 KR';
          if (type === 'create_initiative') return '🚀 Iniciativa';
          if (type === 'create_project') return '📂 Projeto';
          if (type.includes('update')) return '✏️ Atualização';
          return '📌 Item';
        };
        const confirmMsg: ChatMessage = {
          role: 'assistant',
          content: `✅ **Plano executado com sucesso!** Foram criados:\n${result.results.filter((r: any) => r.success).map((r: any) => `- ${typeLabel(r.type)}: **${r.title}**`).join('\n')}\n\nVocê pode visualizar tudo no **Mapa Estratégico** pelo menu lateral.`,
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
          plan_mode: isPlanMode,
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
            content: fullContent,
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

  const statusText = isExecuting ? 'executando' : (isLoading ? 'planejando' : 'digitando');
  const showIndicator = isLoading || isStreaming || isExecuting;

  return (
    <AnimatePresence>
      {isOpen && (
      <>
      <style>{`
        @keyframes typing-bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
      `}</style>
      <motion.div
        ref={chatRef}
        layoutId="atlas-chat-morph"
        initial={{ borderRadius: '50%', opacity: 0, scale: 0.8 }}
        animate={{ borderRadius: '16px', opacity: 1, scale: 1 }}
        exit={{ borderRadius: '50%', opacity: 0, scale: 0.8 }}
        transition={{ type: "spring", stiffness: 400, damping: 35 }}
        className="fixed z-50"
        style={{ 
          left: `${position.x}px`, 
          top: `${position.y}px`,
          willChange: isDragging ? 'transform' : 'auto',
        }}
      >
      {/* Animated gradient border wrapper */}
      <div className="atlas-chat-border-wrapper relative rounded-2xl p-[1.5px]">
        <div
          className="rounded-2xl overflow-hidden shadow-2xl w-96 h-[600px] flex flex-col"
          style={{ background: '#0a0a0f' }}
          onMouseDown={handleMouseDown}
        >
          {/* Header */}
          <div 
            className="drag-handle cursor-move px-4 py-3 flex items-center justify-between border-b"
            style={{ background: 'rgba(13, 13, 26, 0.95)', borderColor: 'rgba(56, 182, 255, 0.1)' }}
          >
            <div className="flex items-center gap-2.5">
              {showHistory && (
                <button className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-white/10 transition-colors" onClick={() => setShowHistory(false)}>
                  <ArrowLeft className="h-4 w-4" style={{ color: '#e0e0e0' }} />
                </button>
              )}
              {/* Mini ColorOrb */}
              <div 
                className="color-orb-atlas w-7 h-7 shrink-0"
                style={{
                  '--base': 'oklch(10% 0.02 240)',
                  '--accent1': 'oklch(68% 0.22 150)',
                  '--accent2': 'oklch(75% 0.22 230)',
                  '--accent3': 'oklch(72% 0.20 200)',
                  '--blur': '0.5px',
                  '--contrast': '1.6',
                  '--dot': '0.05rem',
                  '--shadow': '0.8rem',
                  '--mask': '10%',
                  '--spin-duration': '6s',
                } as React.CSSProperties}
              />
              <span className="text-sm font-semibold tracking-wide" style={{ color: '#e0e0e0' }}>
                {showHistory ? 'Histórico' : 'Atlas'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {!showHistory && (
                <button 
                  className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-white/10 transition-colors"
                  onClick={() => { setShowHistory(true); fetchSessions(); }} 
                  title="Histórico de conversas"
                >
                  <History className="h-4 w-4" style={{ color: '#888' }} />
                </button>
              )}
              <button 
                className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-white/10 transition-colors"
                onClick={onClose}
              >
                <X className="h-4 w-4" style={{ color: '#888' }} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col overflow-hidden p-4">
            {showHistory ? (
              <div className="flex flex-col h-full">
                <button 
                  className="mb-3 w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors border"
                  style={{ 
                    background: 'rgba(56, 182, 255, 0.08)', 
                    borderColor: 'rgba(56, 182, 255, 0.2)', 
                    color: '#e0e0e0' 
                  }}
                  onClick={startNewConversation}
                >
                  <Plus className="h-4 w-4" /> Nova conversa
                </button>
                <ScrollArea className="flex-1">
                  {loadingSessions ? (
                    <div className="flex justify-center py-8"><LoadingSpinner size="sm" /></div>
                  ) : sessions.length === 0 ? (
                    <p className="text-sm text-center py-8" style={{ color: '#888' }}>Nenhuma conversa anterior</p>
                  ) : (
                    <div className="space-y-2">
                      {sessions.map((session) => (
                        <div 
                          key={session.id} 
                          className={cn(
                            "p-3 rounded-lg cursor-pointer transition-colors group",
                            session.id === sessionId ? "border" : "border border-transparent"
                          )} 
                          style={{
                            background: session.id === sessionId ? 'rgba(56, 182, 255, 0.08)' : 'transparent',
                            borderColor: session.id === sessionId ? 'rgba(56, 182, 255, 0.2)' : 'transparent',
                          }}
                          onMouseEnter={(e) => { if (session.id !== sessionId) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                          onMouseLeave={(e) => { if (session.id !== sessionId) e.currentTarget.style.background = 'transparent'; }}
                          onClick={() => loadSession(session)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate" style={{ color: '#e0e0e0' }}>{session.session_title || 'Sem título'}</p>
                              <p className="text-xs mt-0.5" style={{ color: '#888' }}>
                                {format(new Date(session.created_at), "dd MMM yyyy, HH:mm", { locale: ptBR })}
                              </p>
                            </div>
                            <button 
                              className="h-7 w-7 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 transition-opacity shrink-0 hover:bg-red-500/20"
                              onClick={(e) => deleteSession(session.id, e)}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-red-400" />
                            </button>
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
                    <p className="text-sm mb-2" style={{ color: '#888' }}>Ações rápidas:</p>
                    <div className="grid grid-cols-1 gap-2">
                      {quickActions.map((action, index) => (
                        <button 
                          key={index} 
                          className="flex items-center gap-2 py-2.5 px-3 rounded-lg text-left text-xs transition-all border"
                          style={{ 
                            background: 'rgba(255, 255, 255, 0.03)', 
                            borderColor: 'rgba(56, 182, 255, 0.1)',
                            color: '#e0e0e0',
                          }}
                          onMouseEnter={(e) => { 
                            e.currentTarget.style.background = 'rgba(56, 182, 255, 0.08)';
                            e.currentTarget.style.borderColor = 'rgba(56, 182, 255, 0.25)';
                          }}
                          onMouseLeave={(e) => { 
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                            e.currentTarget.style.borderColor = 'rgba(56, 182, 255, 0.1)';
                          }}
                          onClick={() => handleSendMessage(action.prompt)}
                        >
                          <action.icon className="h-4 w-4 flex-shrink-0" style={{ color: 'rgba(56, 182, 255, 0.7)' }} />
                          <span>{action.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <ScrollArea className="flex-1 pr-2 atlas-chat-scrollarea">
                  <div className="space-y-4">
                    {messages.map((msg, index) => (
                      <div key={index} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                        <div 
                          className="rounded-xl px-4 py-2.5 max-w-[85%]"
                          style={msg.role === 'user' 
                            ? { background: 'linear-gradient(135deg, #0a2a4a, #0a3a5a)' }
                            : { background: '#151525' }
                          }
                        >
                          {/* User images */}
                          {msg.images && msg.images.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {msg.images.map((img, imgIdx) => (
                                <img key={imgIdx} src={img} alt={`Imagem ${imgIdx + 1}`} className="max-h-20 rounded border border-white/10" />
                              ))}
                            </div>
                          )}
                          {msg.role === 'user' ? (
                            <p className="text-sm whitespace-pre-wrap" style={{ color: '#e0e0e0' }}>{msg.content}</p>
                          ) : (
                            <div className="text-sm atlas-chat-prose">
                              <ReactMarkdown
                                components={{
                                  h1: ({ children }) => <h1 className="text-base font-bold mt-3 mb-2" style={{ color: '#e0e0e0' }}>{children}</h1>,
                                  h2: ({ children }) => <h2 className="text-base font-bold mt-3 mb-2" style={{ color: '#e0e0e0' }}>{children}</h2>,
                                  h3: ({ children }) => <h3 className="text-sm font-bold mt-2 mb-1" style={{ color: '#e0e0e0' }}>{children}</h3>,
                                  p: ({ children }) => <p className="mb-2 last:mb-0" style={{ color: '#d0d0d0' }}>{children}</p>,
                                  ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1" style={{ color: '#d0d0d0' }}>{children}</ul>,
                                  ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1" style={{ color: '#d0d0d0' }}>{children}</ol>,
                                  li: ({ children }) => <li className="text-sm">{children}</li>,
                                  strong: ({ children }) => <strong className="font-bold" style={{ color: '#e0e0e0' }}>{children}</strong>,
                                  em: ({ children }) => <em className="italic">{children}</em>,
                                  code: ({ children }) => <code className="px-1 py-0.5 rounded text-xs" style={{ background: 'rgba(255,255,255,0.08)', color: '#ccc' }}>{children}</code>,
                                  pre: ({ children }) => <pre className="p-2 rounded my-2 overflow-x-auto text-xs" style={{ background: 'rgba(255,255,255,0.05)' }}>{children}</pre>,
                                }}
                              >{msg.content}</ReactMarkdown>
                            </div>
                          )}
                          {/* Plan approval buttons */}
                          {msg.plan && msg.planStatus === 'pending' && (
                            <div className="flex gap-2 mt-3 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                              <button 
                                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-sm font-medium transition-colors"
                                style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80' }}
                                onClick={() => handleExecutePlan(msg.plan, index)}
                              >
                                <Check className="h-3.5 w-3.5" /> Aprovar
                              </button>
                              <button 
                                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-sm font-medium transition-colors"
                                style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}
                                onClick={() => handleRejectPlan(index)}
                              >
                                <XCircle className="h-3.5 w-3.5" /> Reprovar
                              </button>
                            </div>
                          )}
                          {msg.plan && msg.planStatus === 'executing' && (
                            <div className="flex items-center gap-2 mt-3 pt-2 text-xs" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', color: '#888' }}>
                              <LoadingSpinner size="sm" /> Executando plano...
                            </div>
                          )}
                          {msg.plan && msg.planStatus === 'done' && (
                            <div className="mt-3 pt-2 text-xs font-medium" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', color: '#4ade80' }}>
                              ✅ Plano executado
                            </div>
                          )}
                          {msg.plan && msg.planStatus === 'rejected' && (
                            <div className="mt-3 pt-2 text-xs" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', color: '#888' }}>
                              ❌ Plano recusado
                            </div>
                          )}
                          {msg.plan && msg.planStatus === 'error' && (
                            <div className="mt-3 pt-2 text-xs" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', color: '#f87171' }}>
                              ⚠️ Erro ao executar
                            </div>
                          )}
                          {/* Feedback buttons */}
                          {msg.role === 'assistant' && msg.planStatus !== 'executing' && (
                            <div className="flex items-center gap-1 mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                              <button
                                className="h-6 w-6 flex items-center justify-center rounded hover:bg-white/10 transition-colors"
                                title="Gerar outra resposta"
                                onClick={() => {
                                  const prevUserMsg = messages.slice(0, index).reverse().find(m => m.role === 'user');
                                  if (prevUserMsg) {
                                    const withoutBoth = messages.filter((_, i) => i !== index && i !== index - 1);
                                    onMessagesChange(withoutBoth);
                                    setTimeout(() => handleSendMessage(prevUserMsg.content), 100);
                                  }
                                }}
                              >
                                <RefreshCw className="h-3.5 w-3.5" style={{ color: '#888' }} />
                              </button>
                              <button
                                className="h-6 w-6 flex items-center justify-center rounded hover:bg-green-500/20 transition-colors"
                                title="Resposta boa"
                                onClick={() => {
                                  supabase.from('ai_analytics').insert([{
                                    user_id: user?.id || '',
                                    event_type: 'feedback_positive',
                                    event_data: { message_content: msg.content.substring(0, 200), session_id: sessionId }
                                  }]);
                                  toast({ title: '👍 Feedback registrado!', description: 'Obrigado por nos ajudar a melhorar.' });
                                }}
                              >
                                <ThumbsUp className="h-3.5 w-3.5" style={{ color: '#888' }} />
                              </button>
                              <button
                                className="h-6 w-6 flex items-center justify-center rounded hover:bg-red-500/20 transition-colors"
                                title="Resposta ruim"
                                onClick={() => {
                                  supabase.from('ai_analytics').insert([{
                                    user_id: user?.id || '',
                                    event_type: 'feedback_negative',
                                    event_data: { message_content: msg.content.substring(0, 200), session_id: sessionId }
                                  }]);
                                  toast({ title: '👎 Feedback registrado!', description: 'Vamos melhorar com base no seu retorno.' });
                                }}
                              >
                                <ThumbsDown className="h-3.5 w-3.5" style={{ color: '#888' }} />
                              </button>
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
                        <img src={img} alt="Preview" className="max-h-16 rounded-lg border border-white/10" />
                        <button 
                          className="absolute -top-2 -right-2 h-5 w-5 rounded-full flex items-center justify-center"
                          style={{ background: '#ef4444' }}
                          onClick={() => setPastedImages(prev => prev.filter((_, i) => i !== idx))}
                        >
                          <X className="h-3 w-3 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Input area */}
                <div className="flex items-center gap-2 mt-3">
                  <div 
                    className="flex-1 relative"
                  >
                    <input
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
                            reader.onload = () => setPastedImages(prev => [...prev, reader.result as string]);
                            reader.readAsDataURL(file);
                            return;
                          }
                        }
                      }}
                      placeholder="Digite sua mensagem..."
                      disabled={isLoading || isStreaming || isExecuting}
                      className="w-full h-10 rounded-lg px-3 py-2 text-sm outline-none transition-all border"
                      style={{
                        background: 'rgba(255, 255, 255, 0.04)',
                        borderColor: 'rgba(56, 182, 255, 0.12)',
                        color: '#e0e0e0',
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(56, 182, 255, 0.4)'}
                      onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(56, 182, 255, 0.12)'}
                    />
                  </div>
                  {/* Plan toggle */}
                  <button
                    onClick={() => setIsPlanMode(prev => !prev)}
                    disabled={isLoading || isStreaming || isExecuting}
                    className="text-xs font-semibold px-3 py-2 rounded-lg shrink-0 transition-all border"
                    style={{
                      background: isPlanMode ? 'rgba(56, 182, 255, 0.2)' : 'transparent',
                      borderColor: isPlanMode ? 'rgba(56, 182, 255, 0.4)' : 'rgba(255, 255, 255, 0.1)',
                      color: isPlanMode ? '#38B6FF' : '#888',
                    }}
                  >
                    Plan
                  </button>
                  {/* Mic button with ColorOrb when recording */}
                  <button
                    onClick={toggleRecording}
                    disabled={isLoading || isStreaming || isExecuting}
                    className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 transition-all relative overflow-hidden border"
                    style={{
                      background: isRecording ? 'transparent' : 'transparent',
                      borderColor: isRecording ? 'transparent' : 'rgba(255, 255, 255, 0.1)',
                    }}
                    title={isRecording ? "Parar gravação" : "Gravar áudio"}
                  >
                    {isRecording && (
                      <div 
                        className="color-orb-atlas absolute inset-0 rounded-lg"
                        style={{
                          '--base': 'oklch(8% 0.01 240)',
                          '--accent1': 'oklch(50% 0.12 150)',
                          '--accent2': 'oklch(55% 0.12 230)',
                          '--accent3': 'oklch(52% 0.10 200)',
                          '--blur': '0.5px',
                          '--contrast': '1.4',
                          '--dot': '0.04rem',
                          '--shadow': '0.5rem',
                          '--mask': '10%',
                          '--spin-duration': '4s',
                          borderRadius: '0.5rem',
                        } as React.CSSProperties}
                      />
                    )}
                    {isRecording 
                      ? <Square className="h-3.5 w-3.5 fill-current text-white relative z-10" /> 
                      : <Mic className="h-4 w-4" style={{ color: '#888' }} />
                    }
                  </button>
                  {/* Send button */}
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={isLoading || isStreaming || isExecuting || !chatInput.trim()}
                    className="h-9 w-9 rounded-full flex items-center justify-center shrink-0 transition-all disabled:opacity-30"
                    style={{
                      background: 'linear-gradient(135deg, rgba(56, 182, 255, 0.8), rgba(100, 220, 180, 0.8))',
                    }}
                  >
                    <Navigation className="h-4 w-4 text-white" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      </motion.div>
      </>
      )}
    </AnimatePresence>
  );
};
