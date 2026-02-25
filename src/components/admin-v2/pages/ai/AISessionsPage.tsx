import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAIChatSessions, useAIAnalyticsRaw, useModelPricing, useCompaniesMap, calculateCost, formatTokens } from "@/hooks/admin/useAIUsageStats";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const AISessionsPage = () => {
  const { data: sessions = [], isLoading } = useAIChatSessions();
  const { data: analytics = [] } = useAIAnalyticsRaw();
  const { data: pricing = [] } = useModelPricing();
  const { data: companiesMap = {} } = useCompaniesMap();

  // Map session_id -> aggregated tokens & cost
  const sessionMetrics = useMemo(() => {
    const map: Record<string, { tokens: number; costBrl: number }> = {};
    const chatEvents = analytics.filter((e: any) => e.event_type === "chat_completion");
    chatEvents.forEach((e: any) => {
      const ed = e.event_data as any;
      const sid = ed?.session_id;
      if (!sid) return;
      if (!map[sid]) map[sid] = { tokens: 0, costBrl: 0 };
      map[sid].tokens += ed?.total_tokens || 0;
      const cost = calculateCost(ed?.model_used, ed?.prompt_tokens || 0, ed?.completion_tokens || 0, pricing);
      map[sid].costBrl += cost.brl;
    });
    return map;
  }, [analytics, pricing]);

  if (isLoading) {
    return <div className="p-6 flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
        <MessageSquare className="h-6 w-6 text-accent" />
        Histórico de Sessões
      </h1>
      <Card>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead className="text-right">Mensagens</TableHead>
                <TableHead className="text-right">Tokens</TableHead>
                <TableHead className="text-right">Custo (R$)</TableHead>
                <TableHead>Criada em</TableHead>
                <TableHead>Última atividade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((s: any) => {
                const metrics = sessionMetrics[s.id] || { tokens: 0, costBrl: 0 };
                const companyInfo = companiesMap[s.company_id];
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.session_title || "Sem título"}</TableCell>
                    <TableCell>{companyInfo?.name || "—"}</TableCell>
                    <TableCell className="text-right">{s.ai_chat_messages?.length || 0}</TableCell>
                    <TableCell className="text-right">{formatTokens(metrics.tokens)}</TableCell>
                    <TableCell className="text-right">R$ {metrics.costBrl.toFixed(2)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(s.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {s.updated_at ? format(new Date(s.updated_at), "dd/MM/yy HH:mm", { locale: ptBR }) : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
              {sessions.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Nenhuma sessão encontrada</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AISessionsPage;
