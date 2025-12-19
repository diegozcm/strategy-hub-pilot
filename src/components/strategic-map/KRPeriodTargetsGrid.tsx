import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  KRFrequency, 
  getPeriodsForFrequency, 
  isPeriodInValidity,
  getFrequencyLabel 
} from '@/lib/krFrequencyHelpers';
import { useState } from 'react';

interface KRPeriodTargetsGridProps {
  frequency: KRFrequency;
  year: number;
  targets: Record<string, number>;
  onTargetsChange: (targets: Record<string, number>) => void;
  startMonth?: string | null;
  endMonth?: string | null;
  unit?: string;
  yearlyTotal?: number;
  showYearlyColumn?: boolean;
}

export const KRPeriodTargetsGrid = ({
  frequency,
  year,
  targets,
  onTargetsChange,
  startMonth,
  endMonth,
  unit = '',
  yearlyTotal = 0,
  showYearlyColumn = true
}: KRPeriodTargetsGridProps) => {
  const periods = getPeriodsForFrequency(frequency, year);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>('');

  // Format number to Brazilian locale
  const formatBrazilianNumber = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '';
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Parse Brazilian number format
  const parseBrazilianNumber = (value: string): number | null => {
    if (!value || value.trim() === '') return null;
    const cleaned = value.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  };

  const handleClear = (periodKey: string) => {
    const newTargets = { ...targets };
    delete newTargets[periodKey];
    onTargetsChange(newTargets);
  };

  return (
    <div className="space-y-3">
      <div className={cn(
        "grid gap-4 p-3 bg-muted/30 rounded-lg font-medium text-sm",
        showYearlyColumn 
          ? "grid-cols-[150px_1fr_180px_80px]" 
          : "grid-cols-[150px_1fr_80px]"
      )}>
        <div>Período</div>
        <div className="text-center">Meta</div>
        {showYearlyColumn && <div className="text-center">Meta Anual</div>}
        <div className="text-center">Unidade</div>
      </div>
      
      {periods.map((period) => {
        const isInValidity = isPeriodInValidity(period.key, startMonth, endMonth);
        
        return (
          <div 
            key={period.key} 
            className={cn(
              "grid gap-4 items-center p-3 border rounded-lg",
              showYearlyColumn 
                ? "grid-cols-[150px_1fr_180px_80px]" 
                : "grid-cols-[150px_1fr_80px]",
              isInValidity && "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
            )}
          >
            <div>
              <Label className="text-sm font-medium">{period.shortLabel}</Label>
              {frequency !== 'monthly' && (
                <p className="text-xs text-muted-foreground">
                  {period.monthKeys.length} meses
                </p>
              )}
            </div>
            <div className="flex gap-1 items-center">
              <Input
                type="text"
                placeholder="0,00"
                value={editingField === period.key ? tempValue : formatBrazilianNumber(targets[period.key])}
                onFocus={() => {
                  setEditingField(period.key);
                  setTempValue(targets[period.key]?.toString() || '');
                }}
                onChange={(e) => setTempValue(e.target.value)}
                onBlur={() => {
                  const value = parseBrazilianNumber(tempValue);
                  if (value !== null) {
                    onTargetsChange({
                      ...targets,
                      [period.key]: value
                    });
                  } else if (tempValue === '') {
                    handleClear(period.key);
                  }
                  setEditingField(null);
                  setTempValue('');
                }}
                className="flex-1 text-right font-mono"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0"
                tabIndex={-1}
                onClick={() => handleClear(period.key)}
                title="Limpar meta"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {showYearlyColumn && (
              <div className="text-center text-sm font-medium">
                {formatBrazilianNumber(yearlyTotal)}
              </div>
            )}
            <div className="text-center text-sm text-muted-foreground">
              {unit}
            </div>
          </div>
        );
      })}
    </div>
  );
};
