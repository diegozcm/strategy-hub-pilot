import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAIInsights, AIInsight, AIRecommendation } from '@/hooks/useAIInsights';
import {
  Brain,
  AlertTriangle,
  TrendingUp,
  Info,
  Sparkles,
  RefreshCw,
  X,
  Check,
  Clock,
  Filter,
  BarChart3,
  Target,
  Briefcase,
  Lightbulb,
  CheckCircle,
  XCircle,
  PlayCircle,
  Archive
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const AIInsightsPage: React.FC = () => {
  const {
    insights,
    recommendations,
    loading,
    generating,
    generateInsights,
    updateInsightStatus,
    confirmInsight,
    updateRecommendationStatus,
    getActiveInsights,
    getCriticalInsights,
    getInsightsStats
  } = useAIInsights();

  const [filterType, setFilterType] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const stats = getInsightsStats();
  const activeInsights = getActiveInsights();
  const criticalInsights = getCriticalInsights();

  // Filter insights
  const filteredInsights = insights.filter((insight) => {
    if (filterType !== 'all' && insight.insight_type !== filterType) return false;
    if (filterSeverity !== 'all' && insight.severity !== filterSeverity) return false;
    if (filterCategory !== 'all' && insight.category !== filterCategory) return false;
    return true;
  });

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'risk':
        return <AlertTriangle className="h-5 w-5" />;
      case 'opportunity':
        return <TrendingUp className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'projects':
        return <Briefcase className="h-4 w-4" />;
      case 'indicators':
        return <BarChart3 className="h-4 w-4" />;
      case 'objectives':
        return <Target className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 border-blue-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'risk':
        return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/50 border-red-200';
      case 'opportunity':
        return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950/50 border-green-200';
      default:
        return 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/50 border-blue-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'dismissed':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      case 'in_progress':
        return <PlayCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const InsightCard: React.FC<{ insight: AIInsight }> = ({ insight }) => (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={cn(
              "flex items-center justify-center w-10 h-10 rounded-lg border",
              getTypeColor(insight.insight_type)
            )}>
              {getInsightIcon(insight.insight_type)}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  {insight.title}
                </h3>
                {insight.confirmed_at && (
                  <Badge variant="outline" className="text-xs">
                    Confirmado
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2 mb-2">
                <Badge className={cn("text-xs border", getSeverityColor(insight.severity))}>
                  {insight.severity === 'critical' && 'Crítico'}
                  {insight.severity === 'high' && 'Alto'}  
                  {insight.severity === 'medium' && 'Médio'}
                  {insight.severity === 'low' && 'Baixo'}
                </Badge>
                
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  {getCategoryIcon(insight.category)}
                  <span className="capitalize">{insight.category}</span>
                </div>
                
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  {getStatusIcon(insight.status)}
                  <span className="capitalize">{insight.status === 'active' ? 'Ativo' : insight.status}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              Confiança: {Math.round((insight.confidence_score || 0.5) * 100)}%
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {insight.description}
        </p>
        
        {insight.metadata && (
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <h4 className="text-xs font-medium text-gray-900 dark:text-gray-100 mb-2">
              Detalhes Adicionais
            </h4>
            <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-x-auto">
              {JSON.stringify(insight.metadata, null, 2)}
            </pre>
          </div>
        )}
        
        {insight.status === 'active' && (
          <div className="flex items-center gap-2">
            {!insight.confirmed_at && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => confirmInsight(insight.id)}
                className="text-xs"
              >
                <Check className="h-3 w-3 mr-1" />
                Confirmar
              </Button>
            )}
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateInsightStatus(insight.id, 'resolved')}
              className="text-xs text-green-600 hover:text-green-700 border-green-200 hover:border-green-300"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Resolver
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => updateInsightStatus(insight.id, 'dismissed')}
              className="text-xs text-gray-500 hover:text-gray-600"
            >
              <XCircle className="h-3 w-3 mr-1" />
              Descartar
            </Button>
          </div>
        )}
        
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <span className="text-xs text-gray-500">
            {new Date(insight.created_at).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
          
          <Badge variant="outline" className="text-xs">
            {insight.insight_type === 'risk' ? 'Risco' : 
             insight.insight_type === 'opportunity' ? 'Oportunidade' : 'Informação'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );

  const RecommendationCard: React.FC<{ recommendation: AIRecommendation }> = ({ recommendation }) => (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
              <Lightbulb className="h-4 w-4" />
            </div>
            
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                {recommendation.title}
              </h4>
              
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs">
                  {recommendation.priority === 'high' ? 'Alta Prioridade' :
                   recommendation.priority === 'medium' ? 'Média Prioridade' : 'Baixa Prioridade'}
                </Badge>
                
                <Badge variant="secondary" className="text-xs">
                  {recommendation.estimated_impact === 'high' ? 'Alto Impacto' :
                   recommendation.estimated_impact === 'medium' ? 'Médio Impacto' : 'Baixo Impacto'}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {getStatusIcon(recommendation.status)}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          {recommendation.description}
        </p>
        
        <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
          <div>
            <span className="font-medium text-gray-900 dark:text-gray-100">Esforço: </span>
            <span className="text-gray-600 dark:text-gray-400">
              {recommendation.effort_required === 'high' ? 'Alto' :
               recommendation.effort_required === 'medium' ? 'Médio' : 'Baixo'}
            </span>
          </div>
          
          <div>
            <span className="font-medium text-gray-900 dark:text-gray-100">Tipo: </span>
            <span className="text-gray-600 dark:text-gray-400 capitalize">
              {recommendation.action_type}
            </span>
          </div>
        </div>
        
        {recommendation.status === 'pending' && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => updateRecommendationStatus(recommendation.id, 'in_progress')}
              className="text-xs"
            >
              <PlayCircle className="h-3 w-3 mr-1" />
              Iniciar
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateRecommendationStatus(recommendation.id, 'completed')}
              className="text-xs"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Marcar como Concluído
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="h-8 w-8 text-purple-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Insights de IA
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Análise inteligente dos seus dados estratégicos
            </p>
          </div>
          <Sparkles className="h-6 w-6 text-yellow-500" />
        </div>
        
        <Button
          onClick={generateInsights}
          disabled={generating}
          className="flex items-center gap-2"
        >
          {generating ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {generating ? 'Gerando Insights...' : 'Gerar Novos Insights'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Ativo</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
              <Brain className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Críticos</p>
                <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Riscos</p>
                <p className="text-2xl font-bold text-red-500">{stats.risks}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Oportunidades</p>
                <p className="text-2xl font-bold text-green-600">{stats.opportunities}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Tipo</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="risk">Riscos</SelectItem>
                  <SelectItem value="opportunity">Oportunidades</SelectItem>
                  <SelectItem value="info">Informações</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Severidade</label>
              <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as severidades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="critical">Crítico</SelectItem>
                  <SelectItem value="high">Alto</SelectItem>
                  <SelectItem value="medium">Médio</SelectItem>
                  <SelectItem value="low">Baixo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Categoria</label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="projects">Projetos</SelectItem>
                  <SelectItem value="indicators">Indicadores</SelectItem>
                  <SelectItem value="objectives">Objetivos</SelectItem>
                  <SelectItem value="strategic">Estratégico</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Tabs */}
      <Tabs defaultValue="insights" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="insights">
            Insights ({filteredInsights.length})
          </TabsTrigger>
          <TabsTrigger value="recommendations">
            Recomendações ({recommendations.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="insights" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-3 text-gray-500">Carregando insights...</span>
            </div>
          ) : filteredInsights.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Brain className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">
                  Nenhum insight encontrado com os filtros aplicados
                </p>
                <Button onClick={generateInsights} disabled={generating}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Gerar Insights
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredInsights.map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="recommendations" className="space-y-4">
          {recommendations.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Lightbulb className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  Nenhuma recomendação disponível
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {recommendations.map((recommendation) => (
                <RecommendationCard key={recommendation.id} recommendation={recommendation} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};