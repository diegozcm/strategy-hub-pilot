import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, AlertTriangle, CheckCircle, Zap, Target, Users, BarChart3, Clock, ArrowRight, X, Sparkles, History, RefreshCw, Lightbulb, MessageSquare } from 'lucide-react';
import { ClearInsightsModal } from './ClearInsightsModal';
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
import { useAuth } from '@/hooks/useMultiTenant';
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
  confirmed_at?: string;
  confirmed_by?: string;
}


export const AICopilotPage: React.FC = () => {
  const { user, company } = useAuth();
  const { toast } = useToast();
  
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInsight, setSelectedInsight] = useState<AIInsight | null>(null);
  const [isInsightModalOpen, setIsInsightModalOpen] = useState(false);
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const [confirmedInsights, setConfirmedInsights] = useState<AIInsight[]>([]);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [clearingInsights, setClearingInsights] = useState(false);

  useEffect(() => {
    loadAIData();
  }, []);

  const loadAIData = async () => {
    if (!company?.id) return;
    
    try {
      setLoading(true);
      
      const [insightsRes, confirmedInsightsRes] = await Promise.all([
        supabase
          .from('ai_insights')
          .select('*')
          .eq('company_id', company.id)
          .eq('user_id', user?.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false }),
        supabase
          .from('ai_insights')
          .select('*')
          .eq('company_id', company.id)
          .eq('user_id', user?.id)
          .neq('status', 'active')
          .order('confirmed_at', { ascending: false })
          .limit(50)
      ]);

      if (insightsRes.data) setInsights(insightsRes.data);
      if (confirmedInsightsRes.data) setConfirmedInsights(confirmedInsightsRes.data);

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


  const generateRealInsights = async () => {
    if (!user || !company?.id) return;

    try {
      setGeneratingInsights(true);
      console.log('Starting insights generation for user:', user.id, 'company:', company.id);
      
      const response = await supabase.functions.invoke('generate-insights', {
        body: { 
          user_id: user.id,
          company_id: company.id
        }
      });

      console.log('Edge function response:', response);

      if (response.error) {
        console.error('Edge function error:', response.error);
        throw response.error;
      }

      console.log('Insights generated successfully:', response.data);
      
      // Reload data but keep current tab
      await loadAIData();
      
      toast({
        title: "Sucesso",
        description: `${response.data.insights_generated || 0} insights gerados baseados nos dados do Strategy Hub e Startup Hub!`,
      });
    } catch (error) {
      console.error('Error generating insights:', error);
      toast({
        title: "Erro",
        description: `Erro ao gerar insights: ${error.message || 'Erro desconhecido'}`,
        variant: "destructive",
      });
    } finally {
      setGeneratingInsights(false);
    }
  };

  const confirmInsight = async (insightId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('ai_insights')
        .update({ 
          status: 'acknowledged',
          confirmed_at: new Date().toISOString(),
          confirmed_by: user.id
        })
        .eq('id', insightId);

      if (error) throw error;

      // Move insight from active to confirmed
      const insight = insights.find(i => i.id === insightId);
      if (insight) {
        setInsights(prev => prev.filter(i => i.id !== insightId));
        setConfirmedInsights(prev => [{ ...insight, status: 'acknowledged' }, ...prev]);
      }

      toast({
        title: "Insight Confirmado",
        description: "O insight foi confirmado e movido para o histórico.",
      });
    } catch (error) {
      console.error('Error confirming insight:', error);
      toast({
        title: "Erro",
        description: "Erro ao confirmar insight.",
        variant: "destructive",
      });
    }
  };

  const clearAllInsights = async () => {
    if (!company?.id) {
      toast({
        title: "Erro",
        description: "Empresa não identificada",
        variant: "destructive",
      });
      return;
    }

    try {
      setClearingInsights(true);
      
      // Step 1: Buscar todos os insight_ids da empresa
      const { data: companyInsights, error: fetchError } = await supabase
        .from('ai_insights')
        .select('id')
        .eq('company_id', company.id);

      if (fetchError) throw fetchError;

      const insightIds = companyInsights?.map(i => i.id) || [];

      if (insightIds.length === 0) {
        toast({
          title: "Nenhum insight encontrado",
          description: "Não há insights para deletar nesta empresa.",
        });
        setIsClearModalOpen(false);
        return;
      }

      // Step 2: Deletar recomendações relacionadas (explícito, por segurança)
      const { error: recError } = await supabase
        .from('ai_recommendations')
        .delete()
        .in('insight_id', insightIds);

      if (recError) {
        console.error('Error deleting recommendations:', recError);
        // Continua mesmo se falhar, pois CASCADE deve lidar com isso
      }

      // Step 3: Deletar todos os insights da empresa
      const { error: deleteError } = await supabase
        .from('ai_insights')
        .delete()
        .eq('company_id', company.id);

      if (deleteError) throw deleteError;

      // Step 4: Limpar estados locais
      setInsights([]);
      setConfirmedInsights([]);

      toast({
        title: "✅ Insights Limpos",
        description: `${insightIds.length} insights e suas recomendações foram deletados com sucesso.`,
      });

      setIsClearModalOpen(false);

    } catch (error) {
      console.error('Error clearing insights:', error);
      toast({
        title: "Erro ao limpar insights",
        description: error.message || "Erro desconhecido ao deletar insights.",
        variant: "destructive",
      });
    } finally {
      setClearingInsights(false);
    }
  };

  const dismissInsight = async (insightId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('ai_insights')
        .update({ 
          status: 'dismissed',
          confirmed_at: new Date().toISOString(),
          confirmed_by: user.id
        })
        .eq('id', insightId);

      if (error) throw error;

      // Move insight from active to confirmed
      const insight = insights.find(i => i.id === insightId);
      if (insight) {
        setInsights(prev => prev.filter(i => i.id !== insightId));
        setConfirmedInsights(prev => [{ ...insight, status: 'dismissed' }, ...prev]);
      }

      toast({
        title: "Insight Descartado",
        description: "O insight foi descartado e movido para o histórico.",
      });
    } catch (error) {
      console.error('Error dismissing insight:', error);
      toast({
        title: "Erro",
        description: "Erro ao descartar insight.",
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
      case 'startups': return Users;
      case 'mentoring': return MessageSquare;
      case 'strategic': return Brain;
      default: return Brain;
    }
  };


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
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setIsClearModalOpen(true)}
            disabled={clearingInsights || (insights.length === 0 && confirmedInsights.length === 0)}
          >
            <X className="w-4 h-4 mr-2" />
            Limpar Insights
          </Button>
          
          <Button 
            variant="outline" 
            onClick={generateRealInsights}
            disabled={generatingInsights}
          >
            {generatingInsights ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Brain className="w-4 h-4 mr-2" />
            )}
            Analisar Dados
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="insights">Insights Ativos</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
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
                              confirmInsight(insight.id);
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
                              dismissInsight(insight.id);
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
                <Button onClick={generateRealInsights} disabled={generatingInsights}>
                  {generatingInsights ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Brain className="w-4 h-4 mr-2" />
                  )}
                  Analisar Dados
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {confirmedInsights.map((insight) => {
              const SeverityIcon = getSeverityIcon(insight.severity);
              const TypeIcon = getInsightTypeIcon(insight.insight_type);
              const CategoryIcon = getCategoryIcon(insight.category);

              return (
                <Card key={insight.id} className="hover:shadow-lg transition-shadow cursor-pointer opacity-75" 
                      onClick={() => { setSelectedInsight(insight); setIsInsightModalOpen(true); }}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <TypeIcon className="w-5 h-5 text-primary" />
                        <Badge variant="outline" className="text-xs">
                          {insight.insight_type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={insight.status === 'acknowledged' ? 'default' : 'secondary'}>
                          {insight.status === 'acknowledged' ? 'Confirmado' : 'Descartado'}
                        </Badge>
                        <Badge variant={getSeverityColor(insight.severity)}>
                          <SeverityIcon className="w-3 h-3 mr-1" />
                          {insight.severity}
                        </Badge>
                      </div>
                    </div>
                    <CardTitle className="text-lg leading-tight">{insight.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{insight.description}</p>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Categoria:</span>
                        <div className="flex items-center gap-1">
                          <CategoryIcon className="w-3 h-3" />
                          <span className="text-sm font-medium">{insight.category}</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Processado em:</span>
                        <span className="text-sm font-medium">
                          {insight.confirmed_at ? new Date(insight.confirmed_at).toLocaleDateString('pt-BR') : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {confirmedInsights.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <History className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum insight no histórico</h3>
                <p className="text-muted-foreground">
                  Insights confirmados ou descartados aparecerão aqui.
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
                  onClick={() => confirmInsight(selectedInsight.id)}
                  disabled={selectedInsight.status !== 'active'}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirmar
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => dismissInsight(selectedInsight.id)}
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

      <ClearInsightsModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={clearAllInsights}
        companyName={company?.name || 'N/A'}
        insightsCount={insights.length + confirmedInsights.length}
        loading={clearingInsights}
      />
    </div>
  );
};