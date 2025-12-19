import React, { useMemo } from 'react';
import { CheckCircle2, Circle, Triangle, XCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { calculateKRStatus, type TargetDirection } from '@/lib/krHelpers';
import { getPeriodsForFrequency, type KRFrequency } from '@/lib/krFrequencyHelpers';

interface MonthlyPerformanceIndicatorsProps {
  monthlyTargets?: Record<string, number>;
  monthlyActual?: Record<string, number>;
  selectedYear?: number;
  size?: 'sm' | 'md';
  targetDirection?: TargetDirection;
  frequency?: KRFrequency;
}

const getMonthPerformanceColor = (progress: number): string => {
  if (progress > 105) return 'blue';    // Excelente (superou a meta)
  if (progress >= 100) return 'green';  // Sucesso (no alvo)
  if (progress >= 71) return 'yellow';  // Atenção (próximo da meta)
  if (progress > 0) return 'red';       // Crítico (abaixo da meta)
  return 'gray';                        // Sem dados
};

const getIconByPerformance = (progress: number, size: number) => {
  const iconSize = size;
  
  if (progress > 105) {
    return <CheckCircle2 size={iconSize} className="text-blue-500" />;
  }
  if (progress >= 100) {
    return <Circle size={iconSize} className="text-green-500 fill-green-500" />;
  }
  if (progress >= 71) {
    return <Triangle size={iconSize} className="text-yellow-500 fill-yellow-500" />;
  }
  if (progress > 0) {
    return <XCircle size={iconSize} className="text-red-500" />;
  }
  return <Circle size={iconSize} className="text-gray-300" />;
};

export const MonthlyPerformanceIndicators: React.FC<MonthlyPerformanceIndicatorsProps> = ({
  monthlyTargets = {},
  monthlyActual = {},
  selectedYear = new Date().getFullYear(),
  size = 'sm',
  targetDirection = 'maximize',
  frequency = 'monthly',
}) => {
  const iconSize = size === 'sm' ? 14 : 18;

  const periodData = useMemo(() => {
    const periods = getPeriodsForFrequency(frequency, selectedYear);
    
    return periods.map(period => {
      // Para frequências não-mensais, ler do primeiro mês do período
      const firstMonthKey = period.monthKeys[0];
      const target = monthlyTargets[firstMonthKey] || 0;
      const actual = monthlyActual[firstMonthKey] || 0;
      const status = target > 0 ? calculateKRStatus(actual, target, targetDirection) : { percentage: 0 };
      const progress = status.percentage;
      const color = getMonthPerformanceColor(progress);

      return {
        periodKey: period.key,
        periodLabel: period.label,
        shortLabel: period.shortLabel,
        target,
        actual,
        progress,
        color,
      };
    });
  }, [monthlyTargets, monthlyActual, selectedYear, targetDirection, frequency]);

  return (
    <TooltipProvider>
      <div className="flex gap-1 items-center flex-wrap">
        {periodData.map(({ periodKey, periodLabel, target, actual, progress }) => (
          <Tooltip key={periodKey}>
            <TooltipTrigger asChild>
              <div className="cursor-help">
                {getIconByPerformance(progress, iconSize)}
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <div className="space-y-1">
                <p className="font-semibold">{periodLabel}</p>
                {target !== 0 ? (
                  <>
                    <p>Previsto: {Number(target).toFixed(1)}</p>
                    <p>Realizado: {Number(actual).toFixed(1)}</p>
                    <p className="font-semibold">Atingimento: {Number(progress).toFixed(1)}%</p>
                  </>
                ) : (
                  <p className="text-muted-foreground">Sem dados para este período</p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
};
