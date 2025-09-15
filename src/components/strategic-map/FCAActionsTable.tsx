import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronRight, ChevronDown, Plus, Edit, Trash2, RefreshCw, CheckCircle, Clock, Target, AlertCircle } from 'lucide-react';
import { KRFCA, KRMonthlyAction, KeyResult } from '@/types/strategic-map';
import { useKRFCA } from '@/hooks/useKRFCA';
import { useKRActions } from '@/hooks/useKRActions';
import { useToast } from '@/hooks/use-toast';
import { KRFCAModal } from './KRFCAModal';

interface FCAActionsTableProps {
  keyResult: KeyResult;
}

export const FCAActionsTable = ({ keyResult }: FCAActionsTableProps) => {
  const { toast } = useToast();
  const [expandedFCAs, setExpandedFCAs] = useState<Set<string>>(new Set());
  const [showFCAModal, setShowFCAModal] = useState(false);
  const [editingFCA, setEditingFCA] = useState<KRFCA | null>(null);
  const [deletingFCAId, setDeletingFCAId] = useState<string | null>(null);
  const [deletingActionId, setDeletingActionId] = useState<string | null>(null);
  
  // Inline action form state
  const [activeActionForm, setActiveActionForm] = useState<string | null>(null);
  const [actionFormData, setActionFormData] = useState({
    what: '',
    why: '',
    who: '',
    whenMonth: new Date().toISOString().slice(0, 7),
    where: '',
    how: '',
  });

  // Edit action modal state
  const [editingAction, setEditingAction] = useState<KRMonthlyAction | null>(null);
  const [showEditActionModal, setShowEditActionModal] = useState(false);
  const [editActionFormData, setEditActionFormData] = useState({
    what: '',
    why: '',
    who: '',
    whenMonth: '',
    where: '',
    how: '',
    status: 'planned' as 'planned' | 'in_progress' | 'completed' | 'cancelled',
    priority: 'medium' as 'low' | 'medium' | 'high',
    completion_percentage: 0,
  });

  const { fcas, loading: fcasLoading, createFCA, updateFCA, deleteFCA, setFCAStatus } = useKRFCA(keyResult.id);
  const { actions, loading: actionsLoading, createAction, deleteAction, updateAction } = useKRActions(keyResult.id);

  const toggleFCAExpansion = (fcaId: string) => {
    const newExpanded = new Set(expandedFCAs);
    if (newExpanded.has(fcaId)) {
      newExpanded.delete(fcaId);
    } else {
      newExpanded.add(fcaId);
    }
    setExpandedFCAs(newExpanded);
  };

  const getFCAActions = (fcaId: string) => {
    return actions.filter(action => action.fca_id === fcaId);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'medium': return 'bg-warning/10 text-warning border-warning/20';
      case 'low': return 'bg-success/10 text-success border-success/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-primary/10 text-primary border-primary/20';
      case 'resolved': return 'bg-success/10 text-success border-success/20';
      case 'cancelled': return 'bg-muted text-muted-foreground border-muted';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getActionStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-primary" />;
      case 'planned': return <Target className="h-4 w-4 text-muted-foreground" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4 text-destructive" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const handleCreateFCA = () => {
    setEditingFCA(null);
    setShowFCAModal(true);
  };

  const handleEditFCA = (fca: KRFCA) => {
    setEditingFCA(fca);
    setShowFCAModal(true);
  };

  const handleSaveFCA = async (fcaData: any) => {
    try {
      if (editingFCA) {
        await updateFCA(editingFCA.id, fcaData);
      } else {
        await createFCA(fcaData);
      }
      setShowFCAModal(false);
      setEditingFCA(null);
    } catch (error) {
      console.error('Error saving FCA:', error);
    }
  };

  const handleDeleteFCA = async () => {
    if (!deletingFCAId) return;
    try {
      await deleteFCA(deletingFCAId);
      setDeletingFCAId(null);
    } catch (error) {
      console.error('Error deleting FCA:', error);
    }
  };

  const handleReactivateFCA = async (fcaId: string) => {
    try {
      await setFCAStatus(fcaId, 'active');
      toast({
        title: "Sucesso",
        description: "FCA reativado com sucesso",
      });
    } catch (error) {
      console.error('Error reactivating FCA:', error);
    }
  };

  const resetActionForm = () => {
    setActionFormData({
      what: '',
      why: '',
      who: '',
      whenMonth: new Date().toISOString().slice(0, 7),
      where: '',
      how: '',
    });
  };

  const handleCreateAction = async (fcaId: string) => {
    try {
      if (!actionFormData.what.trim()) {
        throw new Error('O título da ação é obrigatório');
      }

      // Build structured 5W1H description
      const descriptionParts = [];
      if (actionFormData.why.trim()) descriptionParts.push(`Por quê: ${actionFormData.why.trim()}`);
      if (actionFormData.how.trim()) descriptionParts.push(`Como: ${actionFormData.how.trim()}`);
      if (actionFormData.where.trim()) descriptionParts.push(`Onde: ${actionFormData.where.trim()}`);
      const action_description = descriptionParts.length > 0 ? descriptionParts.join(' | ') : undefined;
      
      await createAction({
        key_result_id: keyResult.id,
        fca_id: fcaId,
        action_title: actionFormData.what.trim(),
        action_description,
        month_year: actionFormData.whenMonth,
        responsible: actionFormData.who.trim() || undefined,
        status: 'planned',
        priority: 'medium',
        completion_percentage: 0,
      } as any);
      
      resetActionForm();
      setActiveActionForm(null);
      
      toast({
        title: "Sucesso",
        description: "Ação criada e vinculada ao FCA com sucesso!",
      });
    } catch (error) {
      console.error('Error creating action:', error);
      toast({
        title: "Erro ao Criar Ação",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAction = async () => {
    if (!deletingActionId) return;
    try {
      await deleteAction(deletingActionId);
      setDeletingActionId(null);
    } catch (error) {
      console.error('Error deleting action:', error);
    }
  };

  const handleEditAction = (action: KRMonthlyAction) => {
    setEditingAction(action);
    
    // Parse existing description to extract 5W1H data
    const description = action.action_description || '';
    const whyMatch = description.match(/Por quê:\s*([^|]*)/);
    const howMatch = description.match(/Como:\s*([^|]*)/);
    const whereMatch = description.match(/Onde:\s*([^|]*)/);
    
    setEditActionFormData({
      what: action.action_title,
      why: whyMatch ? whyMatch[1].trim() : '',
      who: action.responsible || '',
      whenMonth: action.month_year,
      where: whereMatch ? whereMatch[1].trim() : '',
      how: howMatch ? howMatch[1].trim() : '',
      status: action.status,
      priority: action.priority,
      completion_percentage: action.completion_percentage,
    });
    
    setShowEditActionModal(true);
  };

  const handleSaveEditAction = async () => {
    try {
      if (!editingAction) return;
      
      if (!editActionFormData.what.trim()) {
        throw new Error('O título da ação é obrigatório');
      }

      // Build structured 5W1H description
      const descriptionParts = [];
      if (editActionFormData.why.trim()) descriptionParts.push(`Por quê: ${editActionFormData.why.trim()}`);
      if (editActionFormData.how.trim()) descriptionParts.push(`Como: ${editActionFormData.how.trim()}`);
      if (editActionFormData.where.trim()) descriptionParts.push(`Onde: ${editActionFormData.where.trim()}`);
      const action_description = descriptionParts.length > 0 ? descriptionParts.join(' | ') : undefined;
      
      await updateAction(editingAction.id, {
        action_title: editActionFormData.what.trim(),
        action_description,
        month_year: editActionFormData.whenMonth,
        responsible: editActionFormData.who.trim() || null,
        status: editActionFormData.status,
        priority: editActionFormData.priority,
        completion_percentage: editActionFormData.completion_percentage,
      });
      
      setShowEditActionModal(false);
      setEditingAction(null);
      
      toast({
        title: "Sucesso",
        description: "Ação atualizada com sucesso!",
      });
    } catch (error) {
      console.error('Error updating action:', error);
      toast({
        title: "Erro ao Atualizar Ação",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  if (fcasLoading) {
    return <div className="text-center py-8">Carregando FCAs...</div>;
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold">FCAs e Ações</h3>
            <p className="text-muted-foreground">
              {fcas.length} FCA(s) • {actions.length} ação(ões) total
            </p>
          </div>
          <Button onClick={handleCreateFCA}>
            <Plus className="h-4 w-4 mr-2" />
            Novo FCA
          </Button>
        </div>

        {fcas.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h4 className="text-lg font-semibold mb-2">Nenhum FCA encontrado</h4>
              <p className="text-muted-foreground text-center mb-4">
                Crie o primeiro FCA para começar a organizar suas ações estratégicas.
              </p>
              <Button onClick={handleCreateFCA}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro FCA
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {fcas.map((fca) => {
              const fcaActions = getFCAActions(fca.id);
              const isExpanded = expandedFCAs.has(fca.id);
              const isInactive = fca.status !== 'active';

              return (
                <Card key={fca.id} className="overflow-hidden">
                  <Collapsible open={isExpanded} onOpenChange={() => toggleFCAExpansion(fca.id)}>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                            <div>
                              <CardTitle className="text-base">{fca.title}</CardTitle>
                              <div className="flex gap-2 mt-1">
                                <Badge className={getPriorityColor(fca.priority)} variant="outline">
                                  {fca.priority === 'high' ? 'Alta' : fca.priority === 'medium' ? 'Média' : 'Baixa'}
                                </Badge>
                                <Badge className={getStatusColor(fca.status)} variant="outline">
                                  {fca.status === 'active' ? 'Ativo' : fca.status === 'resolved' ? 'Resolvido' : 'Cancelado'}
                                </Badge>
                                <Badge variant="secondary">
                                  {fcaActions.length} ação(ões)
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {isInactive && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReactivateFCA(fca.id);
                                }}
                              >
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Reativar
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditFCA(fca);
                              }}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingFCAId(fca.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Excluir
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <CardContent className="pt-0 border-t">
                        {/* FCA Details */}
                        <div className="space-y-2 text-sm mb-6 bg-muted/30 p-4 rounded-lg">
                          <div><strong>Fato:</strong> {fca.fact}</div>
                          <div><strong>Causa:</strong> {fca.cause}</div>
                          {fca.description && (
                            <div><strong>Descrição:</strong> {fca.description}</div>
                          )}
                        </div>

                        {/* Actions Section */}
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <h4 className="font-semibold">Ações ({fcaActions.length})</h4>
                            {!isInactive && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (activeActionForm === fca.id) {
                                    setActiveActionForm(null);
                                    resetActionForm();
                                  } else {
                                    setActiveActionForm(fca.id);
                                    resetActionForm();
                                  }
                                }}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Nova Ação
                              </Button>
                            )}
                          </div>

                          {/* Inline Action Form */}
                          {activeActionForm === fca.id && (
                            <Card className="bg-primary/5">
                              <CardHeader>
                                <CardTitle className="text-base">Nova Ação (5W1H)</CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <Label>O quê (What) *</Label>
                                    <Input
                                      value={actionFormData.what}
                                      onChange={(e) => setActionFormData(prev => ({ ...prev, what: e.target.value }))}
                                      placeholder="Descreva a ação"
                                    />
                                  </div>
                                  <div>
                                    <Label>Quem (Who)</Label>
                                    <Input
                                      value={actionFormData.who}
                                      onChange={(e) => setActionFormData(prev => ({ ...prev, who: e.target.value }))}
                                      placeholder="Responsável"
                                    />
                                  </div>
                                  <div>
                                    <Label>Quando (When)</Label>
                                    <Select
                                      value={actionFormData.whenMonth}
                                      onValueChange={(value) => setActionFormData(prev => ({ ...prev, whenMonth: value }))}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {Array.from({ length: 18 }).map((_, i) => {
                                          const d = new Date();
                                          d.setMonth(d.getMonth() - 6 + i);
                                          const value = d.toISOString().slice(0, 7);
                                          const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                                          return <SelectItem key={value} value={value}>{label}</SelectItem>;
                                        })}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label>Onde (Where)</Label>
                                    <Input
                                      value={actionFormData.where}
                                      onChange={(e) => setActionFormData(prev => ({ ...prev, where: e.target.value }))}
                                      placeholder="Local/contexto"
                                    />
                                  </div>
                                  <div className="md:col-span-2">
                                    <Label>Por quê (Why)</Label>
                                    <Textarea
                                      value={actionFormData.why}
                                      onChange={(e) => setActionFormData(prev => ({ ...prev, why: e.target.value }))}
                                      placeholder="Motivação/benefício"
                                      rows={2}
                                    />
                                  </div>
                                  <div className="md:col-span-2">
                                    <Label>Como (How)</Label>
                                    <Textarea
                                      value={actionFormData.how}
                                      onChange={(e) => setActionFormData(prev => ({ ...prev, how: e.target.value }))}
                                      placeholder="Como será executada"
                                      rows={2}
                                    />
                                  </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setActiveActionForm(null);
                                      resetActionForm();
                                    }}
                                  >
                                    Cancelar
                                  </Button>
                                  <Button
                                    disabled={!actionFormData.what.trim()}
                                    onClick={() => handleCreateAction(fca.id)}
                                  >
                                    Adicionar Ação
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          {/* Actions List */}
                          {fcaActions.length === 0 ? (
                            <div className="text-center py-6 text-muted-foreground">
                              Nenhuma ação encontrada
                              {isInactive && (
                                <div className="text-sm mt-2">
                                  <Badge variant="outline" className="bg-warning/10">
                                    FCA inativo - reative para criar ações
                                  </Badge>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {fcaActions.map((action) => (
                                <div key={action.id} className="flex items-center justify-between p-3 bg-background border rounded-lg">
                                  <div className="flex items-center gap-3">
                                    {getActionStatusIcon(action.status)}
                                    <div>
                                      <div className="font-medium">{action.action_title}</div>
                                      <div className="text-sm text-muted-foreground">
                                        {action.month_year} • {action.responsible || 'Sem responsável'}
                                        {action.completion_percentage > 0 && (
                                          <span className="ml-2">• {action.completion_percentage}% completo</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditAction(action)}
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setDeletingActionId(action.id)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* FCA Modal */}
      <KRFCAModal
        open={showFCAModal}
        onClose={() => {
          setShowFCAModal(false);
          setEditingFCA(null);
        }}
        onSave={handleSaveFCA}
        keyResultId={keyResult.id}
        fca={editingFCA || undefined}
      />

      {/* Edit Action Modal */}
      <AlertDialog open={showEditActionModal} onOpenChange={setShowEditActionModal}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Editar Ação</AlertDialogTitle>
            <AlertDialogDescription>
              Utilize a metodologia 5W1H para estruturar sua ação de forma completa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-what">O quê? (Título da Ação) *</Label>
              <Input
                id="edit-what"
                placeholder="Descreva a ação a ser executada"
                value={editActionFormData.what}
                onChange={(e) => setEditActionFormData(prev => ({ ...prev, what: e.target.value }))}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-why">Por quê? (Justificativa)</Label>
              <Textarea
                id="edit-why"
                placeholder="Explique o motivo e importância desta ação"
                value={editActionFormData.why}
                onChange={(e) => setEditActionFormData(prev => ({ ...prev, why: e.target.value }))}
                rows={2}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-who">Quem? (Responsável)</Label>
                <Input
                  id="edit-who"
                  placeholder="Nome do responsável"
                  value={editActionFormData.who}
                  onChange={(e) => setEditActionFormData(prev => ({ ...prev, who: e.target.value }))}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-when">Quando? (Mês/Ano) *</Label>
                <Input
                  id="edit-when"
                  type="month"
                  value={editActionFormData.whenMonth}
                  onChange={(e) => setEditActionFormData(prev => ({ ...prev, whenMonth: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-where">Onde? (Local/Contexto)</Label>
              <Input
                id="edit-where"
                placeholder="Local ou contexto onde a ação será executada"
                value={editActionFormData.where}
                onChange={(e) => setEditActionFormData(prev => ({ ...prev, where: e.target.value }))}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-how">Como? (Método/Processo)</Label>
              <Textarea
                id="edit-how"
                placeholder="Descreva o método ou processo para executar a ação"
                value={editActionFormData.how}
                onChange={(e) => setEditActionFormData(prev => ({ ...prev, how: e.target.value }))}
                rows={2}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select value={editActionFormData.status} onValueChange={(value: any) => setEditActionFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger id="edit-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planejado</SelectItem>
                    <SelectItem value="in_progress">Em Progresso</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-priority">Prioridade</Label>
                <Select value={editActionFormData.priority} onValueChange={(value: any) => setEditActionFormData(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger id="edit-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-completion">% Conclusão</Label>
                <Input
                  id="edit-completion"
                  type="number"
                  min="0"
                  max="100"
                  value={editActionFormData.completion_percentage}
                  onChange={(e) => setEditActionFormData(prev => ({ ...prev, completion_percentage: Number(e.target.value) }))}
                />
              </div>
            </div>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowEditActionModal(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveEditAction}>
              Salvar Alterações
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete FCA Confirmation */}
      <AlertDialog open={!!deletingFCAId} onOpenChange={() => setDeletingFCAId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este FCA? Todas as ações vinculadas também serão removidas. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFCA} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Action Confirmation */}
      <AlertDialog open={!!deletingActionId} onOpenChange={() => setDeletingActionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta ação? Esta operação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAction} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};