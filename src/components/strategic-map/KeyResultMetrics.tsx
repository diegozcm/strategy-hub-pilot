import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Target, Calendar } from 'lucide-react';
import { calculateKRStatus, type TargetDirection } from '@/lib/krHelpers';
import { formatValueWithUnit } from '@/lib/utils';

interface KeyResultMetricsProps {
  yearlyTarget: number;
  yearlyActual: number;
  monthlyTarget?: number;
  monthlyActual?: number;
  unit: string;
  achievementPercentage?: number;
  currentMonth: string;
  targetDirection?: TargetDirection;
}

export const KeyResultMetrics = ({ 
  yearlyTarget, 
  yearlyActual,
  monthlyTarget,
  monthlyActual,
  unit, 
  achievementPercentage,
  currentMonth,
  targetDirection = 'maximize'
}: KeyResultMetricsProps) => {
  // Load saved period preference from localStorage
  const [selectedPeriod, setSelectedPeriod] = useState<'ytd' | 'monthly'>(() => {
    const saved = localStorage.getItem('kr_metrics_period');
    return (saved === 'monthly' || saved === 'ytd') ? saved : 'ytd';
  });

  // Save preference when changed
  const handlePeriodChange = (period: 'ytd' | 'monthly') => {
    setSelectedPeriod(period);
    localStorage.setItem('kr_metrics_period', period);
  };

  // Determine values to display based on selected period
  const displayTarget = selectedPeriod === 'ytd' ? yearlyTarget : (monthlyTarget || 0);
  const displayActual = selectedPeriod === 'ytd' ? yearlyActual : (monthlyActual || 0);

  // Calculate status using the helper function
  const status = calculateKRStatus(displayActual, displayTarget, targetDirection);
  const calculatedPercentage = achievementPercentage && selectedPeriod === 'ytd' 
    ? achievementPercentage 
    : status.percentage;
  
  const isOnTrack = status.isGood;
  const isOverTarget = status.isExcellent;

  // Format current period display
  const currentPeriodDisplay = selectedPeriod === 'ytd'
    ? `YTD ${new Date().getFullYear()}`
    : new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const currentPeriodSubtext = selectedPeriod === 'ytd'
    ? `Jan-${new Date().toLocaleString('pt-BR', { month: 'short' })}`
    : 'Mês de referência';

  return (
    <div className="space-y-4 mb-6">
      {/* Toggle YTD/Mensal */}
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
          <Button
            variant={selectedPeriod === 'ytd' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handlePeriodChange('ytd')}
            className="h-8 px-3 text-xs"
          >
            YTD
          </Button>
          <Button
            variant={selectedPeriod === 'monthly' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handlePeriodChange('monthly')}
            className="h-8 px-3 text-xs"
          >
            Mensal
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="h-24">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-4 pt-3">
            <CardTitle className="text-sm font-medium">
              {selectedPeriod === 'ytd' ? 'Meta Anual' : 'Meta Mensal'}
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-0">
            <div className="text-xl font-bold">
              {formatValueWithUnit(displayTarget, unit)}
            </div>
          </CardContent>
        </Card>

        <Card className="h-24">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-4 pt-3">
            <CardTitle className="text-sm font-medium">Realizado</CardTitle>
            {isOverTarget ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-0">
            <div className="text-xl font-bold">
              {formatValueWithUnit(displayActual, unit)}
            </div>
          </CardContent>
        </Card>

      <Card className="h-24">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-4 pt-3">
          <CardTitle className="text-sm font-medium">% Atingimento</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3 pt-0">
          <div className={`text-xl font-bold ${status.color}`}>
            {calculatedPercentage.toFixed(1)}%
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-muted-foreground">
              {isOverTarget 
                ? `+${(calculatedPercentage - 100).toFixed(1)}%`
                : `-${(100 - calculatedPercentage).toFixed(1)}%`
              }
            </p>
            <Badge variant={isOverTarget ? "default" : isOnTrack ? "secondary" : "destructive"} className="text-xs px-2 py-0">
              {isOverTarget ? "✓" : isOnTrack ? "~" : "!"}
            </Badge>
          </div>
        </CardContent>
      </Card>

        <Card className="h-24">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-4 pt-3">
            <CardTitle className="text-sm font-medium">Período Atual</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-0">
            <div className="text-xl font-bold">
              {currentPeriodDisplay}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentPeriodSubtext}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};