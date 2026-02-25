import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ModelPricing {
  model_name: string;
  input_cost_per_million: number;
  output_cost_per_million: number;
  currency: string;
  usd_to_brl_rate: number;
  updated_at: string;
}

export interface UsageSummaryRow {
  day: string;
  company_id: string | null;
  model: string | null;
  user_name: string | null;
  user_id: string;
  event_type: string;
  call_count: number;
  total_prompt_tokens: number;
  total_completion_tokens: number;
  total_tokens: number;
}

export interface CompanyInfo {
  name: string;
  ai_enabled: boolean;
}

export function calculateCost(
  model: string | null,
  promptTokens: number,
  completionTokens: number,
  pricing: ModelPricing[]
): { usd: number; brl: number } {
  const rate = pricing.find((p) => p.model_name === model) || pricing[0];
  if (!rate) return { usd: 0, brl: 0 };
  const usd =
    (promptTokens / 1_000_000) * rate.input_cost_per_million +
    (completionTokens / 1_000_000) * rate.output_cost_per_million;
  return { usd, brl: usd * rate.usd_to_brl_rate };
}

export function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function useModelPricing() {
  return useQuery({
    queryKey: ["ai-model-pricing"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_model_pricing")
        .select("*");
      if (error) {
        console.error("❌ Error fetching ai_model_pricing:", error);
        return [] as ModelPricing[];
      }
      return (data || []) as ModelPricing[];
    },
    retry: 1,
  });
}

export function useAIAnalyticsRaw(dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: ["ai-analytics-raw", dateFrom, dateTo],
    queryFn: async () => {
      let query = supabase
        .from("ai_analytics")
        .select("*")
        .order("created_at", { ascending: false });

      if (dateFrom) query = query.gte("created_at", dateFrom);
      if (dateTo) query = query.lte("created_at", dateTo);

      const { data, error } = await query.limit(1000);
      if (error) {
        console.error("❌ Error fetching ai_analytics:", error);
        return [];
      }
      return data || [];
    },
    retry: 1,
  });
}

export function useAIChatSessions() {
  return useQuery({
    queryKey: ["ai-chat-sessions-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_chat_sessions")
        .select("*, ai_chat_messages(id)")
        .order("updated_at", { ascending: false })
        .limit(100);
      if (error) {
        console.error("❌ Error fetching ai_chat_sessions:", error);
        return [];
      }
      return data || [];
    },
    retry: 1,
  });
}

export function useCompaniesMap() {
  return useQuery({
    queryKey: ["companies-map-with-ai"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, ai_enabled");
      if (error) {
        console.error("❌ Error fetching companies:", error);
        return {} as Record<string, CompanyInfo>;
      }
      const map: Record<string, CompanyInfo> = {};
      (data || []).forEach((c) => (map[c.id] = { name: c.name, ai_enabled: c.ai_enabled }));
      return map;
    },
    retry: 1,
  });
}

export function useProfilesMap() {
  return useQuery({
    queryKey: ["profiles-map-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name");
      if (error) {
        console.error("❌ Error fetching profiles:", error);
        return {} as Record<string, string>;
      }
      const map: Record<string, string> = {};
      (data || []).forEach((p) => {
        const name = [p.first_name, p.last_name].filter(Boolean).join(" ");
        if (name) map[p.user_id] = name;
      });
      return map;
    },
    retry: 1,
  });
}
