import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAIAnalyticsRaw, useModelPricing, useCompaniesMap, useProfilesMap, calculateCost, formatTokens } from "@/hooks/admin/useAIUsageStats";

const AIByUserPage = () => {
  const { data: analytics = [], isLoading } = useAIAnalyticsRaw();
  const { data: pricing = [] } = useModelPricing();
  const { data: companiesMap = {} } = useCompaniesMap();
  const { data: profilesMap = {} } = useProfilesMap();

  const userStats = useMemo(() => {
    const chatEvents = analytics.filter((e: any) => e.event_type === "chat_completion");
    const map: Record<string, { name: string; company: string; calls: number; tokens: number; costBrl: number }> = {};

    chatEvents.forEach((e: any) => {
      const ed = e.event_data as any;
      const uid = e.user_id;
      const companyInfo = companiesMap[ed?.company_id];
      if (!map[uid]) {
        const name = ed?.user_name || profilesMap[uid] || uid.slice(0, 8);
        map[uid] = { name, company: companyInfo?.name || "—", calls: 0, tokens: 0, costBrl: 0 };
      }
      map[uid].calls += 1;
      map[uid].tokens += ed?.total_tokens || 0;
      const cost = calculateCost(ed?.model_used, ed?.prompt_tokens || 0, ed?.completion_tokens || 0, pricing);
      map[uid].costBrl += cost.brl;
    });

    return Object.entries(map)
      .map(([id, s]) => ({ id, ...s }))
      .sort((a, b) => b.tokens - a.tokens);
  }, [analytics, pricing, companiesMap, profilesMap]);

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
                <TableHead>Empresa</TableHead>
                <TableHead className="text-right">Chamadas</TableHead>
                <TableHead className="text-right">Tokens</TableHead>
                <TableHead className="text-right">Custo (R$)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userStats.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell>{u.company}</TableCell>
                  <TableCell className="text-right">{u.calls}</TableCell>
                  <TableCell className="text-right">{formatTokens(u.tokens)}</TableCell>
                  <TableCell className="text-right">R$ {u.costBrl.toFixed(2)}</TableCell>
                </TableRow>
              ))}
              {userStats.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nenhum dado encontrado</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIByUserPage;
