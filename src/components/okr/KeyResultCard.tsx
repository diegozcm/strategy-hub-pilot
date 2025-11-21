import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { OKRKeyResult } from '@/types/okr';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KeyResultCardProps {
  keyResult: OKRKeyResult;
}

export const KeyResultCard = ({ keyResult }: KeyResultCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'completed':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
      case 'at_risk':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
      case 'off_track':
        return 'bg-red-500/10 text-red-700 dark:text-red-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Rascunho';
      case 'active':
        return 'Ativo';
      case 'completed':
        return 'Concluído';
      case 'at_risk':
        return 'Em Risco';
      case 'off_track':
        return 'Fora do Curso';
      default:
        return status;
    }
  };

  const formatValue = (value: number) => {
    if (keyResult.unit === 'percentage') return `${value}%`;
    if (keyResult.unit === 'currency') return `R$ ${value.toLocaleString('pt-BR')}`;
    if (keyResult.unit === 'days') return `${value} dias`;
    return value.toString();
  };

  return (
    <Card className="bg-muted/30">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              {keyResult.target_direction === 'maximize' ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-blue-600" />
              )}
              <h5 className="font-medium text-sm">{keyResult.title}</h5>
            </div>
            {keyResult.description && (
              <p className="text-xs text-muted-foreground">{keyResult.description}</p>
            )}
          </div>
          <Badge className={getStatusColor(keyResult.status)} variant="outline">
            {getStatusLabel(keyResult.status)}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {formatValue(keyResult.current_value)} / {formatValue(keyResult.target_value)}
            </span>
            <span className="font-medium">{keyResult.progress_percentage}%</span>
          </div>
          <Progress value={keyResult.progress_percentage} className="h-1.5" />
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {keyResult.completed_initiatives} de {keyResult.total_initiatives} iniciativas concluídas
          </span>
          {keyResult.responsible && <span>Resp: {keyResult.responsible}</span>}
        </div>
      </CardContent>
    </Card>
  );
};
