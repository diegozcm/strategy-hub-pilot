import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, AlertTriangle, CheckCircle, Zap, Target, Users, BarChart3, Clock, ArrowRight, X, Sparkles, History, RefreshCw, Lightbulb, MessageSquare, ExternalLink, ChevronRight } from 'lucide-react';
import { ClearInsightsModal } from './ClearInsightsModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';
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
  const navigate = useNavigate();
  
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
      toast({ title: "Erro", description: "Erro ao carregar dados.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const generateRealInsights = async () => {
    if (!user || !company?.id) return;
    try {
      setGeneratingInsights(true);
      const response = await supabase.functions.invoke('generate-insights', {
        body: { user_id: user.id, company_id: company.id }
      });

      if (response.error) {
        const msg = response.error?.message || '';
        if (msg.includes('429') || msg.includes('rate')) {
          toast({ title: "Limite de requisições", description: "Aguarde alguns segundos e tente novamente.", variant: "destructive" });
          return;
        }
        throw response.error;
      }

      await loadAIData();
      toast({ title: "Diagnóstico Completo", description: `${response.data.insights_generated || 0} insights gerados pelo Atlas!` });
    } catch (error: any) {
      toast({ title: "Erro", description: `Erro ao gerar insights: ${error.message || 'Desconhecido'}`, variant: "destructive" });
    } finally {
      setGeneratingInsights(false);
    }
  };

  const confirmInsight = async (insightId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('ai_insights')
        .update({ status: 'acknowledged', confirmed_at: new Date().toISOString(), confirmed_by: user.id })
        .eq('id', insightId);
      if (error) throw error;
      const insight = insights.find(i => i.id === insightId);
      if (insight) {
        setInsights(prev => prev.filter(i => i.id !== insightId));
        setConfirmedInsights(prev => [{ ...insight, status: 'acknowledged' }, ...prev]);
      }
      toast({ title: "Insight Confirmado", description: "Movido para o histórico." });
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao confirmar insight.", variant: "destructive" });
    }
  };

  const dismissInsight = async (insightId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('ai_insights')
        .update({ status: 'dismissed', confirmed_at: new Date().toISOString(), confirmed_by: user.id })
        .eq('id', insightId);
      if (error) throw error;
      const insight = insights.find(i => i.id === insightId);
      if (insight) {
        setInsights(prev => prev.filter(i => i.id !== insightId));
        setConfirmedInsights(prev => [{ ...insight, status: 'dismissed' }, ...prev]);
      }
      toast({ title: "Insight Descartado", description: "Movido para o histórico." });
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao descartar insight.", variant: "destructive" });
    }
  };

  const clearAllInsights = async () => {
    if (!company?.id) return;
    try {
      setClearingInsights(true);
      const { data: companyInsights, error: fetchError } = await supabase
        .from('ai_insights').select('id').eq('company_id', company.id);
      if (fetchError) throw fetchError;
      const insightIds = companyInsights?.map(i => i.id) || [];
      if (insightIds.length === 0) {
        toast({ title: "Nenhum insight encontrado", description: "Não há insights para deletar." });
        setIsClearModalOpen(false);
        return;
      }
      await supabase.from('ai_recommendations').delete().in('insight_id', insightIds);
      const { error: deleteError } = await supabase.from('ai_insights').delete().eq('company_id', company.id);
      if (deleteError) throw deleteError;
      setInsights([]);
      setConfirmedInsights([]);
      toast({ title: "✅ Insights Limpos", description: `${insightIds.length} insights deletados.` });
      setIsClearModalOpen(false);
    } catch (error: any) {
      toast({ title: "Erro ao limpar", description: error.message || "Erro desconhecido.", variant: "destructive" });
    } finally {
      setClearingInsights(false);
    }
  };

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'critical': return { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', badge: 'destructive' as const, label: 'Crítico' };
      case 'high': return { color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20', badge: 'destructive' as const, label: 'Alto' };
      case 'medium': return { color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', badge: 'secondary' as const, label: 'Médio' };
      case 'low': return { color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', badge: 'outline' as const, label: 'Baixo' };
      default: return { color: 'text-muted-foreground', bg: 'bg-muted/50', border: 'border-border', badge: 'secondary' as const, label: severity };
    }
  };

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'risk': return { icon: AlertTriangle, label: 'Risco', color: 'text-red-500' };
      case 'opportunity': return { icon: TrendingUp, label: 'Oportunidade', color: 'text-emerald-500' };
      case 'recommendation': return { icon: Lightbulb, label: 'Recomendação', color: 'text-blue-500' };
      case 'info': return { icon: BarChart3, label: 'Informação', color: 'text-muted-foreground' };
      default: return { icon: Brain, label: type, color: 'text-primary' };
    }
  };

  const getEntityNavigation = (entityType?: string, entityId?: string) => {
    if (!entityType) return null;
    switch (entityType) {
      case 'key_result': return { label: 'Ver KR', path: '/app/indicators' };
      case 'objective': return { label: 'Ver Objetivo', path: '/app/objectives' };
      case 'project': return { label: 'Ver Projeto', path: '/app/projects' };
      case 'startup': return { label: 'Ver Startup', path: '/app/startups' };
      case 'initiative': return { label: 'Ver Iniciativa', path: '/app/indicators' };
      default: return null;
    }
  };

  const getRecommendations = (insight: AIInsight): string[] => {
    if (insight.metadata?.recommendations && Array.isArray(insight.metadata.recommendations)) {
      return insight.metadata.recommendations.map((r: any) => typeof r === 'string' ? r : r.title || r.action || '');
    }
    return [];
  };

  const criticalCount = insights.filter(i => i.severity === 'critical' || i.severity === 'high').length;
  const avgConfidence = insights.length > 0
    ? Math.round((insights.reduce((acc, i) => acc + i.confidence_score, 0) / insights.length) * 100)
    : 0;

  const renderInsightCard = (insight: AIInsight, isHistory = false) => {
    const severity = getSeverityConfig(insight.severity);
    const type = getTypeConfig(insight.insight_type);
    const TypeIcon = type.icon;
    const entityNav = getEntityNavigation(insight.related_entity_type, insight.related_entity_id);
    const recommendations = getRecommendations(insight);

    return (
      <Card 
        key={insight.id} 
        className={`group transition-all duration-300 hover:shadow-md ${severity.border} border ${isHistory ? 'opacity-70' : ''}`}
      >
        <CardContent className="p-5">
          {/* Header: Atlas avatar + type + severity */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shrink-0">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground">Atlas</span>
                <span className="text-muted-foreground/40">·</span>
                <TypeIcon className={`w-3.5 h-3.5 ${type.color}`} />
                <span className={`text-xs font-medium ${type.color}`}>{type.label}</span>
              </div>
            </div>
            <Badge variant={severity.badge} className="text-[10px] px-1.5 py-0.5">
              {severity.label}
            </Badge>
          </div>

          {/* Title */}
          <h3 className="text-sm font-semibold mb-2 leading-snug">{insight.title}</h3>

          {/* Description - narrative style */}
          <p className="text-sm text-muted-foreground mb-3 leading-relaxed line-clamp-4">
            {insight.description}
          </p>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="mb-3 space-y-1">
              {recommendations.slice(0, 3).map((rec, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <ChevronRight className="w-3 h-3 mt-0.5 shrink-0 text-primary/60" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          )}

          {/* Navigation button */}
          {entityNav && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 px-2 mb-3 text-primary hover:text-primary"
              onClick={(e) => {
                e.stopPropagation();
                navigate(entityNav.path);
              }}
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              {entityNav.label}
            </Button>
          )}

          {/* Footer: confidence + category + actions */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary/60 rounded-full" 
                    style={{ width: `${insight.confidence_score * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">{Math.round(insight.confidence_score * 100)}%</span>
              </div>
              <span className="text-[10px] text-muted-foreground capitalize">{insight.category}</span>
            </div>
            
            {!isHistory && insight.status === 'active' && (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                  onClick={(e) => { e.stopPropagation(); confirmInsight(insight.id); }}
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Confirmar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                  onClick={(e) => { e.stopPropagation(); dismissInsight(insight.id); }}
                >
                  <X className="w-3 h-3 mr-1" />
                  Descartar
                </Button>
              </div>
            )}
            
            {isHistory && (
              <Badge variant="outline" className="text-[10px]">
                {insight.status === 'acknowledged' ? 'Confirmado' : 'Descartado'}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Atlas Hub</h1>
          <p className="text-muted-foreground mt-2">Carregando diagnóstico...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="h-3 bg-muted rounded w-full" />
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            Atlas Hub
          </h1>
          <p className="text-muted-foreground mt-1">Diagnóstico estratégico completo da sua empresa</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-destructive/30 text-destructive hover:bg-destructive/10"
            onClick={() => setIsClearModalOpen(true)}
            disabled={clearingInsights || (insights.length === 0 && confirmedInsights.length === 0)}
          >
            <X className="w-4 h-4 mr-1" />
            Limpar
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={generateRealInsights}
            disabled={generatingInsights}
          >
            {generatingInsights ? (
              <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-1" />
            )}
            Analisar Dados
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Insights Ativos</p>
                <p className="text-3xl font-bold mt-1">{insights.length}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Alertas Críticos</p>
                <p className={`text-3xl font-bold mt-1 ${criticalCount > 0 ? 'text-red-500' : ''}`}>{criticalCount}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${criticalCount > 0 ? 'bg-red-500/10' : 'bg-muted'}`}>
                <AlertTriangle className={`w-5 h-5 ${criticalCount > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Confiança Média</p>
                <p className="text-3xl font-bold mt-1">{avgConfidence}%</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="insights" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="insights">
            Insights Ativos ({insights.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            Histórico ({confirmedInsights.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          {insights.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {insights.map((insight) => renderInsightCard(insight))}
            </div>
          ) : (
            <Card className="text-center py-16">
              <CardContent>
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Nenhum insight ativo</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  O Atlas está pronto para analisar todos os dados da sua empresa e gerar um diagnóstico estratégico completo.
                </p>
                <Button onClick={generateRealInsights} disabled={generatingInsights}>
                  {generatingInsights ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Analisar Dados
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {confirmedInsights.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {confirmedInsights.map((insight) => renderInsightCard(insight, true))}
            </div>
          ) : (
            <Card className="text-center py-16">
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

      {/* Detail Modal */}
      <Dialog open={isInsightModalOpen} onOpenChange={setIsInsightModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedInsight && (
                <>
                  {React.createElement(getTypeConfig(selectedInsight.insight_type).icon, { className: "w-5 h-5" })}
                  {selectedInsight.title}
                </>
              )}
            </DialogTitle>
            <DialogDescription>Análise detalhada do Atlas</DialogDescription>
          </DialogHeader>
          {selectedInsight && (() => {
            const severity = getSeverityConfig(selectedInsight.severity);
            const entityNav = getEntityNavigation(selectedInsight.related_entity_type, selectedInsight.related_entity_id);
            const recommendations = getRecommendations(selectedInsight);

            return (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Tipo</span>
                    <Badge variant="outline" className="block w-fit">{selectedInsight.insight_type}</Badge>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Categoria</span>
                    <Badge variant="outline" className="block w-fit capitalize">{selectedInsight.category}</Badge>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Severidade</span>
                    <Badge variant={severity.badge} className="block w-fit">{severity.label}</Badge>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Confiança</span>
                    <div className="flex items-center gap-2">
                      <Progress value={selectedInsight.confidence_score * 100} className="flex-1 h-2" />
                      <span className="text-sm font-medium">{Math.round(selectedInsight.confidence_score * 100)}%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Descrição</span>
                  <p className="text-sm leading-relaxed">{selectedInsight.description}</p>
                </div>

                {recommendations.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-muted-foreground">Recomendações do Atlas</span>
                    <div className="space-y-1.5">
                      {recommendations.map((rec, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-primary/60" />
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {entityNav && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { navigate(entityNav.path); setIsInsightModalOpen(false); }}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    {entityNav.label}
                  </Button>
                )}

                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    onClick={() => { confirmInsight(selectedInsight.id); setIsInsightModalOpen(false); }}
                    disabled={selectedInsight.status !== 'active'}
                    size="sm"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Confirmar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => { dismissInsight(selectedInsight.id); setIsInsightModalOpen(false); }}
                    disabled={selectedInsight.status !== 'active'}
                    size="sm"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Descartar
                  </Button>
                </div>
              </div>
            );
          })()}
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
