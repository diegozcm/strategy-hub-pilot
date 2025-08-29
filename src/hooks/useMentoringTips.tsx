import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';
import { useToast } from '@/hooks/use-toast';

interface MentoringTip {
  id: string;
  mentor_id: string;
  startup_company_id?: string;
  title: string;
  content: string;
  category: string;
  priority: string;
  is_public: boolean;
  status: string;
  created_at: string;
  updated_at: string;
  company?: {
    id: string;
    name: string;
  };
}

export const useMentoringTips = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tips, setTips] = useState<MentoringTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTips = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('mentoring_tips')
        .select(`
          *,
          company:companies!startup_company_id (
            id,
            name
          )
        `)
        .eq('mentor_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching mentoring tips:', fetchError);
        setError(fetchError.message);
        return;
      }

      setTips(data || []);
    } catch (err) {
      console.error('Unexpected error fetching tips:', err);
      setError('Erro inesperado ao buscar dicas');
    } finally {
      setLoading(false);
    }
  };

  const createTip = async (tipData: Omit<MentoringTip, 'id' | 'mentor_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return { error: 'Usuário não autenticado' };

    try {
      const { data, error: insertError } = await supabase
        .from('mentoring_tips')
        .insert([{
          ...tipData,
          mentor_id: user.id
        }])
        .select()
        .single();

      if (insertError) {
        console.error('Error creating tip:', insertError);
        return { error: insertError.message };
      }

      toast({
        title: "Dica criada",
        description: "Dica de mentoria criada com sucesso!"
      });

      await fetchTips();
      return { data };
    } catch (err) {
      console.error('Unexpected error creating tip:', err);
      return { error: 'Erro inesperado ao criar dica' };
    }
  };

  const updateTip = async (id: string, updates: Partial<MentoringTip>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('mentoring_tips')
        .update(updates)
        .eq('id', id)
        .eq('mentor_id', user?.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating tip:', updateError);
        return { error: updateError.message };
      }

      toast({
        title: "Dica atualizada",
        description: "Dica de mentoria atualizada com sucesso!"
      });

      await fetchTips();
      return { data };
    } catch (err) {
      console.error('Unexpected error updating tip:', err);
      return { error: 'Erro inesperado ao atualizar dica' };
    }
  };

  const deleteTip = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('mentoring_tips')
        .delete()
        .eq('id', id)
        .eq('mentor_id', user?.id);

      if (deleteError) {
        console.error('Error deleting tip:', deleteError);
        return { error: deleteError.message };
      }

      toast({
        title: "Dica removida",
        description: "Dica de mentoria removida com sucesso!"
      });

      await fetchTips();
      return { success: true };
    } catch (err) {
      console.error('Unexpected error deleting tip:', err);
      return { error: 'Erro inesperado ao remover dica' };
    }
  };

  useEffect(() => {
    fetchTips();
  }, [user]);

  return {
    tips,
    loading,
    error,
    createTip,
    updateTip,
    deleteTip,
    refetch: fetchTips
  };
};