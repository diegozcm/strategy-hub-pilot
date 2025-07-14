import { MoreVertical, Target, Calendar, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { StrategicObjective } from '@/types/strategic-map';

interface ObjectiveCardProps {
  objective: StrategicObjective;
  compact?: boolean;
}

const getStatusBadge = (status: string) => {
  const statusMap = {
    'not_started': { label: 'Não Iniciado', variant: 'secondary' as const },
    'in_progress': { label: 'Em Progresso', variant: 'default' as const },
    'completed': { label: 'Concluído', variant: 'default' as const },
    'suspended': { label: 'Suspenso', variant: 'destructive' as const }
  };

  return statusMap[status as keyof typeof statusMap] || { label: status, variant: 'secondary' as const };
};

export const ObjectiveCard = ({ objective, compact = false }: ObjectiveCardProps) => {
  const statusInfo = getStatusBadge(objective.status);

  if (compact) {
    return (
      <div className="p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{objective.title}</h4>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={statusInfo.variant} className="text-xs">
                {statusInfo.label}
              </Badge>
              {objective.responsible && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span className="truncate max-w-20">{objective.responsible}</span>
                </div>
              )}
            </div>
          </div>
          <div className="text-right ml-2">
            <div className="text-xs font-medium">{objective.progress}%</div>
            <Progress value={objective.progress} className="w-12 h-1 mt-1" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">{objective.title}</h3>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Editar</DropdownMenuItem>
              <DropdownMenuItem>Ver Detalhes</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Excluir</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {objective.description && (
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
            {objective.description}
          </p>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <Badge variant={statusInfo.variant}>
              {statusInfo.label}
            </Badge>
            <span className="font-medium">{objective.progress}%</span>
          </div>
          <Progress value={objective.progress} className="h-2" />
        </div>

        <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
          {objective.responsible && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{objective.responsible}</span>
            </div>
          )}
          {objective.deadline && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{new Date(objective.deadline).toLocaleDateString('pt-BR')}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};