import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { KRFCA, KRMonthlyAction } from '@/types/strategic-map';
import { useToast } from '@/hooks/use-toast';

export const useKRFCA = (keyResultId?: string) => {
  const [fcas, setFcas] = useState<KRFCA[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFCA, setSelectedFCA] = useState<KRFCA | null>(null);
  const { toast } = useToast();

  // Carregar FCAs do KR
  const loadFCAs = async () => {
    if (!keyResultId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('kr_fca')
        .select('*')
        .eq('key_result_id', keyResultId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const typedFCAs = (data || []).map(item => ({
        ...item,
        status: item.status as 'active' | 'resolved' | 'cancelled',
        priority: item.priority as 'low' | 'medium' | 'high',
      })) as KRFCA[];
      
      setFcas(typedFCAs);
    } catch (error) {
      console.error('Error loading FCAs:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar FCAs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Buscar FCA com suas ações relacionadas
  const getFCAWithActions = async (fcaId: string): Promise<KRFCA | null> => {
    try {
      const { data: fcaData, error: fcaError } = await supabase
        .from('kr_fca')
        .select('*')
        .eq('id', fcaId)
        .single();

      if (fcaError) throw fcaError;

      const { data: actionsData, error: actionsError } = await supabase
        .from('kr_monthly_actions')
        .select('*')
        .eq('fca_id', fcaId)
        .order('month_year', { ascending: false });

      if (actionsError) throw actionsError;

      const fca: KRFCA = {
        ...fcaData,
        status: fcaData.status as 'active' | 'resolved' | 'cancelled',
        priority: fcaData.priority as 'low' | 'medium' | 'high',
        actions: (actionsData || []).map(item => ({
          ...item,
          status: item.status as 'planned' | 'in_progress' | 'completed' | 'cancelled',
          priority: item.priority as 'low' | 'medium' | 'high',
        })) as KRMonthlyAction[]
      };

      return fca;
    } catch (error) {
      console.error('Error loading FCA with actions:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar FCA com ações",
        variant: "destructive",
      });
      return null;
    }
  };

  // Criar novo FCA
  const createFCA = async (fcaData: Omit<KRFCA, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'actions'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('kr_fca')
        .insert([{
          ...fcaData,
          created_by: user.id,
        }])
        .select()
        .single();

      if (error) throw error;

      const newFCA: KRFCA = {
        ...data,
        status: data.status as 'active' | 'resolved' | 'cancelled',
        priority: data.priority as 'low' | 'medium' | 'high',
      };

      setFcas(prev => [newFCA, ...prev]);
      toast({
        title: "Sucesso",
        description: "FCA criado com sucesso",
      });

      return newFCA;
    } catch (error) {
      console.error('Error creating FCA:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar FCA",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Atualizar FCA
  const updateFCA = async (fcaId: string, updates: Partial<KRFCA>) => {
    try {
      const { data, error } = await supabase
        .from('kr_fca')
        .update(updates)
        .eq('id', fcaId)
        .select()
        .single();

      if (error) throw error;

      const updatedFCA: KRFCA = {
        ...data,
        status: data.status as 'active' | 'resolved' | 'cancelled',
        priority: data.priority as 'low' | 'medium' | 'high',
      };

      setFcas(prev => prev.map(fca => 
        fca.id === fcaId ? updatedFCA : fca
      ));

      toast({
        title: "Sucesso",
        description: "FCA atualizado com sucesso",
      });

      return updatedFCA;
    } catch (error) {
      console.error('Error updating FCA:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar FCA",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Deletar FCA
  const deleteFCA = async (fcaId: string) => {
    try {
      // First, remove fca_id from related actions
      await supabase
        .from('kr_monthly_actions')
        .update({ fca_id: null })
        .eq('fca_id', fcaId);

      // Then delete the FCA
      const { error } = await supabase
        .from('kr_fca')
        .delete()
        .eq('id', fcaId);

      if (error) throw error;

      setFcas(prev => prev.filter(fca => fca.id !== fcaId));
      toast({
        title: "Sucesso",
        description: "FCA deletado com sucesso",
      });
    } catch (error) {
      console.error('Error deleting FCA:', error);
      toast({
        title: "Erro",
        description: "Erro ao deletar FCA",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Obter estatísticas dos FCAs
  const getFCAStats = () => {
    const total = fcas.length;
    const active = fcas.filter(f => f.status === 'active').length;
    const resolved = fcas.filter(f => f.status === 'resolved').length;
    const cancelled = fcas.filter(f => f.status === 'cancelled').length;
    
    const highPriority = fcas.filter(f => f.priority === 'high').length;
    const mediumPriority = fcas.filter(f => f.priority === 'medium').length;
    const lowPriority = fcas.filter(f => f.priority === 'low').length;

    return {
      total,
      active,
      resolved,
      cancelled,
      highPriority,
      mediumPriority,
      lowPriority,
      resolutionRate: total > 0 ? (resolved / total) * 100 : 0
    };
  };

  // Carregar FCAs quando keyResultId mudar
  useEffect(() => {
    if (keyResultId) {
      loadFCAs();
    }
  }, [keyResultId]);

  return {
    fcas,
    loading,
    selectedFCA,
    setSelectedFCA,
    createFCA,
    updateFCA,
    deleteFCA,
    loadFCAs,
    getFCAWithActions,
    getFCAStats,
  };
};