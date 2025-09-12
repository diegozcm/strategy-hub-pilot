import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KeyResult } from '@/types/strategic-map';
import { useKRFCA } from '@/hooks/useKRFCA';
import { useKRActions } from '@/hooks/useKRActions';
import { useState } from 'react';
import { Plus, Edit, Trash2, AlertCircle, CheckCircle, Clock, Target } from 'lucide-react';
import { KRFCAModal } from './KRFCAModal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface KRFCAUnifiedModalProps {
  keyResult: KeyResult | null;
  open: boolean;
  onClose: () => void;
}

export const KRFCAUnifiedModal = ({ keyResult, open, onClose }: KRFCAUnifiedModalProps) => {
  const [selectedFCAId, setSelectedFCAId] = useState<string | null>(null);
  const [showFCAModal, setShowFCAModal] = useState(false);
  const [editingFCA, setEditingFCA] = useState(null);
  const [deletingFCAId, setDeletingFCAId] = useState<string | null>(null);
  const [deletingActionId, setDeletingActionId] = useState<string | null>(null);

  // 5W1H inline form state
  const [what, setWhat] = useState('');
  const [why, setWhy] = useState('');
  const [who, setWho] = useState('');
  const [whenMonth, setWhenMonth] = useState(new Date().toISOString().slice(0, 7));
  const [where, setWhere] = useState('');
  const [how, setHow] = useState('');
  const [savingAction, setSavingAction] = useState(false);

  const { fcas, loading: fcasLoading, createFCA, updateFCA, deleteFCA } = useKRFCA(keyResult?.id);
  const { actions, loading: actionsLoading, createAction, deleteAction } = useKRActions(keyResult?.id);

  if (!keyResult) return null;

  const selectedFCA = selectedFCAId ? fcas.find(f => f.id === selectedFCAId) : null;
  const fcaActions = selectedFCA ? actions.filter(a => a.fca_id === selectedFCA.id) : [];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getActionStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'planned': return <Target className="h-4 w-4 text-gray-600" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleCreateFCA = () => {
    setEditingFCA(null);
    setShowFCAModal(true);
  };

  const handleEditFCA = (fca: any) => {
    setEditingFCA(fca);
    setShowFCAModal(true);
  };

  const handleCreateAction = () => {
    if (!selectedFCA) return;
    setEditingAction(null);
    setShowActionModal(true);
  };

  const handleEditAction = (action: any) => {
    setEditingAction(action);
    setShowActionModal(true);
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

  const handleSaveAction = async (actionData: any) => {
    try {
      const dataWithFCA = {
        ...actionData,
        fca_id: selectedFCA?.id
      };

      if (editingAction) {
        await updateAction(editingAction.id, dataWithFCA);
      } else {
        await createAction(dataWithFCA);
      }
      setShowActionModal(false);
      setEditingAction(null);
    } catch (error) {
      console.error('Error saving action:', error);
    }
  };

  const handleDeleteFCA = async () => {
    if (!deletingFCAId) return;
    try {
      await deleteFCA(deletingFCAId);
      if (selectedFCAId === deletingFCAId) {
        setSelectedFCAId(null);
      }
      setDeletingFCAId(null);
    } catch (error) {
      console.error('Error deleting FCA:', error);
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

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[1000px] max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">FCA & Ações - {keyResult.title}</DialogTitle>
            <DialogDescription>
              Gerencie Fatos, Causas, Ações e acompanhe o progresso dos planos de ação
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="fcas" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="fcas">FCAs</TabsTrigger>
              <TabsTrigger value="actions" disabled={!selectedFCA}>
                Ações {selectedFCA ? `(${fcaActions.length})` : ''}
              </TabsTrigger>
              <TabsTrigger value="reports">Relatórios</TabsTrigger>
            </TabsList>

            <TabsContent value="fcas" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Lista de FCAs</h3>
                <Button onClick={handleCreateFCA} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo FCA
                </Button>
              </div>

              {fcasLoading ? (
                <div className="text-center py-8">Carregando FCAs...</div>
              ) : fcas.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Nenhum FCA encontrado. Crie o primeiro FCA para começar a organizar suas ações.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid gap-4">
                  {fcas.map((fca) => (
                    <Card 
                      key={fca.id} 
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedFCAId === fca.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedFCAId(fca.id)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-base">{fca.title}</CardTitle>
                          <div className="flex gap-2">
                            <Badge className={getPriorityColor(fca.priority)}>
                              {fca.priority === 'high' ? 'Alta' : fca.priority === 'medium' ? 'Média' : 'Baixa'}
                            </Badge>
                            <Badge className={getStatusColor(fca.status)}>
                              {fca.status === 'active' ? 'Ativo' : fca.status === 'resolved' ? 'Resolvido' : 'Cancelado'}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2 text-sm">
                          <div><strong>Fato:</strong> {fca.fact}</div>
                          <div><strong>Causa:</strong> {fca.cause}</div>
                          {fca.description && (
                            <div><strong>Descrição:</strong> {fca.description}</div>
                          )}
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
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
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="actions" className="space-y-4">
              {selectedFCA ? (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Ações do FCA: {selectedFCA.title}</h3>
                      <p className="text-sm text-muted-foreground">{fcaActions.length} ações encontradas</p>
                    </div>
                  </div>

                  {/* Inline 5W1H form */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Nova Ação (5W1H)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="what">O quê (What) *</Label>
                          <Input id="what" value={what} onChange={(e) => setWhat(e.target.value)} placeholder="Descreva a ação a ser realizada" />
                        </div>
                        <div>
                          <Label htmlFor="who">Quem (Who)</Label>
                          <Input id="who" value={who} onChange={(e) => setWho(e.target.value)} placeholder="Responsável pela ação" />
                        </div>
                        <div>
                          <Label htmlFor="when">Quando (When) - Mês/Ano</Label>
                          <Select value={whenMonth} onValueChange={setWhenMonth}>
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
                          <Label htmlFor="where">Onde (Where)</Label>
                          <Input id="where" value={where} onChange={(e) => setWhere(e.target.value)} placeholder="Local/contexto" />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="why">Por quê (Why)</Label>
                          <Textarea id="why" value={why} onChange={(e) => setWhy(e.target.value)} placeholder="Motivação/benefício da ação" rows={2} />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="how">Como (How)</Label>
                          <Textarea id="how" value={how} onChange={(e) => setHow(e.target.value)} placeholder="Como será executada" rows={2} />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button
                          disabled={!what.trim() || savingAction}
                          onClick={async () => {
                            try {
                              setSavingAction(true);
                              const descriptionParts = [] as string[];
                              if (why.trim()) descriptionParts.push(`Por quê: ${why.trim()}`);
                              if (how.trim()) descriptionParts.push(`Como: ${how.trim()}`);
                              if (where.trim()) descriptionParts.push(`Onde: ${where.trim()}`);
                              const action_description = descriptionParts.length > 0 ? descriptionParts.join(' | ') : undefined;
                              await createAction({
                                key_result_id: keyResult.id,
                                fca_id: selectedFCA.id,
                                action_title: what.trim(),
                                action_description,
                                month_year: whenMonth,
                                responsible: who.trim() || undefined,
                                status: 'planned',
                                priority: 'medium',
                                completion_percentage: 0,
                              } as any);
                              // reset
                              setWhat(''); setWhy(''); setHow(''); setWhere(''); setWho('');
                            } catch (e) {
                              console.error(e);
                            } finally {
                              setSavingAction(false);
                            }
                          }}
                        >
                          {savingAction ? 'Salvando...' : 'Adicionar Ação'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {actionsLoading ? (
                    <div className="text-center py-8">Carregando ações...</div>
                  ) : fcaActions.length === 0 ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Nenhuma ação encontrada para este FCA. Use o formulário acima para criar a primeira ação.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-3">
                      {fcaActions.map((action) => (
                        <Card key={action.id}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  {getActionStatusIcon(action.status)}
                                  <h4 className="font-medium">{action.action_title}</h4>
                                  <Badge variant="outline" className="text-xs">
                                    {action.month_year}
                                  </Badge>
                                </div>
                                {action.action_description && (
                                  <p className="text-sm text-muted-foreground mb-2">{action.action_description}</p>
                                )}
                                {action.responsible && (
                                  <p className="text-xs text-muted-foreground">
                                    Responsável: {action.responsible}
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-2">
                                {/* Edição futura inline - removido modal */}
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setDeletingActionId(action.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Selecione um FCA na aba anterior para visualizar e gerenciar suas ações.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="reports" className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Funcionalidade de relatórios em desenvolvimento. Em breve você poderá visualizar estatísticas detalhadas dos FCAs e ações.
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Modal de FCA */}
      <KRFCAModal
        open={showFCAModal}
        onClose={() => {
          setShowFCAModal(false);
          setEditingFCA(null);
        }}
        onSave={handleSaveFCA}
        fca={editingFCA}
        keyResultId={keyResult.id}
      />

      {/* Modal de Ação removido - criação inline 5W1H */}

      {/* Confirmação de exclusão de FCA */}
      <AlertDialog open={!!deletingFCAId} onOpenChange={() => setDeletingFCAId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este FCA? Esta ação não pode ser desfeita e todas as ações associadas também serão removidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFCA}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmação de exclusão de ação */}
      <AlertDialog open={!!deletingActionId} onOpenChange={() => setDeletingActionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta ação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAction}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};