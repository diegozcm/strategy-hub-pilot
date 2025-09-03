import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Edit2, Trash2, Calendar, AlertCircle } from 'lucide-react';
import { ActionItem } from '@/hooks/useActionItems';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ActionItemCardProps {
  item: ActionItem;
  onUpdate: (id: string, updates: Partial<ActionItem>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
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
  onDelete, 
  canEdit = false 
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: item.title,
    description: item.description || '',
    status: item.status,
    priority: item.priority,
    due_date: item.due_date || ''
  });

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdate(item.id, {
      ...formData,
      due_date: formData.due_date || undefined
    });
    setIsEditModalOpen(false);
  };

  const handleDelete = async () => {
    if (window.confirm('Tem certeza que deseja excluir este item de ação?')) {
      await onDelete(item.id);
    }
  };

  const isOverdue = item.due_date && new Date(item.due_date) < new Date() && item.status !== 'completed';

  return (
    <>
      <Card className={`transition-all hover:shadow-md ${isOverdue ? 'border-destructive' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              {isOverdue && <AlertCircle className="h-4 w-4 text-destructive" />}
              {item.title}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={statusColors[item.status]}>
                {statusLabels[item.status]}
              </Badge>
              <Badge variant={priorityColors[item.priority]}>
                {priorityLabels[item.priority]}
              </Badge>
              {canEdit && (
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditModalOpen(true)}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
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
            <div className={`text-xs flex items-center gap-1 ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
              <Calendar className="h-3 w-3" />
              Prazo: {format(new Date(item.due_date), 'dd/MM/yyyy', { locale: ptBR })}
              {isOverdue && ' (Atrasado)'}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Item de Ação</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Título</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as ActionItem['status'] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Prioridade</label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as ActionItem['priority'] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Prazo (opcional)</label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Salvar Alterações
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};