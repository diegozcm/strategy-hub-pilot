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
  onDelete?: (id: string) => Promise<void>;
  canEdit?: boolean;
  canDelete?: boolean;
}

const getStatusConfig = (status: ActionItem['status']) => {
  switch (status) {
    case 'completed': 
      return { 
        variant: 'default' as const,
        className: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
        icon: '✓',
        label: 'Concluído'
      };
    case 'in_progress': 
      return { 
        variant: 'default' as const,
        className: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
        icon: '⏳',
        label: 'Em Progresso'
      };
    case 'cancelled': 
      return { 
        variant: 'destructive' as const,
        className: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
        icon: '✕',
        label: 'Cancelado'
      };
    default: // pending
      return { 
        variant: 'secondary' as const,
        className: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
        icon: '○',
        label: 'Pendente'
      };
  }
};

const getPriorityConfig = (priority: ActionItem['priority']) => {
  switch (priority) {
    case 'high': 
      return { 
        variant: 'destructive' as const,
        className: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
        icon: '🔴',
        label: 'Alta'
      };
    case 'medium': 
      return { 
        variant: 'default' as const,
        className: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
        icon: '🟡',
        label: 'Média'
      };
    case 'low': 
      return { 
        variant: 'secondary' as const,
        className: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
        icon: '🟢',
        label: 'Baixa'
      };
    default:
      return { 
        variant: 'default' as const,
        className: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
        icon: '🟡',
        label: 'Média'
      };
  }
};

export const ActionItemCard: React.FC<ActionItemCardProps> = ({ 
  item, 
  onUpdate,
  onDelete, 
  canEdit = false,
  canDelete = false 
}) => {
  const handleStatusChange = async (newStatus: ActionItem['status']) => {
    await onUpdate(item.id, { status: newStatus });
  };

  const isOverdue = item.due_date && new Date(item.due_date) < new Date() && item.status !== 'completed';
  const statusConfig = getStatusConfig(item.status);
  const priorityConfig = getPriorityConfig(item.priority);

  return (
    <Card className={`transition-all hover:shadow-md ${isOverdue ? 'border-destructive' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base flex items-center gap-2">
              {isOverdue && <AlertCircle className="h-4 w-4 text-destructive" />}
              {item.title}
            </CardTitle>
            {item.creator_name && (
              <p className="text-xs text-muted-foreground mt-1">
                Criado por: {item.creator_name}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${priorityConfig.className}`}>
              <span>{priorityConfig.icon}</span>
              {priorityConfig.label}
            </div>
            {canDelete && onDelete && (
              <button
                onClick={() => onDelete(item.id)}
                className="text-destructive hover:bg-destructive/10 p-1 rounded"
                title="Excluir item"
              >
                <span className="text-xs">🗑️</span>
              </button>
            )}
            {canEdit ? (
              <Select
                value={item.status}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">
                    <span className="flex items-center gap-2">
                      <span>○</span> Pendente
                    </span>
                  </SelectItem>
                  <SelectItem value="in_progress">
                    <span className="flex items-center gap-2">
                      <span>⏳</span> Em Progresso
                    </span>
                  </SelectItem>
                  <SelectItem value="completed">
                    <span className="flex items-center gap-2">
                      <span>✓</span> Concluído
                    </span>
                  </SelectItem>
                  <SelectItem value="cancelled">
                    <span className="flex items-center gap-2">
                      <span>✕</span> Cancelado
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${statusConfig.className}`}>
                <span>{statusConfig.icon}</span>
                {statusConfig.label}
              </div>
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
          <div className={`text-xs flex items-center gap-1 ${isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
            <Calendar className="h-3 w-3" />
            Prazo: {format(new Date(item.due_date), 'dd/MM/yyyy', { locale: ptBR })}
            {isOverdue && <span className="text-destructive font-medium">(Atrasado)</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
};