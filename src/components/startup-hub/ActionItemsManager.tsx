import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Target } from 'lucide-react';
import { ActionItemCard } from './ActionItemCard';
import { useActionItems, ActionItem } from '@/hooks/useActionItems';
import { useAuth } from '@/hooks/useMultiTenant';

interface ActionItemsManagerProps {
  sessionId: string;
  canEdit?: boolean;
}

export const ActionItemsManager: React.FC<ActionItemsManagerProps> = ({ 
  sessionId, 
  canEdit = false 
}) => {
  const { user } = useAuth();
  const { actionItems, loading, createActionItem, updateActionItem, deleteActionItem } = useActionItems(sessionId);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as ActionItem['priority'],
    due_date: ''
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await createActionItem({
      ...formData,
      session_id: sessionId,
      status: 'pending',
      due_date: formData.due_date || undefined
    });

    if (!result.error) {
      setIsCreateModalOpen(false);
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        due_date: ''
      });
    }
  };

  const handleDelete = async (id: string) => {
    await deleteActionItem(id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
          <Target className="h-4 w-4" />
          Itens de Ação ({actionItems.length})
        </h4>
        {canEdit && (
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Item de Ação</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Título</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: Revisar plano de negócios"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Descrição (opcional)</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Detalhes sobre o que precisa ser feito..."
                    className="min-h-[80px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
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

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Prazo (opcional)</label>
                    <Input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    Criar Item
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {actionItems.length === 0 ? (
        <div className="text-center py-6 text-sm text-muted-foreground">
          {canEdit 
            ? 'Nenhum item de ação criado. Adicione itens para acompanhar o progresso.'
            : 'Nenhum item de ação foi definido para esta sessão.'
          }
        </div>
      ) : (
        <div className="space-y-3">
          {actionItems.map((item) => {
            const isCreator = user?.id === item.created_by;
            return (
              <ActionItemCard
                key={item.id}
                item={item}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                canEdit={canEdit || isCreator}
                canDelete={isCreator}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};