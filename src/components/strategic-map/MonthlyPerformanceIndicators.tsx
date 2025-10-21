import React, { useMemo } from 'react';
import { CheckCircle2, Circle, Triangle, XCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { calculateKRStatus, type TargetDirection } from '@/lib/krHelpers';

interface MonthlyPerformanceIndicatorsProps {
  monthlyTargets?: Record<string, number>;
  monthlyActual?: Record<string, number>;
  selectedYear?: number;
  size?: 'sm' | 'md';
  targetDirection?: TargetDirection;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const getMonthPerformanceColor = (progress: number): string => {
  if (progress > 105) return 'blue';    // Superado
  if (progress >= 91) return 'green';   // No Alvo
  if (progress >= 71) return 'yellow';  // Atenção
  if (progress > 0) return 'red';       // Crítico
  return 'gray';                        // Sem dados
};

const getIconByPerformance = (progress: number, size: number) => {
  const iconSize = size;
  
  if (progress > 105) {
    return <CheckCircle2 size={iconSize} className="text-blue-500" />;
  }
  if (progress >= 91) {
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
}) => {
  const iconSize = size === 'sm' ? 14 : 18;

  const monthlyData = useMemo(() => {
    // Generate 12 months in YYYY-MM format for the selected year
    return Array.from({ length: 12 }, (_, i) => {
      const monthIndex = i + 1;
      const monthKey = `${selectedYear}-${monthIndex.toString().padStart(2, '0')}`; // e.g., "2025-01"
      const monthName = MONTH_NAMES[i];
      
      const target = monthlyTargets[monthKey] || 0;
      const actual = monthlyActual[monthKey] || 0;
      const status = target > 0 ? calculateKRStatus(actual, target, targetDirection) : { percentage: 0 };
      const progress = status.percentage;
      const color = getMonthPerformanceColor(progress);

      return {
        monthKey,
        monthName,
        target,
        actual,
        progress,
        color,
      };
    });
  }, [monthlyTargets, monthlyActual, selectedYear, targetDirection]);

  return (
    <TooltipProvider>
      <div className="flex gap-1 items-center flex-wrap">
        {monthlyData.map(({ monthKey, monthName, target, actual, progress }) => (
          <Tooltip key={monthKey}>
            <TooltipTrigger asChild>
              <div className="cursor-help">
                {getIconByPerformance(progress, iconSize)}
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <div className="space-y-1">
                <p className="font-semibold">{monthName}</p>
                {target !== 0 ? (
                  <>
                    <p>Previsto: {Number(target).toFixed(1)}</p>
                    <p>Realizado: {Number(actual).toFixed(1)}</p>
                    <p className="font-semibold">Atingimento: {Number(progress).toFixed(1)}%</p>
                  </>
                ) : (
                  <p className="text-muted-foreground">Sem dados para este mês</p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
};
