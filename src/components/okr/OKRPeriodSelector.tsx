import { Button } from '@/components/ui/button';
import { OKRPeriod, Quarter } from '@/types/okr';
import { cn } from '@/lib/utils';
import { useCurrentQuarter } from '@/hooks/useCurrentQuarter';
import { useOKRPermissions } from '@/hooks/useOKRPermissions';

interface OKRPeriodSelectorProps {
  periods: OKRPeriod[];
  selectedPeriod: OKRPeriod | null;
  onSelectPeriod: (period: OKRPeriod) => void;
}

/**
 * Componente seletor de trimestres OKR
 */
export const OKRPeriodSelector = ({
  periods,
  selectedPeriod,
  onSelectPeriod,
}: OKRPeriodSelectorProps) => {
  const { getQuarterLabel, isQuarterInFuture } = useCurrentQuarter();
  const { isAdminOrManager } = useOKRPermissions();

  // Ordenar períodos por trimestre
  const sortedPeriods = [...periods].sort((a, b) => {
    const quarterOrder: Record<Quarter, number> = { Q1: 1, Q2: 2, Q3: 3, Q4: 4 };
    return quarterOrder[a.quarter] - quarterOrder[b.quarter];
  });

  const getQuarterColor = (quarter: Quarter): string => {
    const colors: Record<Quarter, string> = {
      Q1: 'border-blue-500 hover:border-blue-600',
      Q2: 'border-green-500 hover:border-green-600',
      Q3: 'border-orange-500 hover:border-orange-600',
      Q4: 'border-purple-500 hover:border-purple-600',
    };
    return colors[quarter];
  };

  return (
    <div className="flex gap-3 flex-wrap">
      {sortedPeriods.map((period) => {
        const yearFromDate = new Date(period.start_date).getFullYear();
        const isFuture = isQuarterInFuture(period.quarter, yearFromDate);
        const isSelected = selectedPeriod?.id === period.id;
        const isActive = period.status === 'active';
        
        // Usuários comuns não podem selecionar períodos futuros
        const isDisabled = !isAdminOrManager && isFuture;

        return (
          <Button
            key={period.id}
            variant={isSelected ? 'default' : 'outline'}
            className={cn(
              'relative border-2 transition-all',
              !isSelected && getQuarterColor(period.quarter),
              isDisabled && 'opacity-50 cursor-not-allowed'
            )}
            onClick={() => !isDisabled && onSelectPeriod(period)}
            disabled={isDisabled}
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold">{period.quarter}</span>
              {isActive && (
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              )}
            </div>
            <div className="text-xs opacity-80 ml-2">
              {period.overall_progress_percentage.toFixed(0)}%
            </div>
          </Button>
        );
      })}
    </div>
  );
};
