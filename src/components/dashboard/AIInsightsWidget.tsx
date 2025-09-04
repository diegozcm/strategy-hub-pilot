import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAIInsights } from '@/hooks/useAIInsights';
import {
  Brain,
  AlertTriangle,
  TrendingUp,
  Info,
  Sparkles,
  ChevronRight,
  RefreshCw,
  X,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIInsightsWidgetProps {
  onViewAll?: () => void;
}

export const AIInsightsWidget: React.FC<AIInsightsWidgetProps> = ({ onViewAll }) => {
  const {
    insights,
    loading,
    generating,
    generateInsights,
    updateInsightStatus,
    getActiveInsights,
    getCriticalInsights,
    getInsightsStats
  } = useAIInsights();

  const activeInsights = getActiveInsights();
  const criticalInsights = getCriticalInsights();
  const stats = getInsightsStats();

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'risk':
        return <AlertTriangle className="h-4 w-4" />;
      case 'opportunity':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'risk':
        return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/50';
      case 'opportunity':
        return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950/50';
      default:
        return 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/50';
    }
  };

  const topInsights = activeInsights.slice(0, 3);

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-lg">Insights de IA</CardTitle>
            <Sparkles className="h-4 w-4 text-yellow-500" />
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={generateInsights}
              disabled={generating}
              className="text-xs"
            >
              {generating ? (
                <RefreshCw className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <Sparkles className="h-3 w-3 mr-1" />
              )}
              {generating ? 'Gerando...' : 'Gerar'}
            </Button>
            {onViewAll && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onViewAll}
                className="text-xs"
              >
                Ver Todos
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            )}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-4 gap-2 pt-2">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {stats.active}
            </div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-red-600">
              {stats.critical}
            </div>
            <div className="text-xs text-gray-500">Críticos</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-red-500">
              {stats.risks}
            </div>
            <div className="text-xs text-gray-500">Riscos</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">
              {stats.opportunities}
            </div>
            <div className="text-xs text-gray-500">Oportunidades</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-sm text-gray-500">Carregando insights...</span>
          </div>
        ) : topInsights.length === 0 ? (
          <div className="text-center py-8">
            <Brain className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-3">
              Nenhum insight disponível
            </p>
            <Button
              size="sm"
              onClick={generateInsights}
              disabled={generating}
              className="text-xs"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Gerar Insights
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {topInsights.map((insight, index) => (
              <div key={insight.id}>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full shrink-0",
                    getTypeColor(insight.insight_type)
                  )}>
                    {getInsightIcon(insight.insight_type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {insight.title}
                      </h4>
                      <Badge
                        variant="secondary"
                        className={cn("text-xs px-1.5 py-0.5", getSeverityColor(insight.severity))}
                      >
                        {insight.severity === 'critical' && 'Crítico'}
                        {insight.severity === 'high' && 'Alto'}
                        {insight.severity === 'medium' && 'Médio'}
                        {insight.severity === 'low' && 'Baixo'}
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                      {insight.description}
                    </p>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateInsightStatus(insight.id, 'resolved')}
                        className="h-6 px-2 text-xs text-green-600 hover:text-green-700"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Resolver
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateInsightStatus(insight.id, 'dismissed')}
                        className="h-6 px-2 text-xs text-gray-500 hover:text-gray-600"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Descartar
                      </Button>
                    </div>
                  </div>
                </div>
                {index < topInsights.length - 1 && (
                  <Separator className="my-2" />
                )}
              </div>
            ))}

            {activeInsights.length > 3 && (
              <div className="pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onViewAll}
                  className="w-full text-xs"
                >
                  Ver mais {activeInsights.length - 3} insights
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Critical Insights Alert */}
        {criticalInsights.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-300">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">
                {criticalInsights.length} insight{criticalInsights.length > 1 ? 's' : ''} crítico{criticalInsights.length > 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              Requer atenção imediata
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};