import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';
import { toast } from 'sonner';

interface GovernanceRuleDocument {
  id: string;
  company_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

export const useGovernanceRuleDocument = () => {
  const { company, user } = useAuth();
  const queryClient = useQueryClient();
  const companyId = company?.id;

  const documentQuery = useQuery({
    queryKey: ['governance-rule-document', companyId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('governance_rule_documents')
        .select('*')
        .eq('company_id', companyId!)
        .maybeSingle();
      if (error) throw error;
      return data as GovernanceRuleDocument | null;
    },
    enabled: !!companyId,
  });

  const getSignedUrl = async (filePath: string): Promise<string | null> => {
    const { data, error } = await supabase.storage
      .from('governance-documents')
      .createSignedUrl(filePath, 3600);
    if (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }
    return data.signedUrl;
  };

  const signedUrlQuery = useQuery({
    queryKey: ['governance-rule-document-url', documentQuery.data?.file_path],
    queryFn: () => getSignedUrl(documentQuery.data!.file_path),
    enabled: !!documentQuery.data?.file_path,
    staleTime: 30 * 60 * 1000, // 30 min
  });

  const uploadDocument = useMutation({
    mutationFn: async (file: File) => {
      const existing = documentQuery.data;

      // Remove old file if replacing
      if (existing?.file_path) {
        await supabase.storage.from('governance-documents').remove([existing.file_path]);
      }

      const filePath = `${companyId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('governance-documents')
        .upload(filePath, file, { upsert: false });
      if (uploadError) throw uploadError;

      const record = {
        company_id: companyId!,
        file_name: file.name,
        file_path: filePath,
        file_type: file.type,
        file_size: file.size,
        uploaded_by: user.id,
      };

      if (existing) {
        const { error } = await (supabase as any)
          .from('governance_rule_documents')
          .update(record)
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from('governance_rule_documents')
          .insert(record);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['governance-rule-document', companyId] });
      queryClient.invalidateQueries({ queryKey: ['governance-rule-document-url'] });
      toast.success('Documento enviado com sucesso');
    },
    onError: (err: any) => {
      console.error('Upload error:', err);
      toast.error('Erro ao enviar documento');
    },
  });

  const removeDocument = useMutation({
    mutationFn: async () => {
      const existing = documentQuery.data;
      if (!existing) throw new Error('Nenhum documento para remover');

      await supabase.storage.from('governance-documents').remove([existing.file_path]);

      const { error } = await (supabase as any)
        .from('governance_rule_documents')
        .delete()
        .eq('id', existing.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['governance-rule-document', companyId] });
      queryClient.invalidateQueries({ queryKey: ['governance-rule-document-url'] });
      toast.success('Documento removido');
    },
    onError: () => toast.error('Erro ao remover documento'),
  });

  const downloadDocument = async () => {
    const doc = documentQuery.data;
    if (!doc) return;
    const url = signedUrlQuery.data || (await getSignedUrl(doc.file_path));
    if (!url) {
      toast.error('Erro ao gerar link de download');
      return;
    }
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.file_name;
    a.target = '_blank';
    a.click();
  };

  return {
    document: documentQuery.data,
    signedUrl: signedUrlQuery.data,
    isLoading: documentQuery.isLoading,
    uploadDocument,
    removeDocument,
    downloadDocument,
  };
};
