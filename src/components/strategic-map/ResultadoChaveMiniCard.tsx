import React from 'react';
import { KeyResult } from '@/types/strategic-map';
import { MonthlyPerformanceIndicators } from './MonthlyPerformanceIndicators';
import { formatValueWithUnit } from '@/lib/utils';
import { useKRMetrics } from '@/hooks/useKRMetrics';
import { Badge } from '@/components/ui/badge';
import { usePeriodFilter } from '@/hooks/usePeriodFilter';

interface ResultadoChaveMiniCardProps {
  resultadoChave: KeyResult;
  pillar?: { name: string; color: string } | null;
  onUpdate?: () => void;
  onOpenDetails?: (keyResult: KeyResult) => void;
}

export const ResultadoChaveMiniCard = ({ 
  resultadoChave, 
  pillar, 
  onUpdate, 
  onOpenDetails
}: ResultadoChaveMiniCardProps) => {
  // Consumir período globalmente do contexto
  const {
    periodType: selectedPeriod,
    selectedMonth,
    selectedYear,
    selectedQuarter,
    selectedQuarterYear,
    selectedMonthYear,
    selectedSemester,
    selectedSemesterYear,
    selectedBimonth,
    selectedBimonthYear
  } = usePeriodFilter();

  // Usar useKRMetrics com todos os parâmetros de período
  const metrics = useKRMetrics(resultadoChave, { 
    selectedMonth: selectedPeriod === 'monthly' ? selectedMonth : undefined,
    selectedYear: selectedPeriod === 'monthly' ? selectedMonthYear 
                : selectedPeriod === 'yearly' ? selectedYear 
                : undefined,
    selectedQuarter: selectedPeriod === 'quarterly' ? selectedQuarter : undefined,
    selectedQuarterYear: selectedPeriod === 'quarterly' ? selectedQuarterYear : undefined,
    selectedSemester: selectedPeriod === 'semesterly' ? selectedSemester : undefined,
    selectedSemesterYear: selectedPeriod === 'semesterly' ? selectedSemesterYear : undefined,
    selectedBimonth: selectedPeriod === 'bimonthly' ? selectedBimonth : undefined,
    selectedBimonthYear: selectedPeriod === 'bimonthly' ? selectedBimonthYear : undefined,
  });
  
  // Calcular progresso baseado no período selecionado
  const getMetricsForPeriod = (field: 'actual' | 'target' | 'percentage') => {
    switch (selectedPeriod) {
      case 'quarterly': return metrics.quarterly[field];
      case 'monthly': return metrics.monthly[field];
      case 'yearly': return metrics.yearly[field];
      case 'semesterly': return metrics.semesterly[field];
      case 'bimonthly': return metrics.bimonthly[field];
      default: return metrics.ytd[field];
    }
  };

  const rawActual = getMetricsForPeriod('actual');
  const isNullData = rawActual === null || rawActual === undefined;
  const currentValue = rawActual ?? 0;
  const targetValue = getMetricsForPeriod('target') ?? 0;
  const rawPercentage = getMetricsForPeriod('percentage');
  const percentage = (rawPercentage ?? 0) as number;
  
  // Determine status color based on percentage
  const getStatusColor = (pct: number) => {
    if (pct > 105) return 'text-blue-600';
    if (pct >= 100) return 'text-green-600';
    if (pct >= 71) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const statusColor = isNullData ? 'text-gray-400' : getStatusColor(percentage);

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenDetails) {
      onOpenDetails(resultadoChave);
    }
  };

  return (
    <div 
      className="border rounded-lg overflow-hidden hover:shadow-sm transition-all cursor-pointer group"
      onClick={handleCardClick}
    >
      <div className="flex">
        {/* Barra lateral colorida com a cor do pilar */}
        {pillar && (
          <div 
            className="w-1.5 flex-shrink-0 transition-all duration-300 group-hover:w-2" 
            style={{ backgroundColor: pillar.color }}
          />
        )}
          <div className="flex-1 p-3 hover:bg-muted/50 transition-colors">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-sm truncate flex-1">{resultadoChave.title}</h4>
                  {(resultadoChave.weight && resultadoChave.weight > 1) && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 flex-shrink-0 bg-muted/50">
                      P:{resultadoChave.weight}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Atual: {formatValueWithUnit(Number(currentValue.toFixed(1)), resultadoChave.unit)}</span>
                  <span>•</span>
                  <span>Meta: {formatValueWithUnit(targetValue, resultadoChave.unit)}</span>
                </div>
                <MonthlyPerformanceIndicators
                  monthlyTargets={resultadoChave.monthly_targets}
                  monthlyActual={resultadoChave.monthly_actual}
                  targetDirection={resultadoChave.target_direction || 'maximize'}
                  frequency={resultadoChave.frequency || 'monthly'}
                  size="sm"
                />
              </div>
            </div>
            <div className="flex flex-col items-end flex-shrink-0">
              <span className={`text-sm font-medium ${statusColor}`}>
                {isNullData ? 'N/A' : `${percentage.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
