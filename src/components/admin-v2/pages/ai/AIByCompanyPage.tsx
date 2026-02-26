import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, CheckCircle2, XCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  useAIAnalyticsRaw, useModelPricing, useCompaniesMap,
  useAIChatSessions, calculateCost, formatTokens,
} from "@/hooks/admin/useAIUsageStats";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const AIByCompanyPage = () => {
  const [showAll, setShowAll] = useState(false);
  const { data: analytics = [], isLoading: l1 } = useAIAnalyticsRaw();
  const { data: pricing = [], isLoading: l2 } = useModelPricing();
  const { data: companiesMap = {}, isLoading: l3 } = useCompaniesMap();
  const { data: sessions = [] } = useAIChatSessions();

  const isLoading = l1 || l2 || l3;

  const companyStats = useMemo(() => {
    // Start with ALL companies that have ai_enabled
    const map: Record<string, {
      name: string; ai_enabled: boolean;
      calls: number; sessions: number; messages: number;
      tokens: number; costBrl: number; lastActivity: string;
    }> = {};

    // Initialize from companies map
    Object.entries(companiesMap).forEach(([id, info]) => {
      if (showAll || info.ai_enabled) {
        map[id] = {
          name: info.name, ai_enabled: info.ai_enabled,
          calls: 0, sessions: 0, messages: 0,
          tokens: 0, costBrl: 0, lastActivity: "",
        };
      }
    });

    // Aggregate analytics
    const chatEvents = analytics.filter((e: any) => e.event_type === "chat_completion");
    chatEvents.forEach((e: any) => {
      const ed = e.event_data as any;
      const cid = ed?.company_id;
      if (!cid || !map[cid]) {
        if (!cid) return;
        const info = companiesMap[cid];
        if (!showAll && (!info || !info.ai_enabled)) return;
        map[cid] = {
          name: info?.name || cid.slice(0, 8), ai_enabled: info?.ai_enabled ?? false,
          calls: 0, sessions: 0, messages: 0, tokens: 0, costBrl: 0, lastActivity: "",
        };
      }
      map[cid].calls += 1;
      map[cid].tokens += ed?.total_tokens || 0;
      const cost = calculateCost(ed?.model_used, ed?.prompt_tokens || 0, ed?.completion_tokens || 0, pricing);
      map[cid].costBrl += cost.brl;
      if (!map[cid].lastActivity || e.created_at > map[cid].lastActivity) {
        map[cid].lastActivity = e.created_at;
      }
    });

    // Aggregate sessions
    sessions.forEach((s: any) => {
      const cid = s.company_id;
      if (!cid || !map[cid]) return;
      map[cid].sessions += 1;
      map[cid].messages += s.ai_chat_messages?.length || 0;
      if (!map[cid].lastActivity || s.updated_at > map[cid].lastActivity) {
        map[cid].lastActivity = s.updated_at;
      }
    });

    return Object.entries(map)
      .map(([id, s]) => ({ id, ...s }))
      .sort((a, b) => b.tokens - a.tokens);
  }, [analytics, pricing, companiesMap, sessions, showAll]);

  if (isLoading) {
    return <div className="p-6 flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Building2 className="h-6 w-6 text-accent" />
          Consumo por Empresa
        </h1>
        <div className="flex items-center gap-2">
          <Switch id="show-all" checked={showAll} onCheckedChange={setShowAll} />
          <Label htmlFor="show-all" className="text-sm text-muted-foreground">Mostrar todas</Label>
        </div>
      </div>
      <Card>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead className="text-center">IA Ativa</TableHead>
                <TableHead className="text-right">Sessões</TableHead>
                <TableHead className="text-right">Mensagens</TableHead>
                <TableHead className="text-right">Tokens</TableHead>
                <TableHead className="text-right">Custo (R$)</TableHead>
                <TableHead>Última Atividade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companyStats.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-center">
                    {c.ai_enabled ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 inline-block" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive inline-block" />
                    )}
                  </TableCell>
                  <TableCell className="text-right">{c.sessions}</TableCell>
                  <TableCell className="text-right">{c.messages}</TableCell>
                  <TableCell className="text-right">{formatTokens(c.tokens)}</TableCell>
                  <TableCell className="text-right">R$ {c.costBrl.toFixed(2)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {c.lastActivity ? format(new Date(c.lastActivity), "dd/MM/yy HH:mm", { locale: ptBR }) : "—"}
                  </TableCell>
                </TableRow>
              ))}
              {companyStats.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Nenhum dado encontrado</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIByCompanyPage;
