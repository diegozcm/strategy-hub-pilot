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

  // Create company
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

  return {
    loading,
    company,
    pillars,
    objectives,
    keyResults,
    projects,
    createCompany,
    createPillar,
    calculateObjectiveProgress,
    calculatePillarProgress,
    refreshData: loadCompany
  };
};