import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';
import { useToast } from '@/hooks/use-toast';
import { KeyResult } from '@/types/strategic-map';

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

interface StrategicObjective {
  id: string;
  title: string;
  description: string;
  status: string;
  progress: number;
  weight: number;
  target_date: string;
  plan_id: string;
  pillar_id: string;
  owner_id: string;
  created_at: string;
}

interface StrategicPillar {
  id: string;
  name: string;
  description: string;
  color: string;
  company_id: string;
}

export const useObjectivesData = () => {
  const { user, company: authCompany } = useAuth();
  const { toast } = useToast();
  
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
    if (!user || !authCompany) {
      setLoading(false);
      return;
    }

    // Only show loading on initial load or force reload
    if (forceReload || objectives.length === 0) {
      setLoading(true);
    }
    
    setError(null);

    try {
      console.log('🔄 Loading objectives data for company:', authCompany.id);

      // Load all data in parallel
      const [plansResponse, pillarsResponse] = await Promise.all([
        supabase
          .from('strategic_plans')
          .select('*')
          .eq('company_id', authCompany.id)
          .order('created_at', { ascending: false }),
        
        supabase
          .from('strategic_pillars')
          .select('*')
          .eq('company_id', authCompany.id)
          .order('created_at', { ascending: true })
      ]);

      if (plansResponse.error) throw plansResponse.error;
      if (pillarsResponse.error) throw pillarsResponse.error;

      const loadedPlans = plansResponse.data || [];
      const loadedPillars = pillarsResponse.data || [];

      setPlans(loadedPlans);
      setPillars(loadedPillars);

      // Load objectives if we have plans
      if (loadedPlans.length > 0) {
        const planIds = loadedPlans.map(p => p.id);
        
        const objectivesResponse = await supabase
          .from('strategic_objectives')
          .select('*')
          .in('plan_id', planIds)
          .order('created_at', { ascending: false });

        if (objectivesResponse.error) throw objectivesResponse.error;
        
        const loadedObjectives = objectivesResponse.data || [];
        setObjectives(loadedObjectives);

        // Load key results if we have objectives
        if (loadedObjectives.length > 0) {
          const objectiveIds = loadedObjectives.map(o => o.id);
          
          const keyResultsResponse = await supabase
            .from('key_results')
            .select('*')
            .in('objective_id', objectiveIds)
            .order('created_at', { ascending: false });

          if (keyResultsResponse.error) throw keyResultsResponse.error;
          setKeyResults((keyResultsResponse.data || []) as unknown as KeyResult[]);
        } else {
          setKeyResults([]);
        }
      } else {
        setObjectives([]);
        setKeyResults([]);
      }

      console.log('✅ Data loaded successfully');
    } catch (error) {
      handleError(error, 'carregar dados');
    } finally {
      setLoading(false);
    }
  }, [user, authCompany, handleError, objectives.length]);

  const refreshData = useCallback(() => {
    console.log('🔄 Refreshing data...');
    return loadData(true);
  }, [loadData]);

  // Auto-reload data when user or company changes
  useEffect(() => {
    loadData();
  }, [user, authCompany]);

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
    loading,
    error,
    
    // Setters for optimistic updates
    setObjectives,
    setPlans,
    setPillars,
    setKeyResults,
    
    // Actions
    loadData,
    refreshData,
    invalidateAndReload,
    handleError,
    
    // Clear error state
    clearError: () => setError(null)
  };
};