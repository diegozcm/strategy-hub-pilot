import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, 
  User, 
  Target, 
  Edit, 
  Trash2,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';
import { KRMonthlyAction } from '@/types/strategic-map';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ActionCardProps {
  action: KRMonthlyAction;
  onEdit: (action: KRMonthlyAction) => void;
  onDelete: (actionId: string) => void;
}

export const ActionCard: React.FC<ActionCardProps> = ({
  action,
  onEdit,
  onDelete,
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'in_progress':
        return '🔄';
      case 'cancelled':
        return '❌';
      default:
        return '🎯';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return '🔴';
      case 'medium':
        return '🟡';
      default:
        return '🟢';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Não definido';
    try {
      return format(new Date(dateString), 'dd/MMM', { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  const isOverdue = action.end_date && new Date(action.end_date) < new Date() && action.status !== 'completed';

  return (
    <Card className={`transition-all hover:shadow-md ${isOverdue ? 'border-red-300 bg-red-50/50' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-2 flex-1">
            <span className="text-lg">{getStatusIcon(action.status)}</span>
            <div className="flex-1">
              <h4 className="font-medium text-sm leading-tight mb-1">
                {action.action_title}
              </h4>
              {isOverdue && (
                <div className="flex items-center gap-1 text-red-600 text-xs mb-2">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Atrasada</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-1 ml-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(action)}
              className="h-7 w-7 p-0"
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(action.id)}
              className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {action.action_description && (
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
            {action.action_description}
          </p>
        )}

        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-medium">{action.completion_percentage}%</span>
          </div>
          <Progress value={action.completion_percentage} className="h-2" />
        </div>

        <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
          {action.responsible && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{action.responsible}</span>
            </div>
          )}
          {action.end_date && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(action.end_date)}</span>
            </div>
          )}
        </div>

        {(action.planned_value || action.actual_value) && (
          <div className="flex items-center gap-2 text-xs mb-3">
            <Target className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">
              Meta: {action.planned_value || 0}
            </span>
            <span className="text-muted-foreground">|</span>
            <span className="font-medium">
              Real: {action.actual_value || 0}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Badge 
              variant="outline" 
              className={`text-xs py-0 px-2 h-5 ${getStatusColor(action.status)}`}
            >
              {action.status === 'completed' ? 'Concluída' :
               action.status === 'in_progress' ? 'Em Progresso' :
               action.status === 'cancelled' ? 'Cancelada' : 'Planejada'}
            </Badge>
            <Badge 
              variant="outline" 
              className={`text-xs py-0 px-2 h-5 ${getPriorityColor(action.priority)}`}
            >
              {getPriorityIcon(action.priority)} {action.priority === 'high' ? 'Alta' :
               action.priority === 'medium' ? 'Média' : 'Baixa'}
            </Badge>
          </div>

          {action.evidence_links && action.evidence_links.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
              onClick={() => window.open(action.evidence_links?.[0], '_blank')}
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};