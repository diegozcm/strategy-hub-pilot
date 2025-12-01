import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Save, X, Trash2, MoreVertical, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResultadoChaveMiniCard } from '@/components/strategic-map/ResultadoChaveMiniCard';
import { KeyResult } from '@/types/strategic-map';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Flexible interface for objective to support both ObjectivesPage and StrategicMap
interface ObjectiveData {
  id: string;
  plan_id: string;
  pillar_id: string;
  title: string;
  description?: string;
  responsible?: string;
  deadline?: string;
  status?: string;
  progress: number;
  owner_id: string;
  target_date?: string;
  created_at: string;
  updated_at?: string;
}

interface StrategicPillar {
  id: string;
  name: string;
  description?: string;
  color: string;
  company_id?: string;
}

interface StrategicPlan {
  id: string;
  name: string;
  status?: string;
  period_start?: string;
  period_end?: string;
  vision?: string;
  mission?: string;
  company_id?: string;
  created_at?: string;
}

interface ObjectiveDetailModalProps {
  objective: ObjectiveData | null;
  open: boolean;
  onClose: () => void;
  keyResults: KeyResult[];
  pillar: StrategicPillar | null;
  plan: StrategicPlan | null;
  onUpdate: (data: Partial<ObjectiveData>) => Promise<void>;
  onDelete?: () => Promise<void>;
  onOpenKeyResultDetails: (kr: KeyResult) => void;
  pillars: StrategicPillar[];
  progressPercentage: number;
  selectedPeriod?: 'ytd' | 'monthly' | 'yearly' | 'quarterly';
  selectedMonth?: number;
  selectedYear?: number;
  selectedQuarter?: 1 | 2 | 3 | 4;
  selectedQuarterYear?: number;
}

