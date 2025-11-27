import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';
import { useToast } from '@/hooks/use-toast';
import { KeyResult, StrategicObjective, StrategicPillar } from '@/types/strategic-map';
import { useHealthMonitor } from './useHealthMonitor';
import { useOperationState } from './useOperationState';
import { useActivePlan } from './useActivePlan';

interface StrategicPlan {
  id: string;
  name: string;
  status: string;
  period_start: string;
  period_end: string;
  vision?: string;
  mission?: string;
  company_id: string;
  created_at: string;
}

export const useObjectivesData = () => {
  const { user, company: authCompany } = useAuth();
  const { activePlan, loading: planLoading, hasActivePlan } = useActivePlan();
  const { toast } = useToast();
  const { logPerformance, logRenderCycle } = useHealthMonitor();
  const { 
    startOperation, 
    completeOperation, 
    failOperation, 
    getOperationStatus,
    isAnyLoading 
  } = useOperationState();
  
  const [objectives, setObjectives] = useState<StrategicObjective[]>([]);
  const [plans, setPlans] = useState<StrategicPlan[]>([]);
  const [pillars, setPillars] = useState<StrategicPillar[]>([]);
  const [keyResults, setKeyResults] = useState<KeyResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((error: any, context: string) => {
    console.error(`Error in ${context}:`, error);
    
    let errorMessage = `Erro em ${context}. Tente novamente.`;
    
    if (error instanceof Error) {
      if (error.message.includes('weight')) {
        errorMessage = "O peso deve ser um valor entre 1 e 100.";
      } else if (error.message.includes('strategic_objectives_weight_check')) {
        errorMessage = "O peso do objetivo deve ser um valor válido entre 1 e 100.";
      } else if (error.message.includes('status')) {
        errorMessage = "Status inválido. Selecione um status válido.";
      } else if (error.message.includes('PGRST301')) {
        errorMessage = "Você não tem permissão para realizar esta operação.";
      } else if (error.message.includes('connection')) {
        errorMessage = "Problema de conectividade. Verifique sua internet e tente novamente.";
      }
    }
    
    setError(errorMessage);
    toast({
      title: "Erro",
      description: errorMessage,
      variant: "destructive",
    });

    return errorMessage;
  }, [toast]);

  const loadData = useCallback(async (forceReload = false) => {
    const operationId = `loadData-${Date.now()}`;
    const startTime = Date.now();
    
    if (!user?.id || !authCompany?.id) {
      setLoading(false);
      logRenderCycle('ObjectivesData', 'mount');
      return;
    }

    // Se não houver plano ativo, limpar dados
    if (!planLoading && !hasActivePlan) {
      setObjectives([]);
      setKeyResults([]);
      setPillars([]);
      setPlans([]);
      setLoading(false);
      return;
    }

    startOperation(operationId, 'Carregando dados dos objetivos');

    // Only show loading on initial load or force reload
    if (forceReload || objectives.length === 0) {
      setLoading(true);
    }
    
    setError(null);
    logRenderCycle('ObjectivesData', 'update');

    try {
      console.log('🔄 Loading objectives data for company:', authCompany?.id);

      // Load all data in parallel with performance tracking - FILTER BY ACTIVE PLAN
      const [plansResponse, pillarsResponse] = await Promise.all([
        supabase
          .from('strategic_plans')
          .select('*')
          .eq('company_id', authCompany?.id)
          .eq('status', 'active'),
        
        supabase
          .from('strategic_pillars')
          .select('*')
          .eq('company_id', authCompany?.id)
          .order('created_at', { ascending: true })
      ]);

      logPerformance('Load plans and pillars', startTime);

      if (plansResponse.error) throw plansResponse.error;
      if (pillarsResponse.error) throw pillarsResponse.error;

      const loadedPlans = plansResponse.data || [];
      const loadedPillars = pillarsResponse.data || [];

      console.log(`📊 Loaded ${loadedPlans.length} plans and ${loadedPillars.length} pillars`);

      setPlans(loadedPlans);
      setPillars(loadedPillars);

      // Load objectives if we have active plan
      if (activePlan && loadedPlans.length > 0) {
        const objectivesStartTime = Date.now();
        
        const objectivesResponse = await supabase
          .from('strategic_objectives')
          .select('*')
          .eq('plan_id', activePlan.id)
          .order('created_at', { ascending: false });

        logPerformance('Load objectives', objectivesStartTime);

        if (objectivesResponse.error) throw objectivesResponse.error;
        
        const loadedObjectives = objectivesResponse.data || [];
        console.log(`🎯 Loaded ${loadedObjectives.length} objectives`);
        setObjectives(loadedObjectives);

        // Load key results if we have objectives
        if (loadedObjectives.length > 0) {
          const objectiveIds = loadedObjectives.map(o => o.id);
          const keyResultsStartTime = Date.now();
          
          const keyResultsResponse = await supabase
            .from('key_results')
            .select('*')
            .in('objective_id', objectiveIds)
            .order('created_at', { ascending: false });

          logPerformance('Load key results', keyResultsStartTime);

          if (keyResultsResponse.error) throw keyResultsResponse.error;
          
          const loadedKeyResults = (keyResultsResponse.data || []) as unknown as KeyResult[];
          console.log(`🔑 Loaded ${loadedKeyResults.length} key results`);
          setKeyResults(loadedKeyResults);
        } else {
          setKeyResults([]);
        }
      } else {
        console.log('📝 No plans found, clearing objectives and key results');
        setObjectives([]);
        setKeyResults([]);
      }

      logPerformance('Complete data load', startTime);
      completeOperation(operationId, `Carregados: ${loadedPlans.length} planos, ${loadedPillars.length} pilares, ${objectives.length} objetivos`);
      console.log('✅ Data loaded successfully');
    } catch (error) {
      failOperation(operationId, error, 'carregar dados dos objetivos');
      handleError(error, 'carregar dados');
    } finally {
      setLoading(false);
    }
  }, [
    user?.id, authCompany?.id, activePlan, hasActivePlan, planLoading,
    handleError, objectives.length,
    startOperation, completeOperation, failOperation,
    logPerformance, logRenderCycle
  ]);

  const refreshData = useCallback(() => {
    console.log('🔄 Refreshing data...');
    return loadData(true);
  }, [loadData]);

  const softReload = useCallback(() => {
    console.log('🔄 Soft reloading data in background...');
    return loadData(false);
  }, [loadData]);

  // Auto-reload data when user or company changes
  useEffect(() => {
    if (!planLoading) {
      loadData();
    }
  }, [user?.id, authCompany?.id, activePlan?.id, planLoading]);

  // Invalidate and reload data after mutations
  const invalidateAndReload = useCallback(async () => {
    console.log('🔄 Invalidating cache and reloading...');
    await refreshData();
  }, [refreshData]);

  return {
    // Data
    objectives,
    plans,
    pillars,
    keyResults,
    loading: loading || isAnyLoading() || planLoading,
    error,
    
    // Active plan info
    activePlan,
    hasActivePlan,
    
    // Setters for optimistic updates
    setObjectives,
    setPlans,
    setPillars,
    setKeyResults,
    
    // Actions
    loadData,
    refreshData,
    softReload,
    invalidateAndReload,
    handleError,
    
    // Clear error state
    clearError: () => setError(null),
    
    // Operation tracking
    isOperationLoading: (operationId: string) => getOperationStatus(operationId).loading,
    getOperationError: (operationId: string) => getOperationStatus(operationId).error
  };
};