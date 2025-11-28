import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreVertical, Edit, Eye, Trash2, Calendar, Target, Play } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface StrategicPlan {
  id: string;
  name: string;
  status: string;
  period_start: string;
  period_end: string;
  vision?: string;
  mission?: string;
}

interface PlanCardProps {
  plan: StrategicPlan;
  objectivesCount: number;
  onView: (plan: StrategicPlan) => void;
  onEdit: (plan: StrategicPlan) => void;
  onDelete: (plan: StrategicPlan) => void;
  onActivate?: (plan: StrategicPlan) => void;
}

export const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  objectivesCount,
  onView,
  onEdit,
  onDelete,
  onActivate
}) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return {
          variant: 'default' as const,
          className: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300',
          label: 'Ativo'
        };
      default:
        // Todos os outros status são "Inativo"
        return {
          variant: 'secondary' as const,
          className: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300',
          label: 'Inativo'
        };
    }
  };

  const statusConfig = getStatusConfig(plan.status);

  return (
    <Card className="hover:shadow-md transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold">{plan.name}</CardTitle>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(parseISO(plan.period_start), 'MM/yyyy', { locale: ptBR })} - {format(parseISO(plan.period_end), 'MM/yyyy', { locale: ptBR })}
              </div>
              <div className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                {objectivesCount} objetivo{objectivesCount !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`${statusConfig.className} border`}>
              {statusConfig.label}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {plan.status !== 'active' && onActivate && (
                  <DropdownMenuItem onClick={() => onActivate(plan)}>
                    <Play className="h-4 w-4 mr-2" />
                    Ativar
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onView(plan)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Detalhes
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(plan)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete(plan)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {plan.vision && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Visão</p>
            <p className="text-sm line-clamp-2">{plan.vision}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};