import React, { useState, useEffect } from 'react';
import { Bot, Brain, MessageSquare, Lightbulb, TrendingUp, AlertTriangle, CheckCircle, Settings, Zap, Target, Users, BarChart3, Clock, ArrowRight, X, Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface AIInsight {
  id: string;
  insight_type: string;
  category: string;
  title: string;
  description: string;
  severity: string;
  confidence_score: number;
  related_entity_type?: string;
  related_entity_id?: string;
  actionable: boolean;
  status: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

interface AIRecommendation {
  id: string;
  insight_id: string;
  title: string;
  description: string;
  action_type: string;
  priority: string;
  estimated_impact: string;
  effort_required: string;
  deadline?: string;
  assigned_to?: string;
  status: string;
  feedback?: string;
  created_at: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  message_type: string;
  metadata?: any;
  created_at: string;
}

interface ChatSession {
  id: string;
  user_id: string;
  session_title?: string;
  created_at: string;
  updated_at: string;
}

export const AICopilotPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [selectedInsight, setSelectedInsight] = useState<AIInsight | null>(null);
  const [isInsightModalOpen, setIsInsightModalOpen] = useState(false);

  useEffect(() => {
    loadAIData();
  }, []);

  const loadAIData = async () => {
    try {
      setLoading(true);
      
      const [insightsRes, recommendationsRes, chatSessionsRes] = await Promise.all([
        supabase.from('ai_insights').select('*').order('created_at', { ascending: false }),
        supabase.from('ai_recommendations').select('*').order('created_at', { ascending: false }),
        supabase.from('ai_chat_sessions').select('*').order('updated_at', { ascending: false }).limit(10)
      ]);

      if (insightsRes.data) setInsights(insightsRes.data);
      if (recommendationsRes.data) setRecommendations(recommendationsRes.data);
      if (chatSessionsRes.data) setChatSessions(chatSessionsRes.data);

    } catch (error) {
      console.error('Error loading AI data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados da IA.",
        variant: "destructive",
      });
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
      return data;
    } catch (error) {
      console.error('Error creating chat session:', error);
      return null;
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !user) return;

    try {
      setChatLoading(true);
      
      let session = currentSession;
      if (!session) {
        session = await createChatSession();
        if (!session) return;
        setCurrentSession(session);
      }

      // Add user message
      const userMessage = {
        session_id: session.id,
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
          session_id: session.id,
          user_id: user.id
        }
      });

      if (response.error) throw response.error;

      // Add assistant response
      const assistantMessage = {
        session_id: session.id,
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

  const loadChatMessages = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('ai_chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data || []) as ChatMessage[]);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const selectChatSession = async (session: ChatSession) => {
    setCurrentSession(session);
    await loadChatMessages(session.id);
  };

  const generateSampleInsights = async () => {
    if (!user) return;

    const sampleInsights = [
      {
        insight_type: 'risk',
        category: 'projects',
        title: 'Projeto com Alta Probabilidade de Atraso',
        description: 'O projeto "Sistema de CRM" está 15% atrasado e com tendência de aumento do atraso baseado no padrão atual de execução.',
        severity: 'high',
        confidence_score: 0.87,
        related_entity_type: 'project',
        actionable: true
      },
      {
        insight_type: 'opportunity',
        category: 'indicators',
        title: 'Indicador Superando Expectativas',
        description: 'O indicador "Taxa de Conversão" está 20% acima da meta e pode permitir ajuste de metas mais ambiciosas.',
        severity: 'low',
        confidence_score: 0.92,
        related_entity_type: 'indicator',
        actionable: true
      },
      {
        insight_type: 'pattern',
        category: 'people',
        title: 'Padrão de Sobrecarga Detectado',
        description: 'Análise indica que 3 colaboradores estão consistentemente acima da capacidade ideal de trabalho.',
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
      
      await loadAIData();
      toast({
        title: "Sucesso",
        description: "Insights de exemplo gerados com sucesso!",
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

  const updateInsightStatus = async (insightId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('ai_insights')
        .update({ status: newStatus })
        .eq('id', insightId);

      if (error) throw error;

      setInsights(prev => prev.map(insight =>
        insight.id === insightId ? { ...insight, status: newStatus } : insight
      ));

      toast({
        title: "Sucesso",
        description: "Status do insight atualizado!",
      });
    } catch (error) {
      console.error('Error updating insight:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar insight.",
        variant: "destructive",
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return AlertTriangle;
      case 'high': return AlertTriangle;
      case 'medium': return Clock;
      case 'low': return CheckCircle;
      default: return Clock;
    }
  };

  const getInsightTypeIcon = (type: string) => {
    switch (type) {
      case 'risk': return AlertTriangle;
      case 'opportunity': return TrendingUp;
      case 'pattern': return BarChart3;
      case 'recommendation': return Lightbulb;
      default: return Brain;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'projects': return Target;
      case 'indicators': return BarChart3;
      case 'people': return Users;
      case 'objectives': return CheckCircle;
      default: return Brain;
    }
  };

  const quickActions = [
    { label: "Como estão meus KPIs?", action: () => setMessageInput("Como estão meus KPIs principais?") },
    { label: "Status dos projetos", action: () => setMessageInput("Qual é o status atual dos meus projetos?") },
    { label: "Resumo da semana", action: () => setMessageInput("Me dê um resumo do progresso desta semana") },
    { label: "Próximos vencimentos", action: () => setMessageInput("Quais são os próximos prazos importantes?") }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Copiloto de IA</h1>
            <p className="text-muted-foreground mt-2">Carregando insights inteligentes...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            Copiloto de IA
          </h1>
          <p className="text-muted-foreground mt-2">Assistente inteligente para execução estratégica</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={generateSampleInsights}>
            <Sparkles className="w-4 h-4 mr-2" />
            Gerar Insights Demo
          </Button>
          <Button>
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Insights Ativos</p>
                <p className="text-2xl font-bold text-blue-600">{insights.filter(i => i.status === 'active').length}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Brain className="w-4 h-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Recomendações</p>
                <p className="text-2xl font-bold text-green-600">{recommendations.filter(r => r.status === 'pending').length}</p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Lightbulb className="w-4 h-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Alertas Críticos</p>
                <p className="text-2xl font-bold text-red-600">
                  {insights.filter(i => i.severity === 'critical' || i.severity === 'high').length}
                </p>
              </div>
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Confiança Média</p>
                <p className="text-2xl font-bold text-purple-600">
                  {insights.length > 0 ? Math.round((insights.reduce((acc, i) => acc + i.confidence_score, 0) / insights.length) * 100) : 0}%
                </p>
              </div>
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Zap className="w-4 h-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="insights" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="chat">Chat Assistente</TabsTrigger>
          <TabsTrigger value="recommendations">Recomendações</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {insights.map((insight) => {
              const SeverityIcon = getSeverityIcon(insight.severity);
              const TypeIcon = getInsightTypeIcon(insight.insight_type);
              const CategoryIcon = getCategoryIcon(insight.category);

              return (
                <Card key={insight.id} className="hover:shadow-lg transition-shadow cursor-pointer" 
                      onClick={() => { setSelectedInsight(insight); setIsInsightModalOpen(true); }}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <TypeIcon className="w-5 h-5 text-primary" />
                        <Badge variant="outline" className="text-xs">
                          {insight.insight_type}
                        </Badge>
                      </div>
                      <Badge variant={getSeverityColor(insight.severity)}>
                        <SeverityIcon className="w-3 h-3 mr-1" />
                        {insight.severity}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg leading-tight">{insight.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{insight.description}</p>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Confiança:</span>
                        <div className="flex items-center gap-2">
                          <Progress value={insight.confidence_score * 100} className="w-16 h-2" />
                          <span className="text-sm font-medium">{Math.round(insight.confidence_score * 100)}%</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Categoria:</span>
                        <div className="flex items-center gap-1">
                          <CategoryIcon className="w-3 h-3" />
                          <span className="text-sm font-medium">{insight.category}</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Status:</span>
                        <Badge variant={insight.status === 'active' ? 'default' : 'secondary'}>
                          {insight.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      {insight.status === 'active' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateInsightStatus(insight.id, 'acknowledged');
                            }}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Confirmar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateInsightStatus(insight.id, 'dismissed');
                            }}
                          >
                            <X className="w-3 h-3 mr-1" />
                            Descartar
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {insights.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <Brain className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum insight ativo</h3>
                <p className="text-muted-foreground mb-4">
                  A IA está analisando seus dados para gerar insights inteligentes.
                </p>
                <Button onClick={generateSampleInsights}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Gerar Insights Demo
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="chat" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-96">
            {/* Chat Sessions Sidebar */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Conversas</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-80">
                  <div className="space-y-2 p-4">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        setCurrentSession(null);
                        setMessages([]);
                      }}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Nova Conversa
                    </Button>
                    {chatSessions.map((session) => (
                      <Button
                        key={session.id}
                        variant={currentSession?.id === session.id ? "default" : "ghost"}
                        className="w-full justify-start text-left"
                        onClick={() => selectChatSession(session)}
                      >
                        <MessageSquare className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate">
                          {session.session_title || `Chat ${new Date(session.created_at).toLocaleDateString('pt-BR')}`}
                        </span>
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Chat Interface */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  Assistente IA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ScrollArea className="h-64 border rounded-lg p-4">
                  <div className="space-y-4">
                    {messages.length === 0 && (
                      <div className="text-center text-muted-foreground">
                        <Bot className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Olá! Sou seu assistente de IA. Como posso ajudá-lo hoje?</p>
                        <div className="flex flex-wrap gap-2 mt-4 justify-center">
                          {quickActions.map((action, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              onClick={action.action}
                            >
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                    {messages.map((message) => (
                      <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-lg ${
                          message.role === 'user' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted'
                        }`}>
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(message.created_at).toLocaleTimeString('pt-BR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-muted p-3 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
                            <span className="text-sm">Pensando...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                <div className="flex gap-2">
                  <Input
                    placeholder="Digite sua mensagem..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !chatLoading && sendMessage()}
                    disabled={chatLoading}
                  />
                  <Button 
                    onClick={sendMessage} 
                    disabled={!messageInput.trim() || chatLoading}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {recommendations.map((recommendation) => (
              <Card key={recommendation.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg leading-tight">{recommendation.title}</CardTitle>
                    <Badge variant={
                      recommendation.priority === 'urgent' ? 'destructive' :
                      recommendation.priority === 'high' ? 'destructive' :
                      recommendation.priority === 'medium' ? 'secondary' : 'outline'
                    }>
                      {recommendation.priority}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{recommendation.description}</p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tipo de Ação:</span>
                      <span className="font-medium">{recommendation.action_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Impacto Estimado:</span>
                      <Badge variant="outline">{recommendation.estimated_impact}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Esforço Necessário:</span>
                      <Badge variant="outline">{recommendation.effort_required}</Badge>
                    </div>
                    {recommendation.deadline && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Prazo:</span>
                        <span className="font-medium">
                          {new Date(recommendation.deadline).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={recommendation.status === 'completed' ? 'default' : 'secondary'}>
                        {recommendation.status}
                      </Badge>
                    </div>
                  </div>

                  {recommendation.status === 'pending' && (
                    <div className="flex gap-2 mt-4">
                      <Button variant="default" size="sm">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Aceitar
                      </Button>
                      <Button variant="outline" size="sm">
                        <Clock className="w-3 h-3 mr-1" />
                        Adiar
                      </Button>
                      <Button variant="outline" size="sm">
                        <X className="w-3 h-3 mr-1" />
                        Rejeitar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {recommendations.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <Lightbulb className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma recomendação ativa</h3>
                <p className="text-muted-foreground">
                  A IA gerará recomendações baseadas na análise dos seus dados.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Insight Detail Modal */}
      <Dialog open={isInsightModalOpen} onOpenChange={setIsInsightModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedInsight && (
                <>
                  {React.createElement(getInsightTypeIcon(selectedInsight.insight_type), { className: "w-5 h-5" })}
                  {selectedInsight.title}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Análise detalhada do insight
            </DialogDescription>
          </DialogHeader>
          {selectedInsight && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">Tipo:</span>
                  <Badge variant="outline">{selectedInsight.insight_type}</Badge>
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">Categoria:</span>
                  <Badge variant="outline">{selectedInsight.category}</Badge>
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">Severidade:</span>
                  <Badge variant={getSeverityColor(selectedInsight.severity)}>
                    {selectedInsight.severity}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">Confiança:</span>
                  <div className="flex items-center gap-2">
                    <Progress value={selectedInsight.confidence_score * 100} className="flex-1" />
                    <span className="text-sm font-medium">{Math.round(selectedInsight.confidence_score * 100)}%</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">Descrição Completa:</span>
                <p className="text-sm">{selectedInsight.description}</p>
              </div>

              {selectedInsight.metadata && (
                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">Dados Adicionais:</span>
                  <pre className="text-xs bg-muted p-3 rounded">
                    {JSON.stringify(selectedInsight.metadata, null, 2)}
                  </pre>
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={() => updateInsightStatus(selectedInsight.id, 'acknowledged')}
                  disabled={selectedInsight.status !== 'active'}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Marcar como Lido
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => updateInsightStatus(selectedInsight.id, 'dismissed')}
                  disabled={selectedInsight.status !== 'active'}
                >
                  <X className="w-4 h-4 mr-2" />
                  Descartar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};