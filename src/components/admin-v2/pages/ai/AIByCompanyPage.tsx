import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, CheckCircle2, XCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAIAnalyticsRaw, useModelPricing, useCompaniesMap, calculateCost, formatTokens } from "@/hooks/admin/useAIUsageStats";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const AIByCompanyPage = () => {
  const [showAll, setShowAll] = useState(false);
  const { data: analytics = [], isLoading } = useAIAnalyticsRaw();
  const { data: pricing = [] } = useModelPricing();
  const { data: companiesMap = {} } = useCompaniesMap();

  const companyStats = useMemo(() => {
    const chatEvents = analytics.filter((e: any) => e.event_type === "chat_completion");
    const map: Record<string, { calls: number; tokens: number; costBrl: number; lastCall: string }> = {};

    chatEvents.forEach((e: any) => {
      const ed = e.event_data as any;
      const cid = ed?.company_id || "unknown";
      if (!map[cid]) map[cid] = { calls: 0, tokens: 0, costBrl: 0, lastCall: "" };
      map[cid].calls += 1;
      map[cid].tokens += ed?.total_tokens || 0;
      const cost = calculateCost(ed?.model_used, ed?.prompt_tokens || 0, ed?.completion_tokens || 0, pricing);
      map[cid].costBrl += cost.brl;
      if (!map[cid].lastCall || e.created_at > map[cid].lastCall) map[cid].lastCall = e.created_at;
    });

    return Object.entries(map)
      .map(([id, s]) => {
        const info = companiesMap[id];
        return {
          id,
          name: info?.name || id.slice(0, 8),
          ai_enabled: info?.ai_enabled ?? false,
          ...s,
        };
      })
      .filter((c) => showAll || c.ai_enabled)
      .sort((a, b) => b.tokens - a.tokens);
  }, [analytics, pricing, companiesMap, showAll]);

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
                <TableHead className="text-right">Chamadas</TableHead>
                <TableHead className="text-right">Tokens</TableHead>
                <TableHead className="text-right">Custo (R$)</TableHead>
                <TableHead>Última Chamada</TableHead>
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
                  <TableCell className="text-right">{c.calls}</TableCell>
                  <TableCell className="text-right">{formatTokens(c.tokens)}</TableCell>
                  <TableCell className="text-right">R$ {c.costBrl.toFixed(2)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {c.lastCall ? format(new Date(c.lastCall), "dd/MM/yy HH:mm", { locale: ptBR }) : "—"}
                  </TableCell>
                </TableRow>
              ))}
              {companyStats.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nenhum dado encontrado</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIByCompanyPage;
