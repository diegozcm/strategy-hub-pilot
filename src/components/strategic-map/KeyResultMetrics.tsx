import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Target, Calendar } from 'lucide-react';
import { useKRMetrics, formatMetricValue, getAchievementStatus } from '@/hooks/useKRMetrics';
import { KeyResult } from '@/types/strategic-map';

interface KeyResultMetricsProps {
  keyResult: KeyResult;
  selectedPeriod?: 'ytd' | 'monthly' | 'yearly';
}

export const KeyResultMetrics = ({ 
  keyResult,
  selectedPeriod = 'ytd'
}: KeyResultMetricsProps) => {

  // Get pre-calculated metrics from database
  const metrics = useKRMetrics(keyResult);
  
  // Select appropriate metrics based on period
  const currentMetrics = 
    selectedPeriod === 'monthly' ? metrics.monthly :
    selectedPeriod === 'yearly' ? metrics.yearly :
    metrics.ytd;

  // DEBUG: Log metrics to identify the 14.6% issue
  console.log(`🔍 KeyResultMetrics Debug:`, {
    krTitle: keyResult.title,
    selectedPeriod,
    ytdPercentage: metrics.ytd.percentage,
    monthlyPercentage: metrics.monthly.percentage,
    yearlyPercentage: metrics.yearly.percentage,
    currentMetricsPercentage: currentMetrics.percentage
  });

  const status = getAchievementStatus(
    currentMetrics.percentage, 
    keyResult.target_direction
  );
  
  const isOnTrack = status !== 'danger';
  const isOverTarget = status === 'success' && currentMetrics.percentage >= 100;

  // Format current period display
  const currentPeriodDisplay = selectedPeriod === 'ytd'
    ? `YTD ${new Date().getFullYear()}`
    : selectedPeriod === 'yearly'
    ? `Ano ${new Date().getFullYear()}`
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
            {isOverTarget ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
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
          <div className={`text-xl font-bold ${
            status === 'excellent' ? 'text-blue-600' :
            status === 'success' ? 'text-green-600' :
            status === 'warning' ? 'text-yellow-600' :
            'text-red-600'
          }`}>
            {currentMetrics.percentage.toFixed(1)}%
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-muted-foreground">
              {isOverTarget 
                ? `+${(currentMetrics.percentage - 100).toFixed(1)}%`
                : `-${(100 - currentMetrics.percentage).toFixed(1)}%`
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