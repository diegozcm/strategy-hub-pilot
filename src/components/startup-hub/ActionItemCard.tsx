import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, AlertCircle } from 'lucide-react';
import { ActionItem } from '@/hooks/useActionItems';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ActionItemCardProps {
  item: ActionItem;
  onUpdate: (id: string, updates: Partial<ActionItem>) => Promise<void>;
  canEdit?: boolean;
}

const statusLabels = {
  pending: 'Pendente',
  in_progress: 'Em Andamento',
  completed: 'Concluído',
  cancelled: 'Cancelado'
};

const statusColors = {
  pending: 'default',
  in_progress: 'secondary',
  completed: 'default',
  cancelled: 'destructive'
} as const;

const priorityLabels = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta'
};

const priorityColors = {
  low: 'secondary',
  medium: 'default',
  high: 'destructive'
} as const;

export const ActionItemCard: React.FC<ActionItemCardProps> = ({ 
  item, 
  onUpdate, 
  canEdit = false 
}) => {
  const handleStatusChange = async (newStatus: ActionItem['status']) => {
    await onUpdate(item.id, { status: newStatus });
  };

  const isOverdue = item.due_date && new Date(item.due_date) < new Date() && item.status !== 'completed';

  return (
    <Card className={`transition-all hover:shadow-md ${isOverdue ? 'border-destructive' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            {isOverdue && <AlertCircle className="h-4 w-4 text-destructive" />}
            {item.title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={priorityColors[item.priority]}>
              {priorityLabels[item.priority]}
            </Badge>
            {canEdit ? (
              <Select
                value={item.status}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Badge variant={statusColors[item.status]}>
                {statusLabels[item.status]}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {item.description && (
          <p className="text-sm text-muted-foreground mb-3 whitespace-pre-wrap">
            {item.description}
          </p>
        )}
        {item.due_date && (
          <div className={`text-xs flex items-center gap-1 ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
            <Calendar className="h-3 w-3" />
            Prazo: {format(new Date(item.due_date), 'dd/MM/yyyy', { locale: ptBR })}
            {isOverdue && ' (Atrasado)'}
          </div>
        )}
      </CardContent>
    </Card>
  );
};