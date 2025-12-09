import { useState, useEffect } from 'react';
import { MoreVertical, Target, Calendar, User, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { StrategicObjective, KeyResult } from '@/types/strategic-map';
import { ResultadoChaveMiniCard } from './ResultadoChaveMiniCard';
import { KROverviewModal } from './KROverviewModal';
import { AddResultadoChaveModal } from './AddResultadoChaveModal';
import { EditKeyResultModal } from './EditKeyResultModal';
import { ObjectiveDetailModal } from '@/components/objectives/ObjectiveDetailModal';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useMultiTenant';

interface ObjectiveCardProps {
  objective: StrategicObjective;
  compact?: boolean;
  keyResults?: KeyResult[];
  pillar?: { id: string; name: string; color: string; } | null;
  onAddResultadoChave?: (resultadoChaveData: Omit<KeyResult, 'id' | 'owner_id' | 'created_at' | 'updated_at'>) => Promise<any>;
  onRefreshData?: () => void;
  selectedPeriod?: 'ytd' | 'monthly' | 'yearly' | 'quarterly';
  selectedMonth?: number;
  selectedYear?: number;
  selectedQuarter?: 1 | 2 | 3 | 4;
  selectedQuarterYear?: number;
  onPeriodChange?: (period: 'ytd' | 'monthly' | 'yearly' | 'quarterly') => void;
  onMonthChange?: (month: number) => void;
  onYearChange?: (year: number) => void;
}

const getProgressColor = (progress: number) => {
  if (progress < 30) return 'bg-red-500';
  if (progress < 60) return 'bg-yellow-500';
  if (progress < 80) return 'bg-blue-500';
  return 'bg-green-500';
};

const calculateObjectiveProgress = (
  keyResults: KeyResult[], 
  period: 'ytd' | 'monthly' | 'yearly' | 'quarterly' = 'ytd',
  options?: {
    selectedMonth?: number;
    selectedYear?: number;
    selectedQuarter?: 1 | 2 | 3 | 4;
    selectedQuarterYear?: number;
  }
) => {
  if (keyResults.length === 0) return 0;
  
  const totalProgress = keyResults.reduce((sum, kr) => {
    let percentage = 0;
    
    switch (period) {
      case 'quarterly':
        const quarter = options?.selectedQuarter || 1;
        const quarterYear = options?.selectedQuarterYear || new Date().getFullYear();
        
        // Calcular dinamicamente para quarter customizado
        if (options?.selectedQuarter && options?.selectedQuarterYear) {
          const quarterMonths = {
            1: [1, 2, 3],
            2: [4, 5, 6],
            3: [7, 8, 9],
            4: [10, 11, 12]
          };
          const months = quarterMonths[quarter];
          const monthKeys = months.map(m => `${quarterYear}-${m.toString().padStart(2, '0')}`);
          
          const monthlyTargets = (kr.monthly_targets as Record<string, number>) || {};
          const monthlyActual = (kr.monthly_actual as Record<string, number>) || {};
          
          let totalTarget = 0;
          let totalActual = 0;
          
          // Aplicar agregação baseada no tipo
          if (kr.aggregation_type === 'average') {
            // Pegar apenas os meses que têm dados de actual
            const monthsWithActual = monthKeys.filter(key => (monthlyActual[key] || 0) !== 0);
            
            const targets = monthsWithActual.map(key => monthlyTargets[key] || 0);
            const actuals = monthsWithActual.map(key => monthlyActual[key] || 0);
            
            totalTarget = targets.length > 0 ? targets.reduce((sum, v) => sum + v, 0) / targets.length : 0;
            totalActual = actuals.length > 0 ? actuals.reduce((sum, v) => sum + v, 0) / actuals.length : 0;
          } else if (kr.aggregation_type === 'max') {
            const targets = monthKeys.map(key => monthlyTargets[key] || 0);
            const actuals = monthKeys.map(key => monthlyActual[key] || 0);
            totalTarget = targets.length > 0 ? Math.max(...targets) : 0;
            totalActual = actuals.length > 0 ? Math.max(...actuals) : 0;
          } else if (kr.aggregation_type === 'min') {
            const targets = monthKeys.map(key => monthlyTargets[key] || 0).filter(v => v > 0);
            const actuals = monthKeys.map(key => monthlyActual[key] || 0).filter(v => v > 0);
            totalTarget = targets.length > 0 ? Math.min(...targets) : 0;
            totalActual = actuals.length > 0 ? Math.min(...actuals) : 0;
          } else {
            // sum (default)
            totalTarget = monthKeys.reduce((sum, key) => sum + (monthlyTargets[key] || 0), 0);
            totalActual = monthKeys.reduce((sum, key) => sum + (monthlyActual[key] || 0), 0);
          }
          
          // Calcular percentage com fórmula correta
          // Para minimize: sem dados (actual=0) = 0%, não 100%
          if (kr.target_direction === 'minimize') {
            percentage = (totalActual > 0 && totalTarget > 0) ? (totalTarget / totalActual) * 100 : 0;
          } else {
            percentage = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;
          }
        } else {
          // Usar valor pré-calculado
          switch (quarter) {
            case 1: percentage = kr.q1_percentage || 0; break;
            case 2: percentage = kr.q2_percentage || 0; break;
            case 3: percentage = kr.q3_percentage || 0; break;
            case 4: percentage = kr.q4_percentage || 0; break;
          }
        }
        break;
      case 'monthly':
        // Se mês customizado foi fornecido, recalcular
        if (options?.selectedMonth && options?.selectedYear) {
          const monthKey = `${options.selectedYear}-${options.selectedMonth.toString().padStart(2, '0')}`;
          const monthlyTargets = (kr.monthly_targets as Record<string, number>) || {};
          const monthlyActual = (kr.monthly_actual as Record<string, number>) || {};
          
          const monthTarget = monthlyTargets[monthKey] || 0;
          const monthActual = monthlyActual[monthKey] || 0;
          
          // Usar fórmula correta para minimize
          // Para minimize: sem dados (actual=0) = 0%, não 100%
          if (kr.target_direction === 'minimize') {
            percentage = (monthActual > 0 && monthTarget > 0) ? (monthTarget / monthActual) * 100 : 0;
          } else {
            percentage = monthTarget > 0 ? (monthActual / monthTarget) * 100 : 0;
          }
        } else {
          // Usar valor pré-calculado do mês atual
          percentage = kr.monthly_percentage || 0;
        }
        break;
      case 'yearly':
        // Se ano customizado foi fornecido, recalcular
        if (options?.selectedYear) {
          const monthKeys = [];
          for (let m = 1; m <= 12; m++) {
            monthKeys.push(`${options.selectedYear}-${m.toString().padStart(2, '0')}`);
          }
          
          const monthlyTargets = (kr.monthly_targets as Record<string, number>) || {};
          const monthlyActual = (kr.monthly_actual as Record<string, number>) || {};
          
          let totalTarget = 0;
          let totalActual = 0;
          
          // Aplicar agregação baseada no tipo
          if (kr.aggregation_type === 'average') {
            // Pegar apenas os meses que têm dados de actual
            const monthsWithActual = monthKeys.filter(key => (monthlyActual[key] || 0) !== 0);
            
            const targets = monthsWithActual.map(key => monthlyTargets[key] || 0);
            const actuals = monthsWithActual.map(key => monthlyActual[key] || 0);
            
            totalTarget = targets.length > 0 ? targets.reduce((sum, v) => sum + v, 0) / targets.length : 0;
            totalActual = actuals.length > 0 ? actuals.reduce((sum, v) => sum + v, 0) / actuals.length : 0;
          } else if (kr.aggregation_type === 'max') {
            const targets = monthKeys.map(key => monthlyTargets[key] || 0);
            const actuals = monthKeys.map(key => monthlyActual[key] || 0);
            totalTarget = targets.length > 0 ? Math.max(...targets) : 0;
            totalActual = actuals.length > 0 ? Math.max(...actuals) : 0;
          } else if (kr.aggregation_type === 'min') {
            const targets = monthKeys.map(key => monthlyTargets[key] || 0).filter(v => v > 0);
            const actuals = monthKeys.map(key => monthlyActual[key] || 0).filter(v => v > 0);
            totalTarget = targets.length > 0 ? Math.min(...targets) : 0;
            totalActual = actuals.length > 0 ? Math.min(...actuals) : 0;
          } else {
            // sum (default)
            totalTarget = monthKeys.reduce((sum, key) => sum + (monthlyTargets[key] || 0), 0);
            totalActual = monthKeys.reduce((sum, key) => sum + (monthlyActual[key] || 0), 0);
          }
          
          // Calcular percentage com fórmula correta
          // Para minimize: sem dados (actual=0) = 0%, não 100%
          if (kr.target_direction === 'minimize') {
            percentage = (totalActual > 0 && totalTarget > 0) ? (totalTarget / totalActual) * 100 : 0;
          } else {
            percentage = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;
          }
        } else {
          percentage = kr.yearly_percentage || 0;
        }
        break;
      case 'ytd':
      default:
        percentage = kr.ytd_percentage || 0;
        break;
    }
    
    return sum + percentage;
  }, 0);
  
  return totalProgress / keyResults.length;
};

export const ObjectiveCard = ({ 
  objective, 
  compact = false, 
  keyResults = [], 
  pillar, 
  onAddResultadoChave, 
  onRefreshData,
  selectedPeriod = 'ytd',
  selectedMonth,
  selectedYear,
  selectedQuarter,
  selectedQuarterYear,
  onPeriodChange,
  onMonthChange,
  onYearChange
}: ObjectiveCardProps) => {
  const [showResultadoChaveForm, setShowResultadoChaveForm] = useState(false);
  const [selectedKeyResult, setSelectedKeyResult] = useState<KeyResult | null>(null);
  const [isEditKeyResultModalOpen, setIsEditKeyResultModalOpen] = useState(false);
  const [selectedKeyResultForOverview, setSelectedKeyResultForOverview] = useState<KeyResult | null>(null);
  const [isKROverviewModalOpen, setIsKROverviewModalOpen] = useState(false);
  const [isObjectiveDetailModalOpen, setIsObjectiveDetailModalOpen] = useState(false);
  const [pillars, setPillars] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const { toast } = useToast();
  const { company } = useAuth();
  const progressPercentage = calculateObjectiveProgress(
    keyResults, 
    selectedPeriod,
    selectedPeriod === 'monthly' 
      ? { selectedMonth, selectedYear }
      : selectedPeriod === 'quarterly'
      ? { selectedQuarter, selectedQuarterYear }
      : selectedPeriod === 'yearly'
      ? { selectedYear }
      : undefined
  );

  // Fetch pillars and plans for the modal
  useEffect(() => {
    const fetchData = async () => {
      if (!company?.id) return;
      
      const [pillarsResponse, plansResponse] = await Promise.all([
        supabase.from('strategic_pillars').select('*').eq('company_id', company.id),
        supabase.from('strategic_plans').select('*').eq('company_id', company.id),
      ]);

      if (pillarsResponse.data) setPillars(pillarsResponse.data);
      if (plansResponse.data) setPlans(plansResponse.data);
    };
    fetchData();
  }, [company?.id]);

  // Sincronizar selectedKeyResultForOverview com a lista atualizada
  useEffect(() => {
    if (selectedKeyResultForOverview && keyResults.length > 0) {
      const updatedKR = keyResults.find(kr => kr.id === selectedKeyResultForOverview.id);
      if (updatedKR) {
        if (JSON.stringify(updatedKR) !== JSON.stringify(selectedKeyResultForOverview)) {
          console.log('[ObjectiveCard] Sincronizando selectedKeyResultForOverview:', {
            id: updatedKR.id,
            start_month: updatedKR.start_month,
            end_month: updatedKR.end_month
          });
          setSelectedKeyResultForOverview(updatedKR);
        }
      }
    }
  }, [keyResults]);
  
  const handleAddResultadoChave = async (resultadoChaveData: Omit<KeyResult, 'id' | 'owner_id' | 'created_at' | 'updated_at'>) => {
    if (onAddResultadoChave) {
      await onAddResultadoChave(resultadoChaveData);
      setShowResultadoChaveForm(false);
    }
  };

  const handleEditKeyResult = (keyResult: KeyResult) => {
    setSelectedKeyResult(keyResult);
    setIsEditKeyResultModalOpen(true);
  };

  const handleOpenKeyResultDetails = (keyResult: KeyResult) => {
    setSelectedKeyResultForOverview(keyResult);
    setIsKROverviewModalOpen(true);
  };

  const handleUpdateKeyResult = async (keyResultData: Partial<KeyResult>) => {
    try {
      const { error } = await supabase
        .from('key_results')
        .update(keyResultData)
        .eq('id', selectedKeyResult?.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Resultado-chave atualizado com sucesso!",
      });

      if (onRefreshData) {
        onRefreshData();
      }
    } catch (error) {
      console.error('Error updating key result:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar resultado-chave. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsEditKeyResultModalOpen(false);
      setSelectedKeyResult(null);
    }
  };

  const handleUpdateObjective = async (data: Partial<StrategicObjective>) => {
    try {
      const { error } = await supabase
        .from('strategic_objectives')
        .update(data)
        .eq('id', objective.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Objetivo atualizado com sucesso!",
      });

      if (onRefreshData) {
        onRefreshData();
      }
    } catch (error) {
      console.error('Error updating objective:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar objetivo. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteObjective = async () => {
    try {
      const { error } = await supabase
        .from('strategic_objectives')
        .delete()
        .eq('id', objective.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Objetivo excluído com sucesso!",
      });

      setIsObjectiveDetailModalOpen(false);
      if (onRefreshData) {
        onRefreshData();
      }
    } catch (error) {
      console.error('Error deleting objective:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir objetivo. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const currentPlan = plans.find(p => p.id === objective.plan_id);

  if (compact) {
    return (
      <>
        <div 
          className="p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors cursor-pointer"
          onClick={() => setIsObjectiveDetailModalOpen(true)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">{objective.title}</h4>
              <div className="flex items-center gap-2 mt-1">
                {objective.responsible && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span className="truncate max-w-20">{objective.responsible}</span>
                  </div>
                )}
            </div>
          </div>
          <div className="text-right ml-2">
            <div className="text-xs font-medium">{progressPercentage.toFixed(1).replace('.', ',')}%</div>
          </div>
        </div>
      </div>

        <ObjectiveDetailModal
          objective={objective}
          open={isObjectiveDetailModalOpen}
          onClose={() => setIsObjectiveDetailModalOpen(false)}
          keyResults={keyResults}
          pillar={pillar}
          plan={currentPlan}
          onUpdate={handleUpdateObjective}
          onOpenKeyResultDetails={handleOpenKeyResultDetails}
          pillars={pillars}
          progressPercentage={progressPercentage}
          selectedPeriod={selectedPeriod}
          selectedMonth={selectedPeriod === 'monthly' ? selectedMonth : undefined}
          selectedYear={selectedPeriod === 'monthly' || selectedPeriod === 'yearly' ? selectedYear : undefined}
          selectedQuarter={selectedPeriod === 'quarterly' ? selectedQuarter : undefined}
          selectedQuarterYear={selectedPeriod === 'quarterly' ? selectedQuarterYear : undefined}
        />

        {/* KR Overview Modal (compact mode) */}
        <KROverviewModal
          keyResult={selectedKeyResultForOverview}
          pillar={pillar}
          open={isKROverviewModalOpen}
          onClose={() => {
            setIsKROverviewModalOpen(false);
            setSelectedKeyResultForOverview(null);
          }}
          onDelete={() => {
            toast({
              title: "Funcionalidade em desenvolvimento",
              description: "A exclusão de Resultados-Chave será implementada em breve.",
            });
          }}
          onSave={async () => {
            if (onRefreshData) await onRefreshData();
          }}
          objectives={[{ id: objective.id, title: objective.title }]}
          showDeleteButton={false}
          initialPeriod={selectedPeriod}
          initialMonth={selectedPeriod === 'monthly' ? selectedMonth : undefined}
          initialYear={selectedPeriod === 'monthly' || selectedPeriod === 'yearly' ? selectedYear : undefined}
          initialQuarter={selectedPeriod === 'quarterly' ? selectedQuarter : undefined}
          initialQuarterYear={selectedPeriod === 'quarterly' ? selectedQuarterYear : undefined}
          onPeriodChange={onPeriodChange}
          onMonthChange={onMonthChange}
          onYearChange={onYearChange}
        />
      </>
    );
  }

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">{objective.title}</h3>
            </div>
            <div className="flex items-center gap-2">
              {onAddResultadoChave && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setShowResultadoChaveForm(true)}
                  className="h-6 text-xs px-2"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  RC
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsObjectiveDetailModalOpen(true)}>
                    Ver Detalhes
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {objective.description && (
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
              {objective.description}
            </p>
          )}

          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground">Progresso</span>
              <span className="text-xs font-bold text-foreground">{progressPercentage}%</span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
              <div 
                className={`h-full transition-all duration-300 rounded-full ${getProgressColor(progressPercentage)}`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
            {objective.responsible && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{objective.responsible}</span>
              </div>
            )}
            {objective.deadline && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{new Date(objective.deadline).toLocaleDateString('pt-BR')}</span>
              </div>
            )}
          </div>

          {/* Resultados-Chave Section */}
          {!compact && onAddResultadoChave && (
            <div className="border-t pt-3 mt-3">
              <div className="flex justify-between items-center mb-3">
                <Label className="text-sm font-medium">Resultados-Chave</Label>
                <Badge variant="secondary">{keyResults.length}</Badge>
              </div>
              
              {keyResults.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum resultado-chave cadastrado</p>
                  <Button 
                    variant="link" 
                    size="sm"
                    onClick={() => setShowResultadoChaveForm(true)}
                    className="mt-1"
                  >
                    Adicionar o primeiro Resultado-Chave
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {keyResults.map((kr) => (
                    <ResultadoChaveMiniCard 
                      key={kr.id} 
                      resultadoChave={kr}
                      pillar={pillar}
                      onOpenDetails={handleOpenKeyResultDetails}
                      selectedPeriod={selectedPeriod}
                      selectedMonth={selectedMonth}
                      selectedYear={selectedYear}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal para Adicionar Resultado-Chave */}
      {showResultadoChaveForm && onAddResultadoChave && (
        <AddResultadoChaveModal
          objectiveId={objective.id}
          open={showResultadoChaveForm}
          onClose={() => setShowResultadoChaveForm(false)}
          onSave={handleAddResultadoChave}
        />
      )}

      {/* Modal para Editar Resultado-Chave */}
      {selectedKeyResult && (
        <EditKeyResultModal
          keyResult={selectedKeyResult}
          open={isEditKeyResultModalOpen}
          onClose={() => {
            setIsEditKeyResultModalOpen(false);
            setSelectedKeyResult(null);
          }}
          onSave={handleUpdateKeyResult}
        />
      )}

      {/* KR Overview Modal */}
      <KROverviewModal
        keyResult={selectedKeyResultForOverview}
        pillar={pillar}
        open={isKROverviewModalOpen}
        onClose={() => {
          setIsKROverviewModalOpen(false);
          setSelectedKeyResultForOverview(null);
        }}
        onDelete={() => {
          toast({
            title: "Funcionalidade em desenvolvimento",
            description: "A exclusão de Resultados-Chave será implementada em breve.",
          });
        }}
        onSave={async () => {
          if (onRefreshData) await onRefreshData();
        }}
        objectives={[{ id: objective.id, title: objective.title }]}
        showDeleteButton={false}
        initialPeriod={selectedPeriod}
        initialMonth={selectedPeriod === 'monthly' ? selectedMonth : undefined}
        initialYear={selectedPeriod === 'monthly' || selectedPeriod === 'yearly' ? selectedYear : undefined}
        initialQuarter={selectedPeriod === 'quarterly' ? selectedQuarter : undefined}
        initialQuarterYear={selectedPeriod === 'quarterly' ? selectedQuarterYear : undefined}
        onPeriodChange={onPeriodChange}
        onMonthChange={onMonthChange}
        onYearChange={onYearChange}
      />

      {/* Objective Detail Modal */}
      <ObjectiveDetailModal
        objective={objective}
        open={isObjectiveDetailModalOpen}
        onClose={() => setIsObjectiveDetailModalOpen(false)}
        keyResults={keyResults}
        pillar={pillar}
        plan={currentPlan}
        onUpdate={handleUpdateObjective}
        onDelete={handleDeleteObjective}
        onOpenKeyResultDetails={handleOpenKeyResultDetails}
        pillars={pillars}
        progressPercentage={progressPercentage}
        selectedPeriod={selectedPeriod}
        selectedMonth={selectedPeriod === 'monthly' ? selectedMonth : undefined}
        selectedYear={selectedPeriod === 'monthly' || selectedPeriod === 'yearly' ? selectedYear : undefined}
        selectedQuarter={selectedPeriod === 'quarterly' ? selectedQuarter : undefined}
        selectedQuarterYear={selectedPeriod === 'quarterly' ? selectedQuarterYear : undefined}
      />
    </>
  );
};
