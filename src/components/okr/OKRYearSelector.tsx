import { Button } from '@/components/ui/button';
import { OKRYear } from '@/types/okr';
import { cn } from '@/lib/utils';
import { Calendar } from 'lucide-react';

interface OKRYearSelectorProps {
  years: OKRYear[];
  selectedYear: OKRYear | null;
  onSelectYear: (year: OKRYear) => void;
}

/**
 * Componente seletor de anos OKR
 */
export const OKRYearSelector = ({ years, selectedYear, onSelectYear }: OKRYearSelectorProps) => {
  // Ordenar anos do mais recente para o mais antigo
  const sortedYears = [...years].sort((a, b) => b.year - a.year);

  return (
    <div className="flex gap-2 flex-wrap items-center">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground mr-2">Ano:</span>
      {sortedYears.map((year) => {
        const isSelected = selectedYear?.id === year.id;
        const isActive = year.status === 'active';

        return (
          <Button
            key={year.id}
            variant={isSelected ? 'default' : 'outline'}
            className={cn('relative', isActive && !isSelected && 'border-primary')}
            onClick={() => onSelectYear(year)}
          >
            {year.year}
            {isActive && (
              <span className="ml-2 h-2 w-2 rounded-full bg-green-500" />
            )}
            {isSelected && (
              <span className="text-xs opacity-80 ml-2">
                {year.overall_progress_percentage.toFixed(0)}%
              </span>
            )}
          </Button>
        );
      })}
    </div>
  );
};
