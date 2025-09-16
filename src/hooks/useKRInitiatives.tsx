import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './useMultiTenant';
import { KRInitiative } from '@/types/strategic-map';

export const useKRInitiatives = (keyResultId?: string) => {
  const { user, company } = useAuth();
  const { toast } = useToast();
  const [initiatives, setInitiatives] = useState<KRInitiative[]>([]);
  const [loading, setLoading] = useState(false);

  const loadInitiatives = async () => {
    if (!keyResultId || !company?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('kr_initiatives')
        .select('*')
        .eq('key_result_id', keyResultId)
        .eq('company_id', company.id)
        .order('start_date', { ascending: true });

      if (error) throw error;
      
      setInitiatives(data as KRInitiative[] || []);
    } catch (error: any) {
      console.error('Error loading initiatives:', error);
      toast({
        title: "Erro ao carregar iniciativas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createInitiative = async (initiativeData: Omit<KRInitiative, 'id' | 'created_by' | 'created_at' | 'updated_at'>) => {
    if (!user?.id || !company?.id) {
      toast({
        title: "Erro",
        description: "Usuário ou empresa não identificados",
        variant: "destructive",
      });
      return null;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('kr_initiatives')
        .insert([{
          ...initiativeData,
          created_by: user.id,
          company_id: company.id
        }])
        .select()
        .single();

      if (error) throw error;

      setInitiatives(prev => [...prev, data as KRInitiative]);
      
      toast({
        title: "Iniciativa criada",
        description: "A iniciativa foi criada com sucesso",
      });

      return data;
    } catch (error: any) {
      console.error('Error creating initiative:', error);
      toast({
        title: "Erro ao criar iniciativa",
        description: error.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateInitiative = async (initiativeId: string, updates: Partial<KRInitiative>) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('kr_initiatives')
        .update(updates)
        .eq('id', initiativeId)
        .select()
        .single();

      if (error) throw error;

      setInitiatives(prev => prev.map(init => 
        init.id === initiativeId ? { ...init, ...(data as KRInitiative) } : init
      ));

      toast({
        title: "Iniciativa atualizada",
        description: "A iniciativa foi atualizada com sucesso",
      });

      return data;
    } catch (error: any) {
      console.error('Error updating initiative:', error);
      toast({
        title: "Erro ao atualizar iniciativa",
        description: error.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteInitiative = async (initiativeId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('kr_initiatives')
        .delete()
        .eq('id', initiativeId);

      if (error) throw error;

      setInitiatives(prev => prev.filter(init => init.id !== initiativeId));

      toast({
        title: "Iniciativa excluída",
        description: "A iniciativa foi excluída com sucesso",
      });

      return true;
    } catch (error: any) {
      console.error('Error deleting initiative:', error);
      toast({
        title: "Erro ao excluir iniciativa",
        description: error.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getInitiativesByStatus = (status: KRInitiative['status']) => {
    return initiatives.filter(init => init.status === status);
  };

  const getActiveInitiatives = () => {
    return initiatives.filter(init => 
      init.status === 'planned' || init.status === 'in_progress'
    );
  };

  const getInitiativeStats = () => {
    const total = initiatives.length;
    const planned = initiatives.filter(init => init.status === 'planned').length;
    const inProgress = initiatives.filter(init => init.status === 'in_progress').length;
    const completed = initiatives.filter(init => init.status === 'completed').length;
    const cancelled = initiatives.filter(init => init.status === 'cancelled').length;
    const onHold = initiatives.filter(init => init.status === 'on_hold').length;

    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    return {
      total,
      planned,
      inProgress,
      completed,
      cancelled,
      onHold,
      completionRate: Math.round(completionRate * 100) / 100
    };
  };

  useEffect(() => {
    if (keyResultId && company?.id) {
      loadInitiatives();
    }
  }, [keyResultId, company?.id]);

  return {
    initiatives,
    loading,
    loadInitiatives,
    createInitiative,
    updateInitiative,
    deleteInitiative,
    getInitiativesByStatus,
    getActiveInitiatives,
    getInitiativeStats
  };
};