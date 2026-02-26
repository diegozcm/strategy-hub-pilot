import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';
import { useToast } from '@/hooks/use-toast';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  images?: string[];
  plan?: any;
  planStatus?: 'pending' | 'approved' | 'rejected' | 'executing' | 'done' | 'error';
  planResult?: any;
  autoPlan?: boolean;
}

export interface ChatSession {
  id: string;
  session_title: string | null;
  created_at: string;
  updated_at: string | null;
}

export function extractPlan(content: string): { cleanContent: string; plan: any | null } {
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
          .replace('create_strategic_project', 'create_project')
          .replace('create_project_task', 'create_task')
          .replace('update_project_task', 'update_task')
          .replace('delete_project_task', 'delete_task');
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

const SUPABASE_URL = 'https://pdpzxjlnaqwlyqoyoyhr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkcHp4amxuYXF3bHlxb3lveWhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyNTE1ODYsImV4cCI6MjA2NzgyNzU4Nn0.RUAqyDG5-eM35mH3QNFO3iuR_Wqe5q1tiJSHroH_upk';

export const useAtlasChat = () => {
  const { user, company } = useAuth();
  const { toast } = useToast();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [pastedImages, setPastedImages] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlanMode, setIsPlanMode] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      setIsRecording(false);
      setRecordingTime(0);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setIsTranscribing(true);
        try {
          const reader = new FileReader();
          const base64 = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(audioBlob);
          });
          const { data: { session: authSession } } = await supabase.auth.getSession();
          const accessToken = authSession?.access_token;
          if (!accessToken) throw new Error('No auth session');
          const response = await fetch(`${SUPABASE_URL}/functions/v1/transcribe-audio`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
            body: JSON.stringify({ audio: base64, company_id: company?.id || null }),
          });
          const result = await response.json();
          if (result.text) {
            setChatInput(prev => prev ? `${prev} ${result.text}` : result.text);
            setTimeout(() => {
              if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
                textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
              }
            }, 50);
          } else {
            toast({ title: 'Não foi possível transcrever o áudio', variant: 'destructive' });
          }
        } catch (error: any) {
          console.error('Transcription error:', error);
          toast({ title: 'Erro ao transcrever áudio', description: error.message, variant: 'destructive' });
        } finally {
          setIsTranscribing(false);
        }
      };
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } catch (error: any) {
      console.error('Microphone error:', error);
      toast({ title: 'Erro ao acessar microfone', description: 'Verifique as permissões do navegador.', variant: 'destructive' });
    }
  }, [isRecording, toast, company?.id]);

  const fetchSessions = useCallback(async () => {
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
  }, [user, company?.id]);

  const loadSession = useCallback(async (session: ChatSession) => {
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
      setMessages(loadedMessages);
      setSessionId(session.id);
    } catch (error) {
      console.error('Error loading session:', error);
      toast({ title: 'Erro ao carregar conversa', variant: 'destructive' });
    }
  }, [toast]);

  const deleteSession = useCallback(async (sessionIdToDelete: string) => {
    try {
      await supabase.from('ai_chat_messages').delete().eq('session_id', sessionIdToDelete);
      await supabase.from('ai_chat_sessions').delete().eq('id', sessionIdToDelete);
      setSessions(prev => prev.filter(s => s.id !== sessionIdToDelete));
      if (sessionIdToDelete === sessionId) {
        setSessionId(null);
        setMessages([]);
      }
      toast({ title: 'Conversa excluída' });
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({ title: 'Erro ao excluir conversa', variant: 'destructive' });
    }
  }, [sessionId, toast]);

  const startNewConversation = useCallback(() => {
    setSessionId(null);
    setMessages([]);
  }, []);

  const handleExecutePlan = useCallback(async (plan: any, msgIndex: number) => {
    if (!user || !company?.id) return;
    setIsExecuting(true);
    const updated = [...messages];
    updated[msgIndex] = { ...updated[msgIndex], planStatus: 'executing' };
    setMessages(updated);
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      const accessToken = authSession?.access_token;
      if (!accessToken) throw new Error('No auth session');
      const actions = plan.actions || (Array.isArray(plan) ? plan : null);
      if (!actions || !Array.isArray(actions) || actions.length === 0) {
        throw new Error('Plano sem ações válidas para executar.');
      }
      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-agent-execute`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
        body: JSON.stringify({ company_id: company.id, actions }),
      });
      const result = await response.json();
      const updatedAfter = [...messages];
      updatedAfter[msgIndex] = {
        ...updatedAfter[msgIndex],
        planStatus: result.success ? 'done' : 'error',
        planResult: result,
      };
      setMessages(updatedAfter);
      if (result.success) {
        toast({ title: '✅ Plano executado com sucesso!' });
        const typeLabel = (type: string) => {
          if (type === 'create_pillar') return '🏛️ Pilar';
          if (type === 'create_objective') return '🎯 Objetivo';
          if (type === 'create_key_result') return '📈 KR';
          if (type === 'create_initiative') return '🚀 Iniciativa';
          if (type === 'create_project') return '📂 Projeto';
          if (type === 'create_task') return '✅ Task';
          if (type === 'delete_task') return '🗑️ Task';
          if (type === 'update_task') return '✏️ Task';
          if (type.includes('update')) return '✏️ Atualização';
          if (type.includes('delete')) return '🗑️ Removido';
          return '📌 Item';
        };
        const confirmMsg: ChatMessage = {
          role: 'assistant',
          content: `✅ **Plano executado com sucesso!** Foram criados:\n${result.results.filter((r: any) => r.success).map((r: any) => `- ${typeLabel(r.type)}: **${r.title}**`).join('\n')}\n\nVocê pode visualizar tudo no **Mapa Estratégico** pelo menu lateral.`,
          timestamp: new Date(),
        };
        setMessages([...updatedAfter, confirmMsg]);
      } else {
        const errors = result.results?.filter((r: any) => !r.success).map((r: any) => r.error).join(', ');
        toast({ title: 'Erro ao executar plano', description: errors, variant: 'destructive' });
      }
    } catch (error: any) {
      console.error('Error executing plan:', error);
      const updatedErr = [...messages];
      updatedErr[msgIndex] = { ...updatedErr[msgIndex], planStatus: 'error' };
      setMessages(updatedErr);
      toast({ title: 'Erro ao executar plano', description: error.message, variant: 'destructive' });
    } finally {
      setIsExecuting(false);
    }
  }, [user, company, messages, toast]);

  const handleRejectPlan = useCallback((msgIndex: number) => {
    const updated = [...messages];
    updated[msgIndex] = { ...updated[msgIndex], planStatus: 'rejected' };
    setMessages(updated);
    toast({ title: 'Plano recusado' });
  }, [messages, toast]);

  const handleCopyMessage = useCallback((content: string, index: number) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  }, []);

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
    setMessages(updatedMessages);
    setChatInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
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
      setIsLoading(false);
      setIsStreaming(true);
      setPastedImages([]);
      const abortController = new AbortController();
      abortRef.current = abortController;
      const effectiveMessage = isPlanMode
        ? `[MODO PLAN ATIVO] O usuario está no modo Plan. Você DEVE responder com um plano detalhado e humanizado descrevendo o que será feito, seguido OBRIGATORIAMENTE do bloco [ATLAS_PLAN] com o JSON técnico. O usuario precisará aprovar antes da execução. A mensagem do usuario é: ${textToSend}`
        : textToSend;
      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
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
        let detectedAutoPlan = false;
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
              if (parsed.auto_plan === true) { detectedAutoPlan = true; continue; }
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
            ...(detectedAutoPlan ? { autoPlan: true } : {}),
          };
          setMessages([...updatedMessages, assistantMsg]);
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
          ...(data.auto_plan ? { autoPlan: true } : {}),
        };
        setMessages([...updatedMessages, assistantMessage]);
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
  }, [chatInput, isLoading, isStreaming, user, company, messages, sessionId, toast, pastedImages, isPlanMode]);

  const handleFeedback = useCallback((type: 'positive' | 'negative', content: string) => {
    supabase.from('ai_analytics').insert([{
      user_id: user?.id || '',
      event_type: `feedback_${type}`,
      event_data: { message_content: content.substring(0, 200), session_id: sessionId }
    }]);
    toast({ title: type === 'positive' ? '👍 Feedback registrado!' : '👎 Feedback registrado!', description: type === 'positive' ? 'Obrigado por nos ajudar a melhorar.' : 'Vamos melhorar com base no seu retorno.' });
  }, [user?.id, sessionId, toast]);

  const handleRetry = useCallback((msgIndex: number) => {
    const prevUserMsg = messages.slice(0, msgIndex).reverse().find(m => m.role === 'user');
    if (prevUserMsg) {
      const withoutBoth = messages.filter((_, i) => i !== msgIndex && i !== msgIndex - 1);
      setMessages(withoutBoth);
      setTimeout(() => handleSendMessage(prevUserMsg.content), 100);
    }
  }, [messages, handleSendMessage]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
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
  }, [pastedImages.length, toast]);

  const removePastedImage = useCallback((idx: number) => {
    setPastedImages(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const quickActions = [
    { label: 'Análise de Performance', prompt: 'Me dê uma análise da performance atual', icon: 'TrendingUp' as const },
    { label: 'Pontos de Atenção', prompt: 'Quais são os principais pontos de atenção?', icon: 'AlertCircle' as const },
    { label: 'Sugestões', prompt: 'Me dê sugestões de melhorias', icon: 'Lightbulb' as const },
  ];

  return {
    // State
    messages, setMessages,
    chatInput, setChatInput,
    isLoading, isStreaming, isExecuting,
    sessionId, setSessionId,
    sessions, loadingSessions,
    pastedImages, setPastedImages,
    isRecording, isTranscribing, recordingTime,
    isPlanMode, setIsPlanMode,
    copiedIndex,
    textareaRef,
    // Actions
    handleSendMessage,
    handleExecutePlan,
    handleRejectPlan,
    handleCopyMessage,
    handleFeedback,
    handleRetry,
    handlePaste,
    removePastedImage,
    toggleRecording,
    fetchSessions,
    loadSession,
    deleteSession,
    startNewConversation,
    quickActions,
  };
};
