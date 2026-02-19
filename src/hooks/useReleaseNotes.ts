import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ReleaseNote {
  id: string;
  version: string;
  title: string;
  date: string;
  summary: string | null;
  content: string;
  tags: string[];
  published: boolean;
  created_at: string;
}

export const useReleaseNotes = () => {
  return useQuery({
    queryKey: ['release-notes'],
    queryFn: async (): Promise<ReleaseNote[]> => {
      const { data, error } = await supabase
        .from('release_notes' as any)
        .select('id, version, title, date, summary, content, tags, published, created_at')
        .eq('published', true)
        .order('date', { ascending: false });

      if (error) throw error;
      return (data as any[]) || [];
    },
    staleTime: 1000 * 60 * 5,
  });
};
