import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Target, Calendar } from 'lucide-react';

interface KeyResultMetricsProps {
  yearlyTarget: number;
  yearlyActual: number;
  unit: string;
  achievementPercentage: number;
  currentMonth: string;
}

export const KeyResultMetrics = ({ 
  yearlyTarget, 
  yearlyActual, 
  unit, 
  achievementPercentage,
  currentMonth 
}: KeyResultMetricsProps) => {
  const isOnTrack = achievementPercentage >= 80;
  const isOverTarget = achievementPercentage >= 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card className="h-24">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-4 pt-3">
          <CardTitle className="text-sm font-medium">Meta Anual</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="px-4 pb-3 pt-0">
          <div className="text-xl font-bold">
            {yearlyTarget.toLocaleString('pt-BR')} {unit}
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
            {yearlyActual.toLocaleString('pt-BR')} {unit}
          </div>
        </CardContent>
      </Card>

      <Card className="h-24">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-4 pt-3">
          <CardTitle className="text-sm font-medium">% Atingimento</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3 pt-0">
          <div className="text-xl font-bold">
            {achievementPercentage.toFixed(1)}%
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-muted-foreground">
              {isOverTarget 
                ? `+${(achievementPercentage - 100).toFixed(1)}%`
                : `-${(100 - achievementPercentage).toFixed(1)}%`
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
            {currentMonth}
          </div>
          <p className="text-xs text-muted-foreground">
            Mês de referência
          </p>
        </CardContent>
      </Card>
    </div>
  );
};