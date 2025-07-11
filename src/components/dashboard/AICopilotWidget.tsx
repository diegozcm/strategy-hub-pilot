import React, { useState, useEffect } from 'react';
import { Bot, Brain, MessageSquare, Lightbulb, TrendingUp, AlertTriangle, Send, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface AIInsight {
  id: string;
  insight_type: string;
  category: string;
  title: string;
  description: string;
  severity: string;
  confidence_score: number;
  actionable: boolean;
  status: string;
  created_at: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export const AICopilotWidget: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [currentSession, setCurrentSession] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [insightsRes] = await Promise.all([
        supabase.from('ai_insights').select('*').order('created_at', { ascending: false }).limit(3)
      ]);

      if (insightsRes.data) setInsights(insightsRes.data);
    } catch (error) {
      console.error('Error loading AI data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createChatSession = async () => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('ai_chat_sessions')
        .insert([{
          user_id: user.id,
          session_title: `Chat ${new Date().toLocaleDateString('pt-BR')}`
        }])
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error creating chat session:', error);
      return null;
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !user) return;

    try {
      setChatLoading(true);
      
      let sessionId = currentSession;
      if (!sessionId) {
        sessionId = await createChatSession();
        if (!sessionId) return;
        setCurrentSession(sessionId);
      }

      // Add user message
      const userMessage = {
        session_id: sessionId,
        role: 'user' as const,
        content: messageInput,
        message_type: 'text'
      };

      const { data: userMsgData, error: userMsgError } = await supabase
        .from('ai_chat_messages')
        .insert([userMessage])
        .select()
        .single();

      if (userMsgError) throw userMsgError;

      setMessages(prev => [...prev, userMsgData as ChatMessage]);
      setMessageInput('');

      // Send to AI chat function
      const response = await supabase.functions.invoke('ai-chat', {
        body: { 
          message: messageInput,
          session_id: sessionId,
          user_id: user.id
        }
      });

      if (response.error) throw response.error;

      // Add assistant response
      const assistantMessage = {
        session_id: sessionId,
        role: 'assistant' as const,
        content: response.data.response,
        message_type: 'text'
      };

      const { data: assistantMsgData, error: assistantMsgError } = await supabase
        .from('ai_chat_messages')
        .insert([assistantMessage])
        .select()
        .single();

      if (assistantMsgError) throw assistantMsgError;

      setMessages(prev => [...prev, assistantMsgData as ChatMessage]);

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar mensagem. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setChatLoading(false);
    }
  };

  const generateSampleInsights = async () => {
    if (!user) return;

    const sampleInsights = [
      {
        insight_type: 'risk',
        category: 'projects',
        title: 'Projeto com Alta Probabilidade de Atraso',
        description: 'O projeto "Sistema de CRM" está 15% atrasado e com tendência de aumento do atraso.',
        severity: 'high',
        confidence_score: 0.87,
        actionable: true
      },
      {
        insight_type: 'opportunity',
        category: 'indicators',
        title: 'Indicador Superando Expectativas',
        description: 'O indicador "Taxa de Conversão" está 20% acima da meta.',
        severity: 'low',
        confidence_score: 0.92,
        actionable: true
      },
      {
        insight_type: 'pattern',
        category: 'people',
        title: 'Padrão de Sobrecarga Detectado',
        description: 'Análise indica que 3 colaboradores estão acima da capacidade ideal.',
        severity: 'medium',
        confidence_score: 0.78,
        actionable: true
      }
    ];

    try {
      for (const insight of sampleInsights) {
        await supabase.from('ai_insights').insert([{
          ...insight,
          user_id: user.id
        }]);
      }
      
      await loadData();
      toast({
        title: "Sucesso",
        description: "Insights de exemplo gerados!",
      });
    } catch (error) {
      console.error('Error generating insights:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar insights de exemplo.",
        variant: "destructive",
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'risk': return AlertTriangle;
      case 'opportunity': return TrendingUp;
      default: return Lightbulb;
    }
  };

  const quickActions = [
    "Status dos projetos",
    "Como estão os KPIs?",
    "Resumo da semana"
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* AI Copilot Header */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <CardTitle className="text-lg">Copiloto de IA</CardTitle>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/ai-copilot')}
            >
              Ver tudo
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Insights</p>
              <p className="text-lg font-bold text-blue-600">{insights.filter(i => i.status === 'active').length}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Críticos</p>
              <p className="text-lg font-bold text-red-600">{insights.filter(i => i.severity === 'high').length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Latest Insights */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Insights Recentes</CardTitle>
            <Button variant="outline" size="sm" onClick={generateSampleInsights}>
              <Sparkles className="w-4 h-4 mr-1" />
              Demo
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {insights.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum insight disponível</p>
              <p className="text-xs">Clique em "Demo" para ver exemplos</p>
            </div>
          ) : (
            insights.slice(0, 2).map((insight) => {
              const Icon = getInsightIcon(insight.insight_type);
              return (
                <div key={insight.id} className="p-3 border border-border rounded-lg">
                  <div className="flex items-start gap-2">
                    <Icon className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium truncate">{insight.title}</p>
                        <Badge variant={getSeverityColor(insight.severity)} className="text-xs">
                          {insight.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{insight.description}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Quick Chat */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bot className="w-4 h-4" />
            Chat Assistente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ScrollArea className="h-32 border rounded-lg p-3">
            <div className="space-y-2">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground">
                  <p className="text-sm">Pergunte algo sobre seus dados!</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {quickActions.map((action, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="text-xs h-6"
                        onClick={() => setMessageInput(action)}
                      >
                        {action}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.slice(-3).map((message) => (
                  <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-2 rounded text-xs ${
                      message.role === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}>
                      {message.content}
                    </div>
                  </div>
                ))
              )}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted p-2 rounded text-xs">
                    <div className="flex items-center gap-1">
                      <div className="animate-spin w-3 h-3 border border-primary border-t-transparent rounded-full"></div>
                      Pensando...
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="flex gap-2">
            <Input
              placeholder="Digite sua pergunta..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !chatLoading && sendMessage()}
              disabled={chatLoading}
              className="text-sm"
            />
            <Button 
              size="sm"
              onClick={sendMessage} 
              disabled={!messageInput.trim() || chatLoading}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};