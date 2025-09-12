import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Plus,
  Target,
  CheckCircle,
  TrendingUp,
  Clock,
  Edit,
  FileText,
  BarChart3
} from 'lucide-react';
import { KRFCA, KRMonthlyAction } from '@/types/strategic-map';
import { useKRActions } from '@/hooks/useKRActions';
import { ActionCard } from './ActionCard';
import { ActionFormModal } from './ActionFormModal';

interface KRFCADetailModalProps {
  open: boolean;
  onClose: () => void;
  fca: KRFCA | null;
  onEdit: (fca: KRFCA) => void;
  onActionChange: () => void;
}

export const KRFCADetailModal: React.FC<KRFCADetailModalProps> = ({
  open,
  onClose,
  fca,
  onEdit,
  onActionChange,
}) => {
  const {
    actions,
    loadActions,
    loadActionsByFCA,
    createAction,
    updateAction,
    deleteAction,
    assignActionToFCA,
    getOrphanActions,
    getActionsByFCA,
    loading: actionsLoading,
  } = useKRActions(fca?.key_result_id);

  // Get actions from the hook state instead of local state
  const fcaActions = fca ? getActionsByFCA(fca.id) : [];
  const orphanActions = getOrphanActions();
  const [showActionForm, setShowActionForm] = useState(false);
  const [editingAction, setEditingAction] = useState<KRMonthlyAction | undefined>();
  const [dragOverZone, setDragOverZone] = useState(false);

  // Carregar todas as ações quando modal abrir
  useEffect(() => {
    if (open && fca) {
      loadActions(); // Carrega todas as ações do KR
    }
  }, [open, fca, loadActions]);

  // Estatísticas do FCA
  const fcaStats = useMemo(() => {
    const total = fcaActions.length;
    const completed = fcaActions.filter(a => a.status === 'completed').length;
    const inProgress = fcaActions.filter(a => a.status === 'in_progress').length;
    const planned = fcaActions.filter(a => a.status === 'planned').length;
    const cancelled = fcaActions.filter(a => a.status === 'cancelled').length;
    
    const avgProgress = total > 0 
      ? fcaActions.reduce((sum, a) => sum + a.completion_percentage, 0) / total 
      : 0;
    
    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    return {
      total,
      completed,
      inProgress,
      planned,
      cancelled,
      avgProgress,
      completionRate,
    };
  }, [fcaActions]);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const handleCreateAction = () => {
    setEditingAction(undefined);
    setShowActionForm(true);
  };

  const handleEditAction = (action: KRMonthlyAction) => {
    setEditingAction(action);
    setShowActionForm(true);
  };

  const handleDeleteAction = async (actionId: string) => {
    if (confirm('Tem certeza que deseja deletar esta ação?')) {
      await deleteAction(actionId);
      await loadActions(); // Recarrega todas as ações
      onActionChange();
    }
  };

  const handleSaveAction = async (actionData: Omit<KRMonthlyAction, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    const actionWithFCA = {
      ...actionData,
      fca_id: fca?.id, // Vincular automaticamente ao FCA atual
    };

    if (editingAction) {
      await updateAction(editingAction.id, actionWithFCA as any);
    } else {
      await createAction(actionWithFCA);
    }
    
    setShowActionForm(false);
    setEditingAction(undefined);
    await loadActions(); // Recarrega todas as ações
    onActionChange();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverZone(true);
  };

  const handleDragLeave = () => {
    setDragOverZone(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverZone(false);
    
    const actionId = e.dataTransfer.getData('text/plain');
    if (actionId && fca) {
      await assignActionToFCA(actionId, fca.id);
      await loadActions(); // Recarrega todas as ações
      onActionChange();
    }
  };

  if (!fca) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {fca.title}
              </DialogTitle>
              <Button variant="outline" size="sm" onClick={() => onEdit(fca)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar FCA
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-6">
            {/* Detalhes do FCA */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Detalhes do FCA</CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="outline" className={getPriorityColor(fca.priority)}>
                      {fca.priority === 'high' ? '🔴 Alta' :
                       fca.priority === 'medium' ? '🟡 Média' : '🟢 Baixa'}
                    </Badge>
                    <Badge variant="outline" className={getStatusColor(fca.status)}>
                      {fca.status === 'resolved' ? '✅ Resolvido' :
                       fca.status === 'cancelled' ? '❌ Cancelado' : '🔵 Ativo'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">📊 Fato (O que aconteceu?)</h4>
                  <p className="text-sm bg-muted/50 p-3 rounded-lg">{fca.fact}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">🔍 Causa (Por que aconteceu?)</h4>
                  <p className="text-sm bg-muted/50 p-3 rounded-lg">{fca.cause}</p>
                </div>

                {fca.description && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">📝 Descrição Adicional</h4>
                    <p className="text-sm bg-muted/50 p-3 rounded-lg">{fca.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Estatísticas das Ações */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Total de Ações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{fcaStats.total}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Taxa de Conclusão
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {fcaStats.completionRate.toFixed(1)}%
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    Progresso Médio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {fcaStats.avgProgress.toFixed(1)}%
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    Em Andamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {fcaStats.inProgress}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Seção de Ações */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Ações do FCA ({fcaStats.total})
                  </CardTitle>
                  <Button onClick={handleCreateAction}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Ação
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Drag & Drop Zone */}
                <div 
                  className={`border-2 border-dashed rounded-lg p-4 mb-4 transition-colors ${
                    dragOverZone 
                      ? 'border-primary bg-primary/5' 
                      : 'border-muted-foreground/25 bg-muted/20'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="text-center text-sm text-muted-foreground">
                    {dragOverZone ? (
                      <span className="text-primary font-medium">Solte aqui para vincular ao FCA</span>
                    ) : (
                      <span>Arraste ações órfãs aqui para vinculá-las a este FCA</span>
                    )}
                  </div>
                </div>

                {/* Lista de Ações */}
                {actionsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-muted-foreground">Carregando ações...</div>
                  </div>
                ) : fcaActions.length === 0 ? (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nenhuma ação vinculada</h3>
                    <p className="text-muted-foreground mb-4">
                      Comece criando ações para resolver este FCA
                    </p>
                    <Button onClick={handleCreateAction}>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeira Ação
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {fcaActions.map(action => (
                      <ActionCard
                        key={action.id}
                        action={action}
                        onEdit={handleEditAction}
                        onDelete={handleDeleteAction}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ações Órfãs Disponíveis */}
            {orphanActions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-muted-foreground">
                    Ações Disponíveis ({orphanActions.length})
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Arraste estas ações para a área acima para vinculá-las a este FCA
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {orphanActions.map(action => (
                      <div
                        key={action.id}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData('text/plain', action.id)}
                        className="cursor-move opacity-75 hover:opacity-100 transition-opacity"
                      >
                        <ActionCard
                          action={action}
                          onEdit={handleEditAction}
                          onDelete={handleDeleteAction}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ActionFormModal
        open={showActionForm}
        onClose={() => {
          setShowActionForm(false);
          setEditingAction(undefined);
        }}
        onSave={handleSaveAction}
        action={editingAction}
        keyResultId={fca.key_result_id}
      />
    </>
  );
};