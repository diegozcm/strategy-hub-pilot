import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, Target, Calendar } from 'lucide-react';
import { useKRMetrics, formatMetricValue, getAchievementStatus } from '@/hooks/useKRMetrics';
import { KeyResult } from '@/types/strategic-map';
import { calculateKRStatus } from '@/lib/krHelpers';

interface KeyResultMetricsProps {
  keyResult: KeyResult;
  selectedPeriod?: 'ytd' | 'monthly' | 'yearly';
  selectedMonth?: number;
  selectedYear?: number;
  onMonthChange?: (month: number) => void;
  onYearChange?: (year: number) => void;
  monthOptions?: Array<{ value: string; label: string }>;
}

export const KeyResultMetrics = ({ 
  keyResult,
  selectedPeriod = 'ytd',
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange,
  monthOptions = []
}: KeyResultMetricsProps) => {
  const [isComboOpen, setIsComboOpen] = useState(false);

  // Get metrics from database (with optional custom month)
  const metrics = useKRMetrics(keyResult, {
    selectedMonth,
    selectedYear,
  });
  
  // Select appropriate metrics based on period
  const currentMetrics = 
    selectedPeriod === 'monthly' ? metrics.monthly :
    selectedPeriod === 'yearly' ? metrics.yearly :
    metrics.ytd;


  // Verificar se há dados realizados para calcular
  const hasActualData = currentMetrics.actual > 0;
  const hasTarget = currentMetrics.target > 0;
  const hasData = hasTarget && hasActualData;

  const krStatus = hasData
    ? calculateKRStatus(
        currentMetrics.actual,
        currentMetrics.target,
        keyResult.target_direction || 'maximize'
      )
    : { percentage: 0, isExcellent: false, isGood: false, color: 'text-gray-500' };

  const isExcellent = krStatus.isExcellent;
  const isGood = krStatus.isGood;
  const isOnTrack = isGood;
  const isOverTarget = krStatus.percentage >= 100;

  // Format current period display
  const currentPeriodDisplay = selectedPeriod === 'ytd'
    ? `YTD ${new Date().getFullYear()}`
    : selectedPeriod === 'yearly'
    ? `Ano ${selectedYear || new Date().getFullYear()}`
    : selectedMonth && selectedYear
    ? new Date(selectedYear, selectedMonth - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const currentPeriodSubtext = selectedPeriod === 'ytd'
    ? `Jan-${new Date().toLocaleString('pt-BR', { month: 'short' })}`
    : selectedPeriod === 'yearly'
    ? 'Todos os 12 meses'
    : 'Mês de referência';

  return (
    <div className="space-y-4">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="h-24">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-4 pt-3">
            <CardTitle className="text-sm font-medium">
              {selectedPeriod === 'ytd' ? 'Meta YTD' : selectedPeriod === 'yearly' ? 'Meta Anual' : 'Meta Mensal'}
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-0">
            <div className="text-xl font-bold">
              {formatMetricValue(currentMetrics.target, keyResult.unit)}
            </div>
          </CardContent>
        </Card>

        <Card className="h-24">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-4 pt-3">
            <CardTitle className="text-sm font-medium">
              {selectedPeriod === 'ytd' ? 'Realizado YTD' : selectedPeriod === 'yearly' ? 'Realizado Anual' : 'Realizado Mensal'}
            </CardTitle>
            {hasData ? (
              isOverTarget ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )
            ) : null}
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-0">
            <div className="text-xl font-bold">
              {formatMetricValue(currentMetrics.actual, keyResult.unit)}
            </div>
          </CardContent>
        </Card>

      <Card className="h-24">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-4 pt-3">
          <CardTitle className="text-sm font-medium">
            {selectedPeriod === 'ytd' ? '% Atingimento YTD' : selectedPeriod === 'yearly' ? '% Atingimento Anual' : '% Atingimento Mensal'}
          </CardTitle>
        </CardHeader>
          <CardContent className="px-4 pb-3 pt-0">
            {hasData ? (
              <>
                <div className={`text-xl font-bold ${krStatus.color}`}>
                  {krStatus.percentage.toFixed(1)}%
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-muted-foreground">
                    {isOverTarget 
                      ? `+${(krStatus.percentage - 100).toFixed(1)}%`
                      : `-${(100 - krStatus.percentage).toFixed(1)}%`
                    }
                  </p>
                  <Badge 
                    variant={
                      isExcellent || (isGood && krStatus.percentage >= 100) ? "default" : 
                      isGood ? "secondary" : 
                      "destructive"
                    } 
                    className="text-xs px-2 py-0"
                  >
                    {isExcellent || (isGood && krStatus.percentage >= 100) ? "✓" : 
                     isGood ? "~" : 
                     "!"}
                  </Badge>
                </div>
              </>
            ) : (
              <>
                <div className="text-xl font-bold text-gray-500">
                  —
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Sem dados realizados
                </p>
              </>
            )}
          </CardContent>
      </Card>

        <Card className="h-24">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-4 pt-3">
            <CardTitle className="text-sm font-medium">Período Atual</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-0">
            {selectedPeriod === 'monthly' && onMonthChange && onYearChange ? (
              <>
                <Select
                  value={`${selectedYear}-${selectedMonth?.toString().padStart(2, '0')}`}
                  onValueChange={(value) => {
                    const [year, month] = value.split('-');
                    onYearChange(parseInt(year));
                    onMonthChange(parseInt(month));
                  }}
                  onOpenChange={setIsComboOpen}
                >
                  <SelectTrigger className="w-full h-9 text-base font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!isComboOpen && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Mês de referência
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="text-xl font-bold">
                  {currentPeriodDisplay}
                </div>
                <p className="text-xs text-muted-foreground">
                  {currentPeriodSubtext}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};