import { useState, useEffect } from 'react';
import { StrategicObjective, KeyResult } from '@/types/strategic-map';
import { getPerformanceColor, getPerformanceStyles } from '@/hooks/useRumoCalculations';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Target } from 'lucide-react';
import { ObjectiveDetailModal } from '@/components/objectives/ObjectiveDetailModal';
import { KROverviewModal } from '@/components/strategic-map/KROverviewModal';
import { MonthlyPerformanceIndicators } from '@/components/strategic-map/MonthlyPerformanceIndicators';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';
import { useToast } from '@/hooks/use-toast';
import { usePeriodFilter } from '@/hooks/usePeriodFilter';

interface RumoObjectiveBlockProps {
  objective: StrategicObjective;
  progress: number;
  keyResults: KeyResult[];
  krProgress: Map<string, number>;
}

export const RumoObjectiveBlock = ({ 
  objective, 
  progress, 
  keyResults,
  krProgress
}: RumoObjectiveBlockProps) => {
  // Consumir período globalmente do contexto
  const {
    periodType: selectedPeriod,
    selectedMonth,
    selectedYear,
    selectedMonthYear,
    selectedQuarter,
    selectedQuarterYear,
    selectedSemester,
    selectedSemesterYear,
    selectedBimonth,
    selectedBimonthYear
  } = usePeriodFilter();

  const performance = getPerformanceColor(progress);
  const styles = getPerformanceStyles(performance);
  const { company } = useAuth();
  const { toast } = useToast();

  const objectiveKRs = keyResults
    .filter(kr => kr.objective_id === objective.id)
    .sort((a, b) => (b.weight || 1) - (a.weight || 1));

  // Modal states
  const [isObjectiveDetailModalOpen, setIsObjectiveDetailModalOpen] = useState(false);
  const [selectedKeyResultForOverview, setSelectedKeyResultForOverview] = useState<KeyResult | null>(null);
  const [isKROverviewModalOpen, setIsKROverviewModalOpen] = useState(false);
  const [pillars, setPillars] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [pillar, setPillar] = useState<any>(null);

  // Fetch pillars, plans, and current pillar when modal opens
  useEffect(() => {
    const fetchData = async () => {
      if (!company?.id || !isObjectiveDetailModalOpen) return;
      
      const [pillarsResponse, plansResponse] = await Promise.all([
        supabase.from('strategic_pillars').select('*').eq('company_id', company.id),
        supabase.from('strategic_plans').select('*').eq('company_id', company.id),
      ]);

      if (pillarsResponse.data) {
        setPillars(pillarsResponse.data);
        const currentPillar = pillarsResponse.data.find(p => p.id === objective.pillar_id);
        setPillar(currentPillar || null);
      }
      if (plansResponse.data) setPlans(plansResponse.data);
    };
    fetchData();
  }, [company?.id, objective.pillar_id, isObjectiveDetailModalOpen]);

  // Sincronizar selectedKeyResultForOverview com a lista atualizada
  useEffect(() => {
    if (selectedKeyResultForOverview && keyResults.length > 0) {
      const updatedKR = keyResults.find(kr => kr.id === selectedKeyResultForOverview.id);
      if (updatedKR) {
        if (JSON.stringify(updatedKR) !== JSON.stringify(selectedKeyResultForOverview)) {
          console.log('[RumoObjectiveBlock] Sincronizando selectedKeyResultForOverview:', {
            id: updatedKR.id,
            start_month: updatedKR.start_month,
            end_month: updatedKR.end_month
          });
          setSelectedKeyResultForOverview(updatedKR);
        }
      }
    }
  }, [keyResults]);

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

      // Trigger a page refresh to update the data
      window.location.reload();
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
      // Cascade: delete all KRs of this objective first
      const objectiveKRs = keyResults.filter(kr => kr.objective_id === objective.id);
      if (objectiveKRs.length > 0) {
        const krIds = objectiveKRs.map(kr => kr.id);
        await supabase.from('kr_fca').delete().in('key_result_id', krIds);
        await supabase.from('kr_initiatives').delete().in('key_result_id', krIds);
        await supabase.from('key_result_values').delete().in('key_result_id', krIds);
        await supabase.from('kr_monthly_actions').delete().in('key_result_id', krIds);
        const { error: krError } = await supabase.from('key_results').delete().in('id', krIds);
        if (krError) throw krError;
      }

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
      window.location.reload();
    } catch (error) {
      console.error('Error deleting objective:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir objetivo. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleOpenKeyResultDetails = (keyResult: KeyResult) => {
    setSelectedKeyResultForOverview(keyResult);
    setIsKROverviewModalOpen(true);
  };

  // Create Key Result inline
  const handleCreateKeyResult = async (krData: Omit<KeyResult, 'id' | 'owner_id' | 'created_at' | 'updated_at'>) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('key_results')
        .insert([{ ...krData, owner_id: userData.user.id }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Resultado-chave criado com sucesso!",
      });

      // Refresh page to show new KR
      window.location.reload();
    } catch (error) {
      console.error('Error creating key result:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar resultado-chave. Tente novamente.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const currentPlan = plans.find(p => p.id === objective.plan_id);

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              onClick={() => setIsObjectiveDetailModalOpen(true)}
              className={`
                ${styles}
                p-4 rounded-lg border-2 shadow-md
                transition-all duration-300 hover:scale-105 hover:shadow-lg
                cursor-pointer min-h-[80px] flex items-center justify-between
                animate-fade-in
              `}
            >
            <div className="flex-1 pr-3">
              <div className="flex items-start gap-2">
                <Target className="w-4 h-4 mt-1 flex-shrink-0" />
                <h4 className="font-semibold text-sm line-clamp-2">
                  {objective.title}
                </h4>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-2xl font-bold">
                {progress.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
              </p>
              <p className="text-xs opacity-80">
                {objectiveKRs.length} KR(s)
              </p>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-md">
          <div className="space-y-2">
            <p className="font-semibold">{objective.title}</p>
            {objective.description && (
              <p className="text-xs text-muted-foreground">{objective.description}</p>
            )}
            
            {objectiveKRs.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold mb-2">Resultados-Chave:</p>
                <div className="space-y-1">
                  {objectiveKRs.map(kr => {
                    const krProg = krProgress.get(kr.id) || 0;
                    const krPerf = getPerformanceColor(krProg);
                    
                    return (
                      <div key={kr.id} className="text-xs space-y-1">
                        <div className="flex justify-between items-center gap-2">
                          <span className="flex-1 line-clamp-1">{kr.title}</span>
                          <span className={`font-bold ${
                            krPerf === 'excellent' ? 'text-blue-500' :
                            krPerf === 'success' ? 'text-green-500' :
                            krPerf === 'warning' ? 'text-yellow-500' :
                            'text-red-500'
                          }`}>
                            {krProg.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                          </span>
                        </div>
                        <MonthlyPerformanceIndicators
                          monthlyTargets={kr.monthly_targets}
                          monthlyActual={kr.monthly_actual}
                          targetDirection={kr.target_direction || 'maximize'}
                          frequency={kr.frequency || 'monthly'}
                          size="sm"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Objective Detail Modal */}
      <ObjectiveDetailModal
        objective={objective}
        open={isObjectiveDetailModalOpen}
        onClose={() => setIsObjectiveDetailModalOpen(false)}
        keyResults={objectiveKRs}
        pillar={pillar}
        plan={currentPlan}
        onUpdate={handleUpdateObjective}
        onDelete={handleDeleteObjective}
        onOpenKeyResultDetails={handleOpenKeyResultDetails}
        pillars={pillars}
        progressPercentage={progress}
        onCreateKeyResult={handleCreateKeyResult}
      />

      {/* KR Overview Modal */}
      <KROverviewModal
        keyResult={selectedKeyResultForOverview}
        pillar={pillar}
        open={isKROverviewModalOpen}
        onClose={() => {
          setIsKROverviewModalOpen(false);
          setSelectedKeyResultForOverview(null);
        }}
        onDelete={async () => {
          if (!selectedKeyResultForOverview) return;
          try {
            const krId = selectedKeyResultForOverview.id;
            // Cascade: delete KR related data first
            await supabase.from('kr_fca').delete().eq('key_result_id', krId);
            await supabase.from('kr_initiatives').delete().eq('key_result_id', krId);
            await supabase.from('key_result_values').delete().eq('key_result_id', krId);
            await supabase.from('kr_monthly_actions').delete().eq('key_result_id', krId);
            const { error } = await supabase
              .from('key_results')
              .delete()
              .eq('id', krId);
            if (error) throw error;
            toast({ title: "Sucesso", description: "Resultado-chave excluído com sucesso!" });
            setIsKROverviewModalOpen(false);
            setSelectedKeyResultForOverview(null);
            window.location.reload();
          } catch (error) {
            console.error('Error deleting key result:', error);
            toast({ title: "Erro", description: "Erro ao excluir resultado-chave.", variant: "destructive" });
          }
        }}
        onSave={async () => {
          window.location.reload();
        }}
        objectives={[{ id: objective.id, title: objective.title }]}
        showDeleteButton={true}
        initialPeriod={selectedPeriod}
        initialMonth={selectedMonth}
        initialYear={selectedYear}
        initialQuarter={selectedQuarter}
        initialQuarterYear={selectedQuarterYear}
      />
    </>
  );
};
