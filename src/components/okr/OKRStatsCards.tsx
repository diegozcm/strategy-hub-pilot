import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import { OKRPeriod } from '@/types/okr';

interface OKRStatsCardsProps {
  period: OKRPeriod | null;
  loading?: boolean;
}

/**
 * Componente de Cards com estatísticas do período OKR
 */
export const OKRStatsCards = ({ period, loading }: OKRStatsCardsProps) => {
  if (loading || !period) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="h-4 bg-muted rounded w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    {
      title: 'Total de OKRs',
      value: period.total_objectives,
      icon: Target,
      description: 'Objetivos cadastrados',
    },
    {
      title: 'Concluídos',
      value: period.completed_objectives,
      icon: CheckCircle2,
      description: `${period.total_objectives > 0 ? Math.round((period.completed_objectives / period.total_objectives) * 100) : 0}% do total`,
    },
    {
      title: 'Em Progresso',
      value: period.total_objectives - period.completed_objectives,
      icon: Clock,
      description: 'Objetivos ativos',
    },
    {
      title: 'Performance Geral',
      value: `${period.overall_progress_percentage.toFixed(1)}%`,
      icon: TrendingUp,
      description: 'Progresso médio',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <stat.icon className="h-4 w-4" />
              {stat.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
