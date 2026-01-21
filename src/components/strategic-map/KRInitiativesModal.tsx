import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Slider } from '@/components/ui/slider';
import { ProgressSlider } from '@/components/ui/progress-slider';
import { KeyResult, KRInitiative, InitiativeStatus, InitiativePriority } from '@/types/strategic-map';
import { useState } from 'react';
import { Plus, Calendar, Target, AlertCircle, Edit, Trash2, User, DollarSign, GripVertical } from 'lucide-react';
import { useKRInitiatives } from '@/hooks/useKRInitiatives';
import { parseISO, format } from 'date-fns';
import { useAuth } from '@/hooks/useMultiTenant';
import { usePlanPeriodOptions } from '@/hooks/usePlanPeriodOptions';
import { useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableInitiativeCard } from './initiatives/SortableInitiativeCard';

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

// Helper: Converter ano inteiro para datas de início e fim
const yearToDates = (year: number) => ({
  start_date: `${year}-01-01`,
  end_date: `${year}-12-31`
});

// Helper: Detectar quarter a partir de uma data
const dateToQuarter = (dateString: string): { quarter: 1 | 2 | 3 | 4, year: number } | null => {
  if (!dateString) return null;
  const date = parseISO(dateString);
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const quarter = Math.ceil(month / 3) as 1 | 2 | 3 | 4;
  return { quarter, year };
};

// Helper: Detectar tipo de período (quarter, year, custom)
const detectPeriodType = (startDate: string, endDate: string): { type: string; year: number } => {
  const startInfo = dateToQuarter(startDate);
  const endInfo = dateToQuarter(endDate);
  
  if (!startInfo || !endInfo) {
    return { type: 'custom', year: new Date().getFullYear() };
  }
  
  // Verificar se é ano todo
  if (startDate.endsWith('-01-01') && endDate.endsWith('-12-31') && startInfo.year === endInfo.year) {
    return { type: 'year', year: startInfo.year };
  }
  
  // Verificar se é um quarter válido (mesmo quarter, mesmas datas esperadas)
  if (startInfo.quarter === endInfo.quarter && startInfo.year === endInfo.year) {
    const expectedDates = quarterToDates(startInfo.quarter, startInfo.year);
    if (startDate === expectedDates.start_date && endDate === expectedDates.end_date) {
      return { type: startInfo.quarter.toString(), year: startInfo.year };
    }
  }
  
  // Caso contrário é personalizado
  return { type: 'custom', year: startInfo.year };
};

