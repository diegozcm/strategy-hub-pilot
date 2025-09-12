import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus,
  Target,
  CheckCircle,
  TrendingUp,
  Clock,
  Edit,
  FileText,
  BarChart3,
  Info,
  Activity
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
    createAction,
    updateAction,
    deleteAction,
  } = useKRActions(fca?.key_result_id);

  // Usar as ações diretamente do FCA (já carregadas no useKRFCA)
  const fcaActions = fca?.actions || [];
  const [showActionForm, setShowActionForm] = useState(false);
  const [editingAction, setEditingAction] = useState<KRMonthlyAction | undefined>();

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
    await deleteAction(actionId);
    await Promise.resolve(onActionChange());
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
    await Promise.resolve(onActionChange());
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
            <DialogDescription className="sr-only">Gerencie detalhes e ações do FCA</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="details" className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details" className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                Detalhes
              </TabsTrigger>
              <TabsTrigger value="actions" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Ações ({fcaStats.total})
              </TabsTrigger>
              <TabsTrigger value="statistics" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Estatísticas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="flex-1 mt-6">
              <ScrollArea className="h-[60vh]">
                <div className="space-y-6 pr-4">
                  {/* Status e Prioridade */}
                  <div className="flex gap-2 justify-center">
                    <Badge variant="outline" className={getPriorityColor(fca.priority)}>
                      {fca.priority === 'high' ? '🔴 Alta Prioridade' :
                       fca.priority === 'medium' ? '🟡 Média Prioridade' : '🟢 Baixa Prioridade'}
                    </Badge>
                    <Badge variant="outline" className={getStatusColor(fca.status)}>
                      {fca.status === 'resolved' ? '✅ Resolvido' :
                       fca.status === 'cancelled' ? '❌ Cancelado' : '🔵 Ativo'}
                    </Badge>
                  </div>

                  {/* Fato */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        📊 Fato
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed bg-muted/50 p-4 rounded-lg">
                        {fca.fact}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Causa */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        🔍 Causa Raiz
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed bg-muted/50 p-4 rounded-lg">
                        {fca.cause}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Descrição Adicional */}
                  {fca.description && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          📝 Descrição Adicional
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm leading-relaxed bg-muted/50 p-4 rounded-lg">
                          {fca.description}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="actions" className="flex-1 mt-6">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    Ações do FCA ({fcaStats.total})
                  </h3>
                  <Button onClick={handleCreateAction}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Ação
                  </Button>
                </div>

                <ScrollArea className="flex-1 h-[55vh]">
                  <div className="pr-4">
                    {fcaActions.length === 0 ? (
                      <div className="text-center py-12">
                        <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-medium mb-2">Nenhuma ação criada</h3>
                        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                          Comece criando ações para resolver este FCA e atingir seus objetivos.
                        </p>
                        <Button onClick={handleCreateAction} size="lg">
                          <Plus className="h-5 w-5 mr-2" />
                          Criar Primeira Ação
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="statistics" className="flex-1 mt-6">
              <ScrollArea className="h-[60vh]">
                <div className="space-y-6 pr-4">
                  {/* Cards de Estatísticas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Total de Ações
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{fcaStats.total}</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Concluídas
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-green-600">
                          {fcaStats.completed}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-600" />
                          Em Andamento
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-blue-600">
                          {fcaStats.inProgress}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Target className="h-4 w-4 text-gray-600" />
                          Planejadas
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-gray-600">
                          {fcaStats.planned}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Métricas de Performance */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-green-600" />
                          Taxa de Conclusão
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-4xl font-bold text-green-600 mb-2">
                          {fcaStats.completionRate.toFixed(1)}%
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {fcaStats.completed} de {fcaStats.total} ações concluídas
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-blue-600" />
                          Progresso Médio
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-4xl font-bold text-blue-600 mb-2">
                          {fcaStats.avgProgress.toFixed(1)}%
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Progresso médio de todas as ações
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Resumo Visual */}
                  {fcaStats.total > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Distribuição das Ações</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                              Concluídas
                            </span>
                            <span className="font-medium">{fcaStats.completed}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                              Em Andamento
                            </span>
                            <span className="font-medium">{fcaStats.inProgress}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                              Planejadas
                            </span>
                            <span className="font-medium">{fcaStats.planned}</span>
                          </div>
                          {fcaStats.cancelled > 0 && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                Canceladas
                              </span>
                              <span className="font-medium">{fcaStats.cancelled}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
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