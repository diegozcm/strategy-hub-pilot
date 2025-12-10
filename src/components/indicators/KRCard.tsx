import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { KeyResult } from '@/types/strategic-map';
import { MonthlyPerformanceIndicators } from '@/components/strategic-map/MonthlyPerformanceIndicators';
import { formatValueWithUnit, cn } from '@/lib/utils';
import { useKRMetrics } from '@/hooks/useKRMetrics';
import { User } from 'lucide-react';

interface KRCardProps {
  keyResult: KeyResult;
  pillar: {
    name: string;
    color: string;
  };
  selectedPeriod: 'ytd' | 'monthly' | 'yearly' | 'quarterly' | 'semesterly';
  selectedMonth?: number;
  selectedYear?: number;
  selectedQuarter?: 1 | 2 | 3 | 4;
  onClick: () => void;
  isOwned?: boolean;
}

export const KRCard: React.FC<KRCardProps> = ({
  keyResult,
  pillar,
  selectedPeriod,
  selectedMonth,
  selectedYear,
  selectedQuarter,
  onClick,
  isOwned = false,
}) => {
  const metrics = useKRMetrics(keyResult, {
    selectedMonth,
    selectedYear,
    selectedQuarter,
  });
  
  const currentMetrics = 
    selectedPeriod === 'quarterly' ? metrics.quarterly :
    selectedPeriod === 'monthly' ? metrics.monthly :
    selectedPeriod === 'yearly' ? metrics.yearly :
    metrics.ytd;
  
  const periodLabel = 
    selectedPeriod === 'quarterly' 
      ? `Q${selectedQuarter}`
      : selectedPeriod === 'monthly' 
      ? (selectedMonth && selectedYear 
          ? new Date(selectedYear, selectedMonth - 1, 1).toLocaleDateString('pt-BR', { month: 'short' })
            .charAt(0).toUpperCase() + 
            new Date(selectedYear, selectedMonth - 1, 1).toLocaleDateString('pt-BR', { month: 'short' })
            .slice(1)
          : 'Mês')
      : selectedPeriod === 'yearly' ? 'Anual'
      : 'YTD';

  const progress = currentMetrics.percentage;

  const getProgressBarColor = (value: number): string => {
    if (value > 105) return 'bg-blue-500';
    if (value >= 100) return 'bg-green-500';
    if (value >= 71) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card 
      className={cn(
        "h-full cursor-pointer hover:shadow-lg transition-all overflow-hidden",
        isOwned && "ring-2 ring-primary ring-offset-2"
      )}
      onClick={onClick}
    >
      {/* Header com cor do pilar */}
      <div 
        style={{ backgroundColor: pillar.color }}
        className="p-3 relative"
      >
        {isOwned && (
          <Badge className="absolute top-2 right-2 bg-white/90 text-primary hover:bg-white">
            <User className="w-3 h-3 mr-1" />
            Meu KR
          </Badge>
        )}
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
          <span className="text-xs font-bold text-foreground">{progress.toFixed(1)}%</span>
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
            <p className="text-xs font-semibold">
              {formatValueWithUnit(currentMetrics.actual, keyResult.unit)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Meta {periodLabel}</p>
            <p className="text-xs font-semibold">
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