export const ObjectiveDetailModal: React.FC<ObjectiveDetailModalProps> = ({
  objective,
  open,
  onClose,
  keyResults,
  pillar,
  plan,
  onUpdate,
  onDelete,
  onOpenKeyResultDetails,
  pillars,
  progressPercentage,
  selectedPeriod = 'ytd',
  selectedMonth,
  selectedYear,
  selectedQuarter,
  selectedQuarterYear,
}) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    target_date: '',
    pillar_id: '',
  });

  // Calcular percentual do objetivo baseado no período selecionado
  // Usa a mesma lógica do useKRMetrics para garantir consistência
  const calculateObjectiveProgress = () => {
    if (keyResults.length === 0) return 0;
    
    const percentages = keyResults.map(kr => {
      // Para período trimestral - calcular dinamicamente usando os meses do quarter
      if (selectedPeriod === 'quarterly' && selectedQuarter && selectedQuarterYear) {
        const quarterMonths = {
          1: [1, 2, 3],
          2: [4, 5, 6],
          3: [7, 8, 9],
          4: [10, 11, 12]
        };
        const months = quarterMonths[selectedQuarter];
        const monthKeys = months.map(m => `${selectedQuarterYear}-${m.toString().padStart(2, '0')}`);
        
        const monthlyTargets = (kr.monthly_targets as Record<string, number>) || {};
        const monthlyActual = (kr.monthly_actual as Record<string, number>) || {};
        const aggregationType = kr.aggregation_type || 'sum';
        
        const targetValues = monthKeys.map(key => monthlyTargets[key] || 0);
        const actualValues = monthKeys.map(key => monthlyActual[key] || 0);
        
        let totalTarget = 0;
        let totalActual = 0;
        
        switch (aggregationType) {
          case 'sum':
            totalTarget = targetValues.reduce((sum, v) => sum + v, 0);
            totalActual = actualValues.reduce((sum, v) => sum + v, 0);
            break;
          case 'average':
            const validTargets = targetValues.filter(v => v > 0);
            const validActuals = actualValues.filter(v => v > 0);
            totalTarget = validTargets.length > 0 ? validTargets.reduce((sum, v) => sum + v, 0) / validTargets.length : 0;
            totalActual = validActuals.length > 0 ? validActuals.reduce((sum, v) => sum + v, 0) / validActuals.length : 0;
            break;
          case 'max':
            totalTarget = targetValues.length > 0 ? Math.max(...targetValues) : 0;
            totalActual = actualValues.length > 0 ? Math.max(...actualValues) : 0;
            break;
          case 'min':
            const nonZeroTargets = targetValues.filter(v => v > 0);
            const nonZeroActuals = actualValues.filter(v => v > 0);
            totalTarget = nonZeroTargets.length > 0 ? Math.min(...nonZeroTargets) : 0;
            totalActual = nonZeroActuals.length > 0 ? Math.min(...nonZeroActuals) : 0;
            break;
        }
        
        if (kr.target_direction === 'minimize') {
          return totalActual > 0 ? (totalTarget / totalActual) * 100 : (totalTarget === 0 ? 100 : 0);
        } else {
          return totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;
        }
      }
      
      // Para período mensal com mês específico
      if (selectedPeriod === 'monthly' && selectedMonth && selectedYear) {
        const monthKey = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
        const monthlyTargets = (kr.monthly_targets as Record<string, number>) || {};
        const monthlyActual = (kr.monthly_actual as Record<string, number>) || {};
        
        const monthTarget = monthlyTargets[monthKey] || 0;
        const monthActual = monthlyActual[monthKey] || 0;
        
        // Aplicar fórmula baseada em target_direction
        if (kr.target_direction === 'minimize') {
          return monthActual > 0 ? (monthTarget / monthActual) * 100 : (monthTarget === 0 ? 100 : 0);
        } else {
          return monthTarget > 0 ? (monthActual / monthTarget) * 100 : 0;
        }
      }
      
      // Para período anual com ano específico - calcular dinamicamente
      if (selectedPeriod === 'yearly' && selectedYear) {
        const monthKeys = [];
        for (let m = 1; m <= 12; m++) {
          monthKeys.push(`${selectedYear}-${m.toString().padStart(2, '0')}`);
        }
        
        const monthlyTargets = (kr.monthly_targets as Record<string, number>) || {};
        const monthlyActual = (kr.monthly_actual as Record<string, number>) || {};
        const aggregationType = kr.aggregation_type || 'sum';
        
        const targetValues = monthKeys.map(key => monthlyTargets[key] || 0);
        const actualValues = monthKeys.map(key => monthlyActual[key] || 0);
        
        let totalTarget = 0;
        let totalActual = 0;
        
        // Calcular baseado no tipo de agregação
        switch (aggregationType) {
          case 'sum':
            totalTarget = targetValues.reduce((sum, v) => sum + v, 0);
            totalActual = actualValues.reduce((sum, v) => sum + v, 0);
            break;
          case 'average':
            const validTargets = targetValues.filter(v => v > 0);
            const validActuals = actualValues.filter(v => v > 0);
            totalTarget = validTargets.length > 0 ? validTargets.reduce((sum, v) => sum + v, 0) / validTargets.length : 0;
            totalActual = validActuals.length > 0 ? validActuals.reduce((sum, v) => sum + v, 0) / validActuals.length : 0;
            break;
          case 'max':
            totalTarget = targetValues.length > 0 ? Math.max(...targetValues) : 0;
            totalActual = actualValues.length > 0 ? Math.max(...actualValues) : 0;
            break;
          case 'min':
            const nonZeroTargets = targetValues.filter(v => v > 0);
            const nonZeroActuals = actualValues.filter(v => v > 0);
            totalTarget = nonZeroTargets.length > 0 ? Math.min(...nonZeroTargets) : 0;
            totalActual = nonZeroActuals.length > 0 ? Math.min(...nonZeroActuals) : 0;
            break;
        }
        
        // Aplicar fórmula baseada em target_direction
        if (kr.target_direction === 'minimize') {
          return totalActual > 0 ? (totalTarget / totalActual) * 100 : (totalTarget === 0 ? 100 : 0);
        } else {
          return totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;
        }
      }
      
      // Período mensal (mês atual) - usar valor pré-calculado
      if (selectedPeriod === 'monthly') {
        return kr.monthly_percentage || 0;
      }
      
      // Período anual (ano atual) - usar valor pré-calculado
      if (selectedPeriod === 'yearly') {
        return kr.yearly_percentage || 0;
      }
      
      // YTD (padrão)
      return kr.ytd_percentage || 0;
    });
    
    const sum = percentages.reduce((acc, p) => acc + p, 0);
    return sum / percentages.length;
  };

  const currentProgress = calculateObjectiveProgress();

  useEffect(() => {
    if (objective) {
      setEditForm({
        title: objective.title,
        description: objective.description || '',
        target_date: objective.target_date || '',
        pillar_id: objective.pillar_id || '',
      });
    }
  }, [objective]);

  const handleUpdate = async () => {
    await onUpdate(editForm);
    setIsEditing(false);
  };

  const handleClose = () => {
    setIsEditing(false);
    onClose();
  };

  const handleDeleteConfirm = async () => {
    if (onDelete) {
      await onDelete();
      setShowDeleteConfirm(false);
      onClose();
    }
  };

  if (!objective) return null;

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-xl">
                  {objective.title}
                </DialogTitle>
                <Badge 
                  className={`font-semibold text-xl ${
                    currentProgress > 105 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                    currentProgress >= 100 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                    currentProgress >= 71 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                  }`}
                >
                  {currentProgress.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                </Badge>
              </div>
              <DialogDescription>
                <div className="flex items-center gap-2 mt-2">
                  {pillar && (
                    <Badge 
                      variant="secondary" 
                      style={{ 
                        backgroundColor: `${pillar.color}20`, 
                        color: pillar.color 
                      }}
                    >
                      {pillar.name}
                    </Badge>
                  )}
                  {plan && (
                    <Badge variant="outline">
                      {plan.name}
                    </Badge>
                  )}
                  <Badge variant="outline">
                    {selectedPeriod === 'yearly' 
                      ? '📅 Ano' 
                      : selectedPeriod === 'monthly' 
                      ? (selectedMonth && selectedYear
                          ? `📆 ${new Date(selectedYear, selectedMonth - 1, 1)
                              .toLocaleDateString('pt-BR', { month: 'long' })
                              .charAt(0).toUpperCase() + 
                              new Date(selectedYear, selectedMonth - 1, 1)
                              .toLocaleDateString('pt-BR', { month: 'long' })
                              .slice(1)}`
                          : `📆 ${format(new Date(), 'MMMM', { locale: ptBR }).charAt(0).toUpperCase() + format(new Date(), 'MMMM', { locale: ptBR }).slice(1)}`)
                      : '📊 YTD'}
                  </Badge>
                </div>
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    {onDelete && (
                      <DropdownMenuItem 
                        onClick={() => setShowDeleteConfirm(true)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {isEditing && (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                  <X className="w-4 h-4 mr-1" />
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Título</Label>
                <Input
                  id="edit-title"
                  value={editForm.title}
                  onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Descrição</Label>
                <Textarea
                  id="edit-description"
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-target-date">Data Meta</Label>
                  <Input
                    id="edit-target-date"
                    type="date"
                    value={editForm.target_date}
                    onChange={(e) => setEditForm(prev => ({ ...prev, target_date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-pillar">Pilar Estratégico</Label>
                  <Select value={editForm.pillar_id} onValueChange={(value) => setEditForm(prev => ({ ...prev, pillar_id: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {pillars.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleUpdate}>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Descrição</h3>
                <p className="text-sm text-muted-foreground">{objective.description || 'Nenhuma descrição fornecida.'}</p>
              </div>
              
              {objective.target_date && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground">Data Meta</h4>
                  <p className="text-xs">{new Date(objective.target_date).toLocaleDateString('pt-BR')}</p>
                </div>
              )}

              <div>
                <div className="mb-3">
                  <h3 className="font-medium">Resultados-Chave</h3>
                </div>
                <div className="space-y-2">
                  {keyResults.map((kr) => (
                    <ResultadoChaveMiniCard 
                      key={kr.id} 
                      resultadoChave={kr}
                      pillar={pillar}
                      onOpenDetails={onOpenKeyResultDetails}
                      selectedPeriod={selectedPeriod}
                      selectedMonth={selectedMonth}
                      selectedYear={selectedYear}
                      selectedQuarter={selectedQuarter}
                    />
                  ))}
                  {keyResults.length === 0 && (
                    <div className="text-center py-6">
                      <p className="text-sm text-muted-foreground mb-4">
                        Nenhum resultado-chave definido.
                      </p>
                      <Button 
                        onClick={() => navigate('/app/indicators')}
                        size="sm"
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Criar Primeiro Resultado-Chave
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o objetivo <strong>"{objective.title}"</strong>?
              {keyResults.length > 0 && (
                <span className="block mt-2 text-destructive">
                  Atenção: Este objetivo possui {keyResults.length} resultado(s)-chave associado(s) que também serão excluídos.
                </span>
              )}
              <span className="block mt-2">
                Esta ação não pode ser desfeita.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir Objetivo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};
