import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { KeyResult } from '@/types/strategic-map';

export const useKRUpdate = () => {
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  const updateKeyResult = async (
    keyResultId: string,
    updates: Partial<KeyResult>
  ): Promise<KeyResult | null> => {
    try {
      setUpdating(true);

      // Validar e limpar JSON antes de salvar
      const cleanUpdates = { ...updates };
      
      if (updates.monthly_actual) {
        cleanUpdates.monthly_actual = Object.fromEntries(
          Object.entries(updates.monthly_actual)
            .filter(([_, v]) => typeof v === 'number' && !isNaN(v))
        );
      }
      
      if (updates.monthly_targets) {
        cleanUpdates.monthly_targets = Object.fromEntries(
          Object.entries(updates.monthly_targets)
            .filter(([_, v]) => typeof v === 'number' && !isNaN(v))
        );
      }

      const { data, error } = await supabase
        .from('key_results')
        .update(cleanUpdates)
        .eq('id', keyResultId)
        .select()
        .single();

      if (error) throw error;

      return data as KeyResult;
    } catch (error) {
      console.error('Error updating key result:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar resultado-chave.",
        variant: "destructive",
      });
      return null;
    } finally {
      setUpdating(false);
    }
  };

  return { updateKeyResult, updating };
};
