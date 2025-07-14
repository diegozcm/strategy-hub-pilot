import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Company, StrategicPillar, StrategicObjective, KeyResult, StrategicProject } from '@/types/strategic-map';
import { toast } from '@/hooks/use-toast';

export const useStrategicMap = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [pillars, setPillars] = useState<StrategicPillar[]>([]);
  const [objectives, setObjectives] = useState<StrategicObjective[]>([]);
  const [keyResults, setKeyResults] = useState<KeyResult[]>([]);
  const [projects, setProjects] = useState<StrategicProject[]>([]);

  // Load company data
  const loadCompany = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading company:', error);
        return;
      }

      if (data) {
        setCompany(data);
        await loadPillars(data.id);
      }
    } catch (error) {
      console.error('Error loading company:', error);
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

      setKeyResults(data || []);
    } catch (error) {
      console.error('Error loading key results:', error);
    }
  };

  // Load projects
  const loadProjects = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('strategic_projects')
        .select('*')
        .eq('owner_id', user.id);

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
      setLoading(true);
      await Promise.all([
        loadCompany(),
        loadProjects()
      ]);
      setLoading(false);
    };

    if (user) {
      initialize();
    }
  }, [user]);

  // Create objective
  const createObjective = async (objectiveData: Omit<StrategicObjective, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;

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

  // Create key result
  const createKeyResult = async (krData: Omit<KeyResult, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('key_results')
        .insert([{ ...krData, owner_id: user.id }])
        .select()
        .single();

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao criar resultado chave",
          variant: "destructive",
        });
        return null;
      }

      setKeyResults(prev => [...prev, data]);
      toast({
        title: "Sucesso",
        description: "Resultado chave criado com sucesso",
      });
      return data;
    } catch (error) {
      console.error('Error creating key result:', error);
      return null;
    }
  };

  return {
    loading,
    company,
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
    calculateObjectiveProgress,
    calculatePillarProgress,
    refreshData: loadCompany
  };
};