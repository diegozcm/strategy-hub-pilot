import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  useAIAnalyticsRaw, useModelPricing, useCompaniesMap,
  useProfilesMap, useAIChatSessions, calculateCost, formatTokens,
} from "@/hooks/admin/useAIUsageStats";

const AIByUserPage = () => {
  const { data: analytics = [], isLoading: l1 } = useAIAnalyticsRaw();
  const { data: pricing = [], isLoading: l2 } = useModelPricing();
  const { data: companiesMap = {} } = useCompaniesMap();
  const { data: profilesMap = {} } = useProfilesMap();
  const { data: sessions = [] } = useAIChatSessions();

  const isLoading = l1 || l2;

  const userStats = useMemo(() => {
    const map: Record<string, {
      name: string; companies: Set<string>;
      calls: number; sessions: number; messages: number;
      tokens: number; costBrl: number;
    }> = {};

    const ensureUser = (uid: string) => {
      if (!map[uid]) {
        const name = profilesMap[uid] || uid.slice(0, 8);
        map[uid] = { name, companies: new Set(), calls: 0, sessions: 0, messages: 0, tokens: 0, costBrl: 0 };
      }
    };

    // From analytics
    const chatEvents = analytics.filter((e: any) => e.event_type === "chat_completion");
    chatEvents.forEach((e: any) => {
      const uid = e.user_id;
      const ed = e.event_data as any;
      ensureUser(uid);
      if (ed?.user_name && map[uid].name === uid.slice(0, 8)) map[uid].name = ed.user_name;
      if (ed?.company_id) {
        const cInfo = companiesMap[ed.company_id];
        map[uid].companies.add(cInfo?.name || ed.company_id.slice(0, 8));
      }
      map[uid].calls += 1;
      map[uid].tokens += ed?.total_tokens || 0;
      const cost = calculateCost(ed?.model_used, ed?.prompt_tokens || 0, ed?.completion_tokens || 0, pricing);
      map[uid].costBrl += cost.brl;
    });

    // From sessions (complementary)
    sessions.forEach((s: any) => {
      const uid = s.user_id;
      ensureUser(uid);
      map[uid].sessions += 1;
      map[uid].messages += s.ai_chat_messages?.length || 0;
      if (s.company_id) {
        const cInfo = companiesMap[s.company_id];
        map[uid].companies.add(cInfo?.name || s.company_id.slice(0, 8));
      }
    });

    return Object.entries(map)
      .map(([id, s]) => ({
        id,
        name: s.name,
        companiesList: Array.from(s.companies).join(", ") || "—",
        calls: s.calls,
        sessions: s.sessions,
        messages: s.messages,
        tokens: s.tokens,
        costBrl: s.costBrl,
      }))
      .sort((a, b) => b.tokens - a.tokens || b.sessions - a.sessions);
  }, [analytics, pricing, companiesMap, profilesMap, sessions]);

  if (isLoading) {
    return <div className="p-6 flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
        <Users className="h-6 w-6 text-accent" />
        Consumo por Usuário
      </h1>
      <Card>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Empresas</TableHead>
                <TableHead className="text-right">Sessões</TableHead>
                <TableHead className="text-right">Mensagens</TableHead>
                <TableHead className="text-right">Tokens</TableHead>
                <TableHead className="text-right">Custo (R$)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userStats.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{u.companiesList}</TableCell>
                  <TableCell className="text-right">{u.sessions}</TableCell>
                  <TableCell className="text-right">{u.messages}</TableCell>
                  <TableCell className="text-right">{formatTokens(u.tokens)}</TableCell>
                  <TableCell className="text-right">R$ {u.costBrl.toFixed(2)}</TableCell>
                </TableRow>
              ))}
              {userStats.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nenhum dado encontrado</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIByUserPage;
