import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { KeyResult } from '@/types/strategic-map';
import { MonthlyPerformanceIndicators } from '@/components/strategic-map/MonthlyPerformanceIndicators';
import { formatValueWithUnit } from '@/lib/utils';
import { useKRMetrics } from '@/hooks/useKRMetrics';

interface KRCardProps {
  keyResult: KeyResult;
  pillar: {
    name: string;
    color: string;
  };
  selectedPeriod: 'ytd' | 'monthly' | 'yearly';
  onClick: () => void;
}

export const KRCard: React.FC<KRCardProps> = ({
  keyResult,
  pillar,
  selectedPeriod,
  onClick,
}) => {
  const metrics = useKRMetrics(keyResult);
  
  const currentMetrics = 
    selectedPeriod === 'monthly' ? metrics.monthly :
    selectedPeriod === 'yearly' ? metrics.yearly :
    metrics.ytd;
  
  const periodLabel = 
    selectedPeriod === 'monthly' ? 'Mês Atual' :
    selectedPeriod === 'yearly' ? 'Anual' :
    'YTD';

  const progress = currentMetrics.percentage;

  const getProgressBarColor = (value: number): string => {
    if (value < 30) return 'bg-red-500';
    if (value < 60) return 'bg-yellow-500';
    if (value < 80) return 'bg-blue-500';
    return 'bg-green-500';
  };

  return (
    <Card 
      className="h-full cursor-pointer hover:shadow-lg transition-all overflow-hidden"
      onClick={onClick}
    >
      {/* Header com cor do pilar */}
      <div 
        style={{ backgroundColor: pillar.color }}
        className="p-3"
      >
        <div className="flex-1 min-w-0 space-y-2">
          <h3 className="text-white font-semibold text-base leading-tight">
            {keyResult.title}
          </h3>
          <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30 text-xs">
            {pillar.name}
          </Badge>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Atingimento da Meta */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-muted-foreground">Atingimento {periodLabel}</span>
          <span className="text-xs font-bold text-foreground">{Math.round(progress)}%</span>
        </div>

        {/* Barra de progresso */}
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
          <div 
            className={`h-full transition-all duration-300 rounded-full ${getProgressBarColor(progress)}`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>

        {/* Indicadores mensais */}
        <div className="pt-2">
          <MonthlyPerformanceIndicators
            monthlyTargets={keyResult.monthly_targets}
            monthlyActual={keyResult.monthly_actual}
            targetDirection={keyResult.target_direction || 'maximize'}
            size="sm"
          />
        </div>

        {/* Valores lado a lado */}
        <div className="flex justify-between pt-2">
          <div>
            <p className="text-xs text-muted-foreground">Indicador {periodLabel}</p>
            <p className="text-base font-semibold">
              {formatValueWithUnit(currentMetrics.actual, keyResult.unit)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Meta {periodLabel}</p>
            <p className="text-base font-semibold">
              {formatValueWithUnit(currentMetrics.target, keyResult.unit)}
            </p>
          </div>
        </div>

        {/* Última atualização */}
        <p className="text-xs text-primary pt-1">
          Última atualização: {new Date(keyResult.updated_at).toLocaleDateString('pt-BR')}
        </p>
      </div>
    </Card>
  );
};
