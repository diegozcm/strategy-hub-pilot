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
import { KeyResult, KRInitiative, InitiativeStatus, InitiativePriority } from '@/types/strategic-map';
import { useState } from 'react';
import { Plus, Calendar, Target, AlertCircle, Edit, Trash2, User, DollarSign } from 'lucide-react';
import { useKRInitiatives } from '@/hooks/useKRInitiatives';
import { parseISO } from 'date-fns';
import { useAuth } from '@/hooks/useMultiTenant';
import { usePlanPeriodOptions } from '@/hooks/usePlanPeriodOptions';

// Helper: Converter quarter para datas de início e fim
const quarterToDates = (quarter: 1 | 2 | 3 | 4, year: number) => {
  const startMonths = { 1: '01', 2: '04', 3: '07', 4: '10' };
  const endMonths = { 1: '03', 2: '06', 3: '09', 4: '12' };
  const endDays = { 1: '31', 2: '30', 3: '30', 4: '31' };
  
  return {
    start_date: `${year}-${startMonths[quarter]}-01`,
    end_date: `${year}-${endMonths[quarter]}-${endDays[quarter]}`
  };
};

// Helper: Detectar quarter a partir de uma data
const dateToQuarter = (dateString: string): { quarter: 1 | 2 | 3 | 4, year: number } | null => {
  if (!dateString) return null;
  const date = parseISO(dateString);
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const quarter = Math.ceil(month / 3) as 1 | 2 | 3 | 4;
  return { quarter, year };
};

// Helper: Formatar quarter para exibição "Q1 (jan-mar) 2026"
const formatQuarterDisplay = (startDate: string): string => {
  const quarterInfo = dateToQuarter(startDate);
  if (!quarterInfo) return startDate;
  
  const quarterLabels: Record<number, string> = {
    1: 'Q1 (jan-mar)',
    2: 'Q2 (abr-jun)',
    3: 'Q3 (jul-set)',
    4: 'Q4 (out-dez)'
  };
  
  return `${quarterLabels[quarterInfo.quarter]} ${quarterInfo.year}`;
};

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
  planned: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  on_hold: 'bg-muted text-muted-foreground'
};

export const KRInitiativesModal = ({ keyResult, open, onClose }: KRInitiativesModalProps) => {
  const { company } = useAuth();
  const { initiatives, loading, createInitiative, updateInitiative, deleteInitiative, getInitiativeStats } = useKRInitiatives(keyResult?.id);
  const { quarterOptions } = usePlanPeriodOptions();
  
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingInitiative, setEditingInitiative] = useState<KRInitiative | null>(null);
  const [deletingInitiativeId, setDeletingInitiativeId] = useState<string | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedQuarter, setSelectedQuarter] = useState('');
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
    setSelectedQuarter('');
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
    
    // Detectar quarter da iniciativa existente
    const quarterInfo = dateToQuarter(initiative.start_date);
    if (quarterInfo) {
      setSelectedQuarter(`${quarterInfo.year}-Q${quarterInfo.quarter}`);
    } else {
      setSelectedQuarter('');
    }
    
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

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="quarter">Período (Quarter) *</Label>
                    <Select 
                      value={selectedQuarter} 
                      onValueChange={(value) => {
                        setSelectedQuarter(value);
                        const [year, q] = value.split('-Q');
                        const dates = quarterToDates(parseInt(q) as 1 | 2 | 3 | 4, parseInt(year));
                        setStartDate(dates.start_date);
                        setEndDate(dates.end_date);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o quarter..." />
                      </SelectTrigger>
                      <SelectContent>
                        {quarterOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      O período define automaticamente as datas de início e término
                    </p>
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
              <div className="space-y-4">
                {initiatives.map((initiative) => (
                  <Card key={initiative.id}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <CardTitle className="text-base">{initiative.title}</CardTitle>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatQuarterDisplay(initiative.start_date)}
                            {initiative.responsible && (
                              <>
                                <User className="h-3 w-3 ml-2" />
                                {initiative.responsible}
                              </>
                            )}
                            {initiative.budget && (
                              <>
                                <DollarSign className="h-3 w-3 ml-2" />
                                R$ {initiative.budget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(initiative.status)}
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditInitiative(initiative)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeletingInitiativeId(initiative.id)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {initiative.description && (
                        <div>
                          <h4 className="font-medium text-sm mb-1">Descrição</h4>
                          <p className="text-sm text-muted-foreground">{initiative.description}</p>
                        </div>
                      )}
                      
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium text-sm">Progresso</h4>
                          <span className="text-sm text-muted-foreground">{initiative.progress_percentage}%</span>
                        </div>
                        <div className="group relative">
                          <Progress value={initiative.progress_percentage} className="w-full cursor-pointer hover:opacity-80 transition-opacity" />
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                            <Slider
                              value={[initiative.progress_percentage]}
                              onValueChange={(value) => handleUpdateProgress(initiative.id, value[0])}
                              max={100}
                              min={0}
                              step={5}
                              className="w-full h-full"
                            />
                          </div>
                        </div>
                      </div>

                      {initiative.completion_notes && (
                        <div>
                          <h4 className="font-medium text-sm mb-1">Notas de Acompanhamento</h4>
                          <p className="text-sm text-muted-foreground">{initiative.completion_notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

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