// Helper: Formatar período para exibição
const formatPeriodDisplay = (startDate: string, endDate: string): string => {
  const periodInfo = detectPeriodType(startDate, endDate);
  
  if (periodInfo.type === 'year') {
    return `Ano Todo ${periodInfo.year}`;
  }
  
  if (['1', '2', '3', '4'].includes(periodInfo.type)) {
    const quarterLabels: Record<string, string> = {
      '1': 'Q1 (jan-mar)',
      '2': 'Q2 (abr-jun)',
      '3': 'Q3 (jul-set)',
      '4': 'Q4 (out-dez)'
    };
    return `${quarterLabels[periodInfo.type]} ${periodInfo.year}`;
  }
  
  // Personalizado - mostrar datas
  try {
    const start = format(parseISO(startDate), 'dd/MM/yyyy');
    const end = format(parseISO(endDate), 'dd/MM/yyyy');
    return `${start} - ${end}`;
  } catch {
    return `${startDate} - ${endDate}`;
  }
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

// Helper: Mapear progresso para status automático
const getStatusFromProgress = (progress: number): InitiativeStatus => {
  if (progress >= 100) return 'completed';
  if (progress > 0) return 'in_progress';
  return 'planned';
};

// Helper: Verificar se o status atual bloqueia alterações de progresso
const isProgressLocked = (status: InitiativeStatus): boolean => {
  return status === 'cancelled' || status === 'on_hold';
};

// Period options for display
const periodSelectOptions = [
  { value: '1', label: 'Q1 (Jan - Mar)' },
  { value: '2', label: 'Q2 (Abr - Jun)' },
  { value: '3', label: 'Q3 (Jul - Set)' },
  { value: '4', label: 'Q4 (Out - Dez)' },
  { value: 'year', label: 'Ano Todo' },
  { value: 'custom', label: 'Personalizado' }
];

export const KRInitiativesModal = ({ keyResult, open, onClose }: KRInitiativesModalProps) => {
  const { company } = useAuth();
  const { initiatives, loading, createInitiative, updateInitiative, deleteInitiative, reorderInitiatives, getInitiativeStats } = useKRInitiatives(keyResult?.id);
  const { yearOptions } = usePlanPeriodOptions();
  
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingInitiative, setEditingInitiative] = useState<KRInitiative | null>(null);
  const [deletingInitiativeId, setDeletingInitiativeId] = useState<string | null>(null);
  const [activeInitiative, setActiveInitiative] = useState<KRInitiative | null>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Sync selectedYear with available yearOptions - select closest to current year
  useEffect(() => {
    if (yearOptions.length === 0) return;
    const currentYr = new Date().getFullYear();
    const isYearValid = yearOptions.some(opt => opt.value === selectedYear);
    
    if (!isYearValid) {
      // Find closest year to current year
      const closestYear = yearOptions.reduce((closest, opt) => {
        const closestDiff = Math.abs(closest.value - currentYr);
        const optDiff = Math.abs(opt.value - currentYr);
        return optDiff < closestDiff ? opt : closest;
      }, yearOptions[0]);
      
      setSelectedYear(closestYear.value);
    }
  }, [yearOptions, selectedYear]);

  // Auto-update dates when period or year changes
  useEffect(() => {
    if (!selectedPeriod || !selectedYear) return;
    
    // Modo personalizado: não auto-atualiza datas
    if (selectedPeriod === 'custom') return;
    
    if (selectedPeriod === 'year') {
      // Ano todo
      const dates = yearToDates(selectedYear);
      setStartDate(dates.start_date);
      setEndDate(dates.end_date);
    } else if (['1', '2', '3', '4'].includes(selectedPeriod)) {
      // Quarter específico
      const dates = quarterToDates(parseInt(selectedPeriod) as 1 | 2 | 3 | 4, selectedYear);
      setStartDate(dates.start_date);
      setEndDate(dates.end_date);
    }
  }, [selectedPeriod, selectedYear]);
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
    setSelectedPeriod('');
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
      company_id: company?.id,
      title: title.trim(),
      description: description.trim() || null,
      start_date: startDate,
      end_date: endDate,
      status,
      priority,
      responsible: responsible.trim() || null,
      budget: budget ? parseFloat(budget) : null,
      progress_percentage: progressPercentage,
      completion_notes: completionNotes.trim() || null
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
    
    // Detectar tipo de período da iniciativa existente
    const periodInfo = detectPeriodType(initiative.start_date, initiative.end_date);
    setSelectedPeriod(periodInfo.type);
    setSelectedYear(periodInfo.year);
    
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
    // Encontrar a iniciativa atual
    const initiative = initiatives.find(i => i.id === initiativeId);
    if (!initiative) return;
    
    // Não permitir mudança se estiver cancelada ou em espera
    if (isProgressLocked(initiative.status)) return;
    
    // Calcular o novo status baseado no progresso
    const newStatus = getStatusFromProgress(newProgress);
    
    // Atualizar progresso E status juntos
    await updateInitiative(initiativeId, { 
      progress_percentage: newProgress,
      status: newStatus
    });
  };

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    const initiative = initiatives.find(i => i.id === event.active.id);
    if (initiative) setActiveInitiative(initiative);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveInitiative(null);
    
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    
    const oldIndex = initiatives.findIndex(i => i.id === active.id);
    const newIndex = initiatives.findIndex(i => i.id === over.id);
    
    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(initiatives, oldIndex, newIndex);
      await reorderInitiatives(reordered);
    }
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
                    <Label>Período *</Label>
                    <Select 
                      value={selectedPeriod} 
                      onValueChange={(value) => setSelectedPeriod(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {periodSelectOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Ano *</Label>
                    <Select 
                      value={selectedYear.toString()} 
                      onValueChange={(value) => setSelectedYear(parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {yearOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value.toString()}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Custom date fields - only show when "Personalizado" is selected */}
                  {selectedPeriod === 'custom' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="startDate">Data de Início *</Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endDate">Data de Fim *</Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                      </div>
                    </>
                  )}

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
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext 
                  items={initiatives.map(i => i.id)} 
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-4">
                    {initiatives.map((initiative) => (
                      <SortableInitiativeCard
                        key={initiative.id}
                        initiative={initiative}
                        onEdit={handleEditInitiative}
                        onDelete={setDeletingInitiativeId}
                        onUpdateProgress={handleUpdateProgress}
                        formatPeriodDisplay={formatPeriodDisplay}
                        getStatusBadge={getStatusBadge}
                        statusLabels={statusLabels}
                        isProgressLocked={isProgressLocked}
                      />
                    ))}
                  </div>
                </SortableContext>
                
                <DragOverlay>
                  {activeInitiative && (
                    <Card className="shadow-xl ring-2 ring-primary/20">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">{activeInitiative.title}</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatPeriodDisplay(activeInitiative.start_date, activeInitiative.end_date)}
                        </div>
                      </CardHeader>
                    </Card>
                  )}
                </DragOverlay>
              </DndContext>
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