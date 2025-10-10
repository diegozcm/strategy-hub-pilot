import React, { useMemo } from 'react';
import { CheckCircle2, Circle, Triangle, XCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MonthlyPerformanceIndicatorsProps {
  monthlyTargets?: Record<string, number>;
  monthlyActual?: Record<string, number>;
  selectedYear?: number;
  size?: 'sm' | 'md';
}

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MONTH_NAMES = {
  jan: 'Janeiro',
  fev: 'Fevereiro',
  mar: 'Março',
  abr: 'Abril',
  mai: 'Maio',
  jun: 'Junho',
  jul: 'Julho',
  ago: 'Agosto',
  set: 'Setembro',
  out: 'Outubro',
  nov: 'Novembro',
  dez: 'Dezembro',
};

const getMonthPerformanceColor = (progress: number): string => {
  if (progress > 105) return 'blue';      // Superado
  if (progress >= 91) return 'green';     // No Alvo
  if (progress >= 71) return 'yellow';    // Atenção
  if (progress > 0) return 'red';         // Crítico
  return 'gray';                          // Sem dados
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
}) => {
  const iconSize = size === 'sm' ? 14 : 18;

  const monthlyData = useMemo(() => {
    return MONTHS.map((month) => {
      const target = monthlyTargets[month] || 0;
      const actual = monthlyActual[month] || 0;
      const progress = target > 0 ? (actual / target) * 100 : 0;
      const color = getMonthPerformanceColor(progress);

      return {
        month,
        target,
        actual,
        progress,
        color,
      };
    });
  }, [monthlyTargets, monthlyActual]);

  return (
    <TooltipProvider>
      <div className="flex gap-1 items-center flex-wrap">
        {monthlyData.map(({ month, target, actual, progress }) => (
          <Tooltip key={month}>
            <TooltipTrigger asChild>
              <div className="cursor-help">
                {getIconByPerformance(progress, iconSize)}
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <div className="space-y-1">
                <p className="font-semibold">{MONTH_NAMES[month as keyof typeof MONTH_NAMES]}</p>
                {target > 0 ? (
                  <>
                    <p>Previsto: {target.toFixed(1)}</p>
                    <p>Realizado: {actual.toFixed(1)}</p>
                    <p className="font-semibold">Atingimento: {progress.toFixed(1)}%</p>
                  </>
                ) : (
                  <p className="text-muted-foreground">Sem dados</p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
};
