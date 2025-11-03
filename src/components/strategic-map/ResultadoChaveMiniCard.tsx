import React from 'react';
import { KeyResult } from '@/types/strategic-map';
import { MonthlyPerformanceIndicators } from './MonthlyPerformanceIndicators';
import { formatValueWithUnit } from '@/lib/utils';

interface ResultadoChaveMiniCardProps {
  resultadoChave: KeyResult;
  pillar?: { name: string; color: string } | null;
  onUpdate?: () => void;
  onOpenDetails?: (keyResult: KeyResult) => void;
  selectedPeriod?: 'ytd' | 'monthly' | 'yearly';
}

export const ResultadoChaveMiniCard = ({ 
  resultadoChave, 
  pillar, 
  onUpdate, 
  onOpenDetails,
  selectedPeriod = 'ytd'
}: ResultadoChaveMiniCardProps) => {
  // Calcular progresso baseado no período selecionado
  const currentValue = selectedPeriod === 'monthly' 
    ? (resultadoChave.current_month_actual || 0)
    : selectedPeriod === 'yearly'
    ? (resultadoChave.yearly_actual || 0)
    : (resultadoChave.ytd_actual || 0);
    
  const targetValue = selectedPeriod === 'monthly'
    ? (resultadoChave.current_month_target || 0)
    : selectedPeriod === 'yearly'
    ? (resultadoChave.yearly_target || 0)
    : (resultadoChave.ytd_target || 0);
  
  const percentage = selectedPeriod === 'monthly'
    ? (resultadoChave.monthly_percentage || 0)
    : selectedPeriod === 'yearly'
    ? (resultadoChave.yearly_percentage || 0)
    : (resultadoChave.ytd_percentage || 0);
  
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