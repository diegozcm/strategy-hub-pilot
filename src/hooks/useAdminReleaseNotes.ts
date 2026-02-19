import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type ReleaseNote = Database["public"]["Tables"]["release_notes"]["Row"];
type ReleaseNoteInsert = Database["public"]["Tables"]["release_notes"]["Insert"];
type ReleaseNoteUpdate = Database["public"]["Tables"]["release_notes"]["Update"];

const QUERY_KEY = ["admin-release-notes"];

export function useAllReleaseNotes() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("release_notes")
        .select("*")
        .order("date", { ascending: false });
      if (error) throw error;
      return data as ReleaseNote[];
    },
  });
}

export function useReleaseNote(id: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("release_notes")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as ReleaseNote;
    },
  });
}

export function useCreateRelease() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: ReleaseNoteInsert) => {
      const { data, error } = await supabase
        .from("release_notes")
        .insert(values)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useUpdateRelease() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: ReleaseNoteUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("release_notes")
        .update(values)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useDeleteRelease() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("release_notes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
