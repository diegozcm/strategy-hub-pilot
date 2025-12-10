import React from 'react';
import { KeyResult } from '@/types/strategic-map';
import { MonthlyPerformanceIndicators } from './MonthlyPerformanceIndicators';
import { formatValueWithUnit } from '@/lib/utils';
import { useKRMetrics } from '@/hooks/useKRMetrics';

interface ResultadoChaveMiniCardProps {
  resultadoChave: KeyResult;
  pillar?: { name: string; color: string } | null;
  onUpdate?: () => void;
  onOpenDetails?: (keyResult: KeyResult) => void;
  selectedPeriod?: 'ytd' | 'monthly' | 'yearly' | 'quarterly' | 'semesterly';
  selectedMonth?: number;
  selectedYear?: number;
  selectedQuarter?: 1 | 2 | 3 | 4;
  selectedQuarterYear?: number;
}

export const ResultadoChaveMiniCard = ({ 
  resultadoChave, 
  pillar, 
  onUpdate, 
  onOpenDetails,
  selectedPeriod = 'ytd',
  selectedMonth,
  selectedYear,
  selectedQuarter,
  selectedQuarterYear
}: ResultadoChaveMiniCardProps) => {
  // Usar useKRMetrics para obter valores corretos baseado no período e mês/ano selecionados
  const metrics = useKRMetrics(resultadoChave, { 
    selectedMonth, 
    selectedYear,
    selectedQuarter,
    selectedQuarterYear
  });
  
  // Calcular progresso baseado no período selecionado
  const currentValue = selectedPeriod === 'quarterly'
    ? metrics.quarterly.actual
    : selectedPeriod === 'monthly' 
    ? metrics.monthly.actual
    : selectedPeriod === 'yearly'
    ? metrics.yearly.actual
    : metrics.ytd.actual;
    
  const targetValue = selectedPeriod === 'quarterly'
    ? metrics.quarterly.target
    : selectedPeriod === 'monthly'
    ? metrics.monthly.target
    : selectedPeriod === 'yearly'
    ? metrics.yearly.target
    : metrics.ytd.target;
  
  const percentage = selectedPeriod === 'quarterly'
    ? metrics.quarterly.percentage
    : selectedPeriod === 'monthly'
    ? metrics.monthly.percentage
    : selectedPeriod === 'yearly'
    ? metrics.yearly.percentage
    : metrics.ytd.percentage;
  
  // Determine status color based on percentage (already calculated in DB)
  const getStatusColor = (pct: number) => {
    if (pct > 105) return 'text-blue-600';
    if (pct >= 100) return 'text-green-600';
    if (pct >= 71) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const statusColor = getStatusColor(percentage);

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
                <h4 className="font-medium text-sm truncate">{resultadoChave.title}</h4>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Atual: {formatValueWithUnit(Number(currentValue.toFixed(1)), resultadoChave.unit)}</span>
                  <span>•</span>
                  <span>Meta: {formatValueWithUnit(targetValue, resultadoChave.unit)}</span>
                </div>
                <MonthlyPerformanceIndicators
                  monthlyTargets={resultadoChave.monthly_targets}
                  monthlyActual={resultadoChave.monthly_actual}
                  targetDirection={resultadoChave.target_direction || 'maximize'}
                  size="sm"
                />
              </div>
            </div>
            <div className="flex flex-col items-end flex-shrink-0">
              <span className={`text-sm font-medium ${statusColor}`}>
                {percentage.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};