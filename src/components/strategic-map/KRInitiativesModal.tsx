import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { KeyResult, KRInitiative, InitiativeStatus, InitiativePriority } from '@/types/strategic-map';
import { useState } from 'react';
import { Plus, Calendar, Target, AlertCircle, Edit, Trash2, User, DollarSign, Clock, Eye, TrendingUp } from 'lucide-react';
import { useKRInitiatives } from '@/hooks/useKRInitiatives';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/hooks/useMultiTenant';

interface KRInitiativesModalProps {
  keyResult: KeyResult | null;
  open: boolean;
  onClose: () => void;
}

const statusLabels: Record<InitiativeStatus, string> = {
  planned: 'Planejada',
  in_progress: 'Em Andamento',
  completed: 'Concluída',
  cancelled: 'Cancelada',
  on_hold: 'Em Espera'
};

const priorityLabels: Record<InitiativePriority, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta'
};

const statusColors: Record<InitiativeStatus, string> = {
  planned: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  on_hold: 'bg-gray-100 text-gray-800'
};

export const KRInitiativesModal = ({ keyResult, open, onClose }: KRInitiativesModalProps) => {
  const { company } = useAuth();
  const { initiatives, loading, createInitiative, updateInitiative, deleteInitiative, getInitiativeStats } = useKRInitiatives(keyResult?.id);
  
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingInitiative, setEditingInitiative] = useState<KRInitiative | null>(null);
  const [viewingInitiative, setViewingInitiative] = useState<KRInitiative | null>(null);
  const [deletingInitiativeId, setDeletingInitiativeId] = useState<string | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<InitiativeStatus>('planned');
  const [priority, setPriority] = useState<InitiativePriority>('medium');
  const [responsible, setResponsible] = useState('');
  const [budget, setBudget] = useState('');
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [completionNotes, setCompletionNotes] = useState('');

  if (!keyResult) return null;

  const stats = getInitiativeStats();

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStartDate('');
    setEndDate('');
    setStatus('planned');
    setPriority('medium');
    setResponsible('');
    setBudget('');
    setProgressPercentage(0);
    setCompletionNotes('');
    setEditingInitiative(null);
    setShowNewForm(false);
  };

  const handleSaveInitiative = async () => {
    if (!title.trim() || !startDate || !endDate) return;

    const initiativeData = {
      key_result_id: keyResult.id,
      company_id: company?.id, // Usar o company_id correto
      title: title.trim(),
      description: description.trim() || undefined,
      start_date: startDate,
      end_date: endDate,
      status,
      priority,
      responsible: responsible.trim() || undefined,
      budget: budget ? parseFloat(budget) : undefined,
      progress_percentage: progressPercentage,
      completion_notes: completionNotes.trim() || undefined
    };

    let success = false;
    if (editingInitiative) {
      success = !!(await updateInitiative(editingInitiative.id, initiativeData));
    } else {
      success = !!(await createInitiative(initiativeData));
    }

    if (success) {
      resetForm();
    }
  };

  const handleEditInitiative = (initiative: KRInitiative) => {
    setEditingInitiative(initiative);
    setTitle(initiative.title);
    setDescription(initiative.description || '');
    setStartDate(initiative.start_date);
    setEndDate(initiative.end_date);
    setStatus(initiative.status);
    setPriority(initiative.priority);
    setResponsible(initiative.responsible || '');
    setBudget(initiative.budget?.toString() || '');
    setProgressPercentage(initiative.progress_percentage);
    setCompletionNotes(initiative.completion_notes || '');
    setShowNewForm(true);
  };

  const handleDeleteInitiative = async () => {
    if (!deletingInitiativeId) return;
    
    const success = await deleteInitiative(deletingInitiativeId);
    if (success) {
      setDeletingInitiativeId(null);
    }
  };

  const handleUpdateProgress = async (initiativeId: string, newProgress: number) => {
    await updateInitiative(initiativeId, { progress_percentage: newProgress });
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  };

  const getStatusBadge = (status: InitiativeStatus) => (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>
      {statusLabels[status]}
    </span>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[1000px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Iniciativas - {keyResult.title}</DialogTitle>
          <DialogDescription>
            Gerencie as iniciativas e planos de ação para atingir este resultado-chave
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
                <div className="text-sm text-muted-foreground">Em Andamento</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                <div className="text-sm text-muted-foreground">Concluídas</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{stats.completionRate}%</div>
                <div className="text-sm text-muted-foreground">Taxa de Conclusão</div>
              </CardContent>
            </Card>
          </div>

          {/* New Initiative Button */}
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Iniciativas</h3>
              <p className="text-sm text-muted-foreground">
                Defina e gerencie os planos de ação para atingir este resultado-chave
              </p>
            </div>
            {!showNewForm && (
              <Button onClick={() => setShowNewForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Iniciativa
              </Button>
            )}
          </div>

          {/* New Initiative Form */}
          {showNewForm && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  {editingInitiative ? 'Editar Iniciativa' : 'Nova Iniciativa'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Target className="h-4 w-4" />
                  <AlertDescription>
                    Defina uma iniciativa específica com prazos e responsáveis claros para atingir o resultado-chave.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título da Iniciativa *</Label>
                    <Input
                      id="title"
                      placeholder="Nome da iniciativa..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="responsible">Responsável</Label>
                    <Input
                      id="responsible"
                      placeholder="Nome do responsável..."
                      value={responsible}
                      onChange={(e) => setResponsible(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="start-date">Data de Início *</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end-date">Data de Término *</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={status} onValueChange={(value: InitiativeStatus) => setStatus(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Prioridade</Label>
                    <Select value={priority} onValueChange={(value: InitiativePriority) => setPriority(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(priorityLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="budget">Orçamento (R$)</Label>
                    <Input
                      id="budget"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="progress">Progresso</Label>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>0%</span>
                        <span className="font-medium text-foreground">{progressPercentage}%</span>
                        <span>100%</span>
                      </div>
                      <Slider
                        value={[progressPercentage]}
                        onValueChange={(value) => setProgressPercentage(value[0])}
                        max={100}
                        min={0}
                        step={5}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    placeholder="Descreva os detalhes da iniciativa..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="completion-notes">Notas de Acompanhamento</Label>
                  <Textarea
                    id="completion-notes"
                    placeholder="Observações sobre o progresso..."
                    value={completionNotes}
                    onChange={(e) => setCompletionNotes(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSaveInitiative}
                    disabled={!title.trim() || !startDate || !endDate || loading}
                  >
                    {loading ? 'Salvando...' : editingInitiative ? 'Atualizar Iniciativa' : 'Salvar Iniciativa'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Initiatives List */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-base font-semibold">Lista de Iniciativas</h4>
              <div className="text-sm text-muted-foreground">
                {initiatives.length} iniciativas encontradas
              </div>
            </div>

            {initiatives.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Nenhuma iniciativa encontrada. Crie a primeira iniciativa usando o botão "Nova Iniciativa" acima.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {initiatives.map((initiative) => (
                  <Card key={initiative.id} className="relative hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm font-medium truncate">{initiative.title}</CardTitle>
                          <div className="flex items-center gap-1 mt-1">
                            {getStatusBadge(initiative.status)}
                            <Badge variant="outline" className="text-xs">
                              {priorityLabels[initiative.priority]}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewingInitiative(initiative)}
                            className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            title="Visualizar detalhes"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditInitiative(initiative)}
                            className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                            title="Editar iniciativa"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingInitiativeId(initiative.id)}
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                            title="Excluir iniciativa"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0 space-y-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(initiative.start_date)} - {formatDate(initiative.end_date)}</span>
                      </div>
                      
                      {initiative.responsible && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span className="truncate">{initiative.responsible}</span>
                        </div>
                      )}
                      
                      {initiative.budget && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <DollarSign className="h-3 w-3" />
                          <span>R$ {initiative.budget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                      
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium text-muted-foreground">Progresso</span>
                          <span className="text-xs font-medium">{initiative.progress_percentage}%</span>
                        </div>
                        <Progress value={initiative.progress_percentage} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Initiative Details Modal */}
        {viewingInitiative && (
          <Dialog open={!!viewingInitiative} onOpenChange={() => setViewingInitiative(null)}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  {viewingInitiative.title}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-2">
                  {getStatusBadge(viewingInitiative.status)}
                  <Badge variant="outline">
                    {priorityLabels[viewingInitiative.priority]}
                  </Badge>
                </div>
              </DialogHeader>
              
              <ScrollArea className="max-h-[60vh] pr-4">
                <div className="space-y-4">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-sm mb-1 text-muted-foreground">Período</h4>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-3 w-3" />
                        {formatDate(viewingInitiative.start_date)} - {formatDate(viewingInitiative.end_date)}
                      </div>
                    </div>
                    
                    {viewingInitiative.responsible && (
                      <div>
                        <h4 className="font-medium text-sm mb-1 text-muted-foreground">Responsável</h4>
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-3 w-3" />
                          {viewingInitiative.responsible}
                        </div>
                      </div>
                    )}
                  </div>

                  {viewingInitiative.budget && (
                    <div>
                      <h4 className="font-medium text-sm mb-1 text-muted-foreground">Orçamento</h4>
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-3 w-3" />
                        R$ {viewingInitiative.budget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  )}

                  {/* Progress */}
                  <div>
                    <h4 className="font-medium text-sm mb-2 text-muted-foreground">Progresso</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Conclusão</span>
                        <span className="text-sm font-medium">{viewingInitiative.progress_percentage}%</span>
                      </div>
                      <div className="group relative">
                        <Progress value={viewingInitiative.progress_percentage} className="w-full cursor-pointer hover:opacity-80 transition-opacity" />
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                          <Slider
                            value={[viewingInitiative.progress_percentage]}
                            onValueChange={(value) => handleUpdateProgress(viewingInitiative.id, value[0])}
                            max={100}
                            min={0}
                            step={5}
                            className="w-full h-full"
                          />
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Passe o mouse sobre a barra para ajustar o progresso
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {viewingInitiative.description && (
                    <div>
                      <h4 className="font-medium text-sm mb-2 text-muted-foreground">Descrição</h4>
                      <p className="text-sm leading-relaxed">{viewingInitiative.description}</p>
                    </div>
                  )}

                  {/* Completion Notes */}
                  {viewingInitiative.completion_notes && (
                    <div>
                      <h4 className="font-medium text-sm mb-2 text-muted-foreground">Notas de Acompanhamento</h4>
                      <p className="text-sm leading-relaxed">{viewingInitiative.completion_notes}</p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setViewingInitiative(null);
                    handleEditInitiative(viewingInitiative);
                  }}
                  className="text-green-600 border-green-200 hover:bg-green-50"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Iniciativa
                </Button>
                <Button variant="outline" onClick={() => setViewingInitiative(null)}>
                  Fechar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deletingInitiativeId} onOpenChange={() => setDeletingInitiativeId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir esta iniciativa? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteInitiative} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
};