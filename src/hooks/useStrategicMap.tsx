import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';
import { Company, StrategicPillar, StrategicObjective, KeyResult, StrategicProject } from '@/types/strategic-map';
import { toast } from '@/hooks/use-toast';

export const useStrategicMap = () => {
  const { user, company: authCompany } = useAuth();
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [strategicPlan, setStrategicPlan] = useState<any | null>(null);
  const [pillars, setPillars] = useState<StrategicPillar[]>([]);
  const [objectives, setObjectives] = useState<StrategicObjective[]>([]);
  const [keyResults, setKeyResults] = useState<KeyResult[]>([]);
  const [projects, setProjects] = useState<StrategicProject[]>([]);

  // Load company data from database based on authCompany
  const loadCompany = async () => {
    if (!user || !authCompany) {
      setCompany(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', authCompany.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading company:', error);
        return;
      }

      if (data) {
        setCompany(data);
        await loadStrategicPlan(data.id);
        await loadPillars(data.id);
        await loadProjects(data.id);
      } else {
        setCompany(null);
      }
    } catch (error) {
      console.error('Error loading company:', error);
    }
  };

  // Load strategic plan
  const loadStrategicPlan = async (companyId: string) => {
    try {
      const { data, error } = await supabase
        .from('strategic_plans')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading strategic plan:', error);
        return;
      }

      if (data) {
        setStrategicPlan(data);
      } else {
        setStrategicPlan(null);
      }
    } catch (error) {
      console.error('Error loading strategic plan:', error);
    }
  };

  // Create default strategic plan
  const createDefaultStrategicPlan = async (companyId: string) => {
    if (!user) return null;

    try {
      const currentYear = new Date().getFullYear();
      const nextYear = currentYear + 1;
      
      const planData = {
        name: `Plano Estratégico ${currentYear}-${nextYear}`,
        company_id: companyId,
        period_start: `${currentYear}-01-01`,
        period_end: `${nextYear}-12-31`,
        status: 'active',
        mission: company?.mission || '',
        vision: company?.vision || ''
      };

      const { data, error } = await supabase
        .from('strategic_plans')
        .insert([planData])
        .select()
        .single();

      if (error) {
        console.error('Error creating default strategic plan:', error);
        return null;
      }

      setStrategicPlan(data);
      return data;
    } catch (error) {
      console.error('Error creating default strategic plan:', error);
      return null;
    }
  };

  // Load pillars
  const loadPillars = async (companyId: string) => {
    try {
      const { data, error } = await supabase
        .from('strategic_pillars')
        .select('*')
        .eq('company_id', companyId)
        .order('order_index');

      if (error) {
        console.error('Error loading pillars:', error);
        return;
      }

      setPillars(data || []);
      
      // Load objectives for each pillar
      if (data && data.length > 0) {
        await loadObjectives(data.map(p => p.id));
      }
    } catch (error) {
      console.error('Error loading pillars:', error);
    }
  };

  // Load objectives
  const loadObjectives = async (pillarIds: string[]) => {
    try {
      const { data, error } = await supabase
        .from('strategic_objectives')
        .select('*')
        .in('pillar_id', pillarIds);

      if (error) {
        console.error('Error loading objectives:', error);
        return;
      }

      setObjectives(data || []);
      
      // Load key results for objectives
      if (data && data.length > 0) {
        await loadKeyResults(data.map(o => o.id));
      }
    } catch (error) {
      console.error('Error loading objectives:', error);
    }
  };

  // Load key results
  const loadKeyResults = async (objectiveIds: string[]) => {
    try {
      const { data, error } = await supabase
        .from('key_results')
        .select('*')
        .in('objective_id', objectiveIds);

      if (error) {
        console.error('Error loading key results:', error);
        return;
      }

      // Cast aggregation_type to the correct union type
      const processedData = (data || []).map(kr => ({
        ...kr,
        aggregation_type: (kr.aggregation_type as 'sum' | 'average' | 'max' | 'min') || 'sum',
        target_direction: (kr.target_direction as 'maximize' | 'minimize') || 'maximize'
      }));

      setKeyResults(processedData);
    } catch (error) {
      console.error('Error loading key results:', error);
    }
  };

  // Load projects
  const loadProjects = async (companyId?: string) => {
    if (!user || !companyId) return;

    try {
      const { data, error } = await supabase
        .from('strategic_projects')
        .select('*')
        .eq('company_id', companyId);

      if (error) {
        console.error('Error loading projects:', error);
        return;
      }

      setProjects(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  // Create company with default pillars
  const createCompany = async (companyData: Omit<Company, 'id' | 'owner_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('companies')
        .insert([{ ...companyData, owner_id: user.id }])
        .select()
        .single();

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao criar empresa",
          variant: "destructive",
        });
        return null;
      }

      setCompany(data);
      
      // Create default strategic pillars
      await createDefaultPillars(data.id);
      
      toast({
        title: "Sucesso",
        description: "Empresa criada com sucesso",
      });
      return data;
    } catch (error) {
      console.error('Error creating company:', error);
      return null;
    }
  };

  // Create default strategic pillars
  const createDefaultPillars = async (companyId: string) => {
    const defaultPillars = [
      { name: 'Econômico & Financeiro', color: '#22C55E', description: 'Pilar focado em resultados financeiros e econômicos' },
      { name: 'Mercado e Imagem', color: '#3B82F6', description: 'Pilar focado em mercado e imagem corporativa' },
      { name: 'Tecnologia e Processos', color: '#F59E0B', description: 'Pilar focado em tecnologia e processos internos' },
      { name: 'Inovação & Crescimento', color: '#8B5CF6', description: 'Pilar focado em inovação e crescimento sustentável' },
      { name: 'Pessoas & Cultura', color: '#EF4444', description: 'Pilar focado em pessoas e cultura organizacional' },
    ];

    try {
      const pillarsToInsert = defaultPillars.map((pillar, index) => ({
        ...pillar,
        company_id: companyId,
        order_index: index
      }));

      const { data, error } = await supabase
        .from('strategic_pillars')
        .insert(pillarsToInsert)
        .select();

      if (error) {
        console.error('Error creating default pillars:', error);
        return;
      }

      setPillars(data || []);
    } catch (error) {
      console.error('Error creating default pillars:', error);
    }
  };

  // Create pillar
  const createPillar = async (pillarData: Omit<StrategicPillar, 'id' | 'company_id' | 'order_index' | 'created_at' | 'updated_at'>) => {
    if (!company) return null;

    try {
      const { data, error } = await supabase
        .from('strategic_pillars')
        .insert([{ 
          ...pillarData, 
          company_id: company.id,
          order_index: pillars.length 
        }])
        .select()
        .single();

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao criar pilar estratégico",
          variant: "destructive",
        });
        return null;
      }

      setPillars(prev => [...prev, data]);
      toast({
        title: "Sucesso",
        description: "Pilar estratégico criado com sucesso",
      });
      return data;
    } catch (error) {
      console.error('Error creating pillar:', error);
      return null;
    }
  };

  // Calculate progress
  const calculateObjectiveProgress = (objectiveId: string): number => {
    const objectiveKRs = keyResults.filter(kr => kr.objective_id === objectiveId);
    if (objectiveKRs.length === 0) return 0;
    
    const totalProgress = objectiveKRs.reduce((sum, kr) => {
      const progress = kr.target_value > 0 ? (kr.current_value / kr.target_value) * 100 : 0;
      return sum + Math.min(progress, 100);
    }, 0);
    
    return Math.round(totalProgress / objectiveKRs.length);
  };

  const calculatePillarProgress = (pillarId: string): number => {
    const pillarObjectives = objectives.filter(obj => obj.pillar_id === pillarId);
    if (pillarObjectives.length === 0) return 0;
    
    const totalProgress = pillarObjectives.reduce((sum, obj) => {
      return sum + calculateObjectiveProgress(obj.id);
    }, 0);
    
    return Math.round(totalProgress / pillarObjectives.length);
  };

  // Initialize data
  useEffect(() => {
    const initialize = async () => {
      // Only show loading if we don't have company data yet
      if (!company) {
        setLoading(true);
      }
      await loadCompany();
      setLoading(false);
    };

    if (user?.id) {
      initialize();
    }
  }, [user?.id]);

  // Soft refresh - reload data in background without global loading state
  const softRefresh = async () => {
    if (!company?.id) return;
    
    console.log('🔄 [StrategicMap] Soft refresh started - background data reload');
    try {
      // Reload pillars (which cascades to objectives and key results)
      await loadPillars(company.id);
      // Reload projects if needed
      await loadProjects(company.id);
      console.log('✅ [StrategicMap] Soft refresh completed successfully');
    } catch (error) {
      console.error('❌ [StrategicMap] Error during soft refresh:', error);
    }
  };

  // React to company changes from auth context
  useEffect(() => {
    const reloadCompany = async () => {
      // Only reload if company actually changed (different ID)
      if (user?.id && authCompany && company?.id !== authCompany.id) {
        // Don't show loading spinner for company changes - let components handle it gracefully
        await loadCompany();
      }
    };

    reloadCompany();
  }, [authCompany?.id, company?.id, user?.id]);

  // Create objective
  const createObjective = async (objectiveData: Omit<StrategicObjective, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;

    // Ensure pillar_id is provided
    if (!objectiveData.pillar_id) {
      toast({
        title: "Erro",
        description: "Pilar estratégico é obrigatório para criar objetivos",
        variant: "destructive",
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('strategic_objectives')
        .insert([{ ...objectiveData, owner_id: user.id }])
        .select()
        .single();

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao criar objetivo estratégico",
          variant: "destructive",
        });
        return null;
      }

      setObjectives(prev => [...prev, data]);
      toast({
        title: "Sucesso",
        description: "Objetivo estratégico criado com sucesso",
      });
      return data;
    } catch (error) {
      console.error('Error creating objective:', error);
      return null;
    }
  };

  // Update company
  const updateCompany = async (companyId: string, updates: Partial<Company>) => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .update(updates)
        .eq('id', companyId)
        .select()
        .single();

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao atualizar empresa",
          variant: "destructive",
        });
        return null;
      }

      setCompany(data);
      toast({
        title: "Sucesso",
        description: "Empresa atualizada com sucesso",
      });
      return data;
    } catch (error) {
      console.error('Error updating company:', error);
      return null;
    }
  };

  // Update pillar
  const updatePillar = async (id: string, updates: Partial<StrategicPillar>) => {
    try {
      const { data, error } = await supabase
        .from('strategic_pillars')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao atualizar pilar estratégico",
          variant: "destructive",
        });
        return null;
      }

      setPillars(prev => prev.map(pillar => 
        pillar.id === id ? data : pillar
      ));
      
      toast({
        title: "Sucesso",
        description: "Pilar estratégico atualizado com sucesso",
      });
      return data;
    } catch (error) {
      console.error('Error updating pillar:', error);
      return null;
    }
  };

  // Delete pillar
  const deletePillar = async (id: string) => {
    // Check if pillar has objectives
    const pillarObjectives = objectives.filter(obj => obj.pillar_id === id);
    if (pillarObjectives.length > 0) {
      toast({
        title: "Erro",
        description: "Não é possível excluir pilar com objetivos vinculados",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('strategic_pillars')
        .delete()
        .eq('id', id);

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao excluir pilar estratégico",
          variant: "destructive",
        });
        return false;
      }

      setPillars(prev => prev.filter(pillar => pillar.id !== id));
      toast({
        title: "Sucesso",
        description: "Pilar estratégico excluído com sucesso",
      });
      return true;
    } catch (error) {
      console.error('Error deleting pillar:', error);
      return false;
    }
  };

  // Create resultado-chave
  const createKeyResult = async (resultadoChaveData: Omit<KeyResult, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('key_results')
        .insert([{ ...resultadoChaveData, owner_id: user.id }])
        .select()
        .single();

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao criar resultado-chave",
          variant: "destructive",
        });
        return null;
      }

      // Cast aggregation_type to the correct union type
      const processedData = {
        ...data,
        aggregation_type: (data.aggregation_type as 'sum' | 'average' | 'max' | 'min') || 'sum',
        target_direction: (data.target_direction as 'maximize' | 'minimize') || 'maximize'
      };

      setKeyResults(prev => [...prev, processedData]);
      toast({
        title: "Sucesso",
        description: "Resultado-chave criado com sucesso",
      });
      return data;
    } catch (error) {
      console.error('Error creating key result:', error);
      return null;
    }
  };

  // Update resultado-chave
  const updateKeyResult = async (keyResultId: string, updates: Partial<KeyResult>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('key_results')
        .update(updates)
        .eq('id', keyResultId)
        .select()
        .single();

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao atualizar resultado-chave",
          variant: "destructive",
        });
        return null;
      }

      // Cast aggregation_type to the correct union type
      const processedData = {
        ...data,
        aggregation_type: (data.aggregation_type as 'sum' | 'average' | 'max' | 'min') || 'sum',
        target_direction: (data.target_direction as 'maximize' | 'minimize') || 'maximize'
      };

      setKeyResults(prev => prev.map(kr => kr.id === keyResultId ? processedData : kr));
      toast({
        title: "Sucesso",
        description: "Resultado-chave atualizado com sucesso",
      });
      return data;
    } catch (error) {
      console.error('Error updating key result:', error);
      return null;
    }
  };

  return {
    loading,
    company,
    strategicPlan,
    pillars,
    objectives,
    keyResults,
    projects,
    createCompany,
    updateCompany,
    createPillar,
    updatePillar,
    deletePillar,
    createObjective,
    createKeyResult,
    updateKeyResult,
    calculateObjectiveProgress,
    calculatePillarProgress,
    refreshData: loadCompany,
    softRefresh
  };
};