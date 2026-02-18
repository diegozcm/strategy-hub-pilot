import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';
import { toast } from 'sonner';

interface GovernanceRule {
  id: string;
  company_id: string;
  description: string | null;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

interface GovernanceRuleItem {
  id: string;
  governance_rule_id: string;
  title: string;
  description: string | null;
  order_index: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const useGovernanceRules = () => {
  const { company, user } = useAuth();
  const queryClient = useQueryClient();
  const companyId = company?.id;

  const rulesQuery = useQuery({
    queryKey: ['governance-rules', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('governance_rules')
        .select('*')
        .eq('company_id', companyId!)
        .maybeSingle();
      if (error) throw error;
      return data as GovernanceRule | null;
    },
    enabled: !!companyId,
  });

  const ruleItemsQuery = useQuery({
    queryKey: ['governance-rule-items', rulesQuery.data?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('governance_rule_items')
        .select('*')
        .eq('governance_rule_id', rulesQuery.data!.id)
        .order('order_index');
      if (error) throw error;
      return data as GovernanceRuleItem[];
    },
    enabled: !!rulesQuery.data?.id,
  });

  const upsertDescription = useMutation({
    mutationFn: async (description: string) => {
      if (rulesQuery.data) {
        const { error } = await supabase
          .from('governance_rules')
          .update({ description, updated_by: user.id })
          .eq('id', rulesQuery.data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('governance_rules')
          .insert({ company_id: companyId!, description, created_by: user.id, updated_by: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['governance-rules', companyId] });
      toast.success('Regras salvas com sucesso');
    },
    onError: () => toast.error('Erro ao salvar regras'),
  });

  const addRuleItem = useMutation({
    mutationFn: async (data: { title: string; description?: string }) => {
      let ruleId = rulesQuery.data?.id;
      if (!ruleId) {
        const { data: newRule, error: ruleErr } = await supabase
          .from('governance_rules')
          .insert({ company_id: companyId!, description: '', created_by: user.id, updated_by: user.id })
          .select('id')
          .single();
        if (ruleErr) throw ruleErr;
        ruleId = newRule.id;
      }
      const { error } = await supabase
        .from('governance_rule_items')
        .insert({
          governance_rule_id: ruleId,
          title: data.title,
          description: data.description || null,
          order_index: (ruleItemsQuery.data?.length || 0),
          created_by: user.id,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['governance-rules', companyId] });
      queryClient.invalidateQueries({ queryKey: ['governance-rule-items'] });
      toast.success('Regra adicionada');
    },
    onError: () => toast.error('Erro ao adicionar regra'),
  });

  const updateRuleItem = useMutation({
    mutationFn: async (data: { id: string; title: string; description?: string }) => {
      const { error } = await supabase
        .from('governance_rule_items')
        .update({ title: data.title, description: data.description || null })
        .eq('id', data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['governance-rule-items'] });
      toast.success('Regra atualizada');
    },
    onError: () => toast.error('Erro ao atualizar regra'),
  });

  const deleteRuleItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('governance_rule_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['governance-rule-items'] });
      toast.success('Regra removida');
    },
    onError: () => toast.error('Erro ao remover regra'),
  });

  return {
    rule: rulesQuery.data,
    ruleItems: ruleItemsQuery.data || [],
    isLoading: rulesQuery.isLoading,
    upsertDescription,
    addRuleItem,
    updateRuleItem,
    deleteRuleItem,
  };
};
