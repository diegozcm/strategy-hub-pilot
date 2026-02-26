import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Coins, Activity, MessageSquare, Zap, AlertCircle, Users } from "lucide-react";
import {
  useAIAnalyticsRaw,
  useModelPricing,
  useCompaniesMap,
  useProfilesMap,
  useAIChatSessions,
  calculateCost,
  formatTokens,
} from "@/hooks/admin/useAIUsageStats";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

const COLORS = ["hsl(203, 100%, 61%)", "hsl(66, 59%, 63%)", "hsl(0, 84%, 60%)", "hsl(280, 60%, 60%)", "hsl(30, 90%, 55%)"];

const AIUsageDashboardPage = () => {
  const [days, setDays] = useState("30");
  const dateFrom = subDays(new Date(), parseInt(days)).toISOString();
  const { data: analytics = [], isLoading: l1, isError: e1 } = useAIAnalyticsRaw(dateFrom);
  const { data: pricing = [], isLoading: l2, isError: e2 } = useModelPricing();
  const { data: companiesMap = {}, isLoading: l3 } = useCompaniesMap();
  const { data: profilesMap = {} } = useProfilesMap();
  const { data: sessions = [], isLoading: l4 } = useAIChatSessions();

  const isLoading = l1 || l2 || l3 || l4;
  const isError = e1 || e2;

  // Filter sessions within date range
  const filteredSessions = useMemo(() => {
    return sessions.filter((s: any) => s.created_at >= dateFrom);
  }, [sessions, dateFrom]);

  const stats = useMemo(() => {
    const chatEvents = analytics.filter((e: any) => e.event_type === "chat_completion");

    let totalPrompt = 0, totalCompletion = 0, totalTokens = 0, totalCostBrl = 0;
    const uniqueUsers = new Set<string>();

    chatEvents.forEach((e: any) => {
      const ed = e.event_data as any;
      const pt = ed?.prompt_tokens || 0;
      const ct = ed?.completion_tokens || 0;
      totalPrompt += pt;
      totalCompletion += ct;
      totalTokens += ed?.total_tokens || 0;
      const cost = calculateCost(ed?.model_used, pt, ct, pricing);
      totalCostBrl += cost.brl;
      uniqueUsers.add(e.user_id);
    });

    // Also count users from sessions
    filteredSessions.forEach((s: any) => uniqueUsers.add(s.user_id));

    // Timeline data
    const byDay: Record<string, { prompt: number; completion: number; calls: number }> = {};
    chatEvents.forEach((e: any) => {
      const day = format(new Date(e.created_at), "dd/MM");
      if (!byDay[day]) byDay[day] = { prompt: 0, completion: 0, calls: 0 };
      const ed = e.event_data as any;
      byDay[day].prompt += ed?.prompt_tokens || 0;
      byDay[day].completion += ed?.completion_tokens || 0;
      byDay[day].calls += 1;
    });
    const timelineData = Object.entries(byDay).map(([day, v]) => ({ day, ...v }));

    // By model
    const byModel: Record<string, number> = {};
    chatEvents.forEach((e: any) => {
      const model = (e.event_data as any)?.model_used || "unknown";
      const shortName = model.split("/").pop() || model;
      byModel[shortName] = (byModel[shortName] || 0) + 1;
    });
    const modelData = Object.entries(byModel).map(([name, value]) => ({ name, value }));

    // By company (only ai_enabled)
    const byCompany: Record<string, number> = {};
    chatEvents.forEach((e: any) => {
      const cid = (e.event_data as any)?.company_id || "unknown";
      const info = companiesMap[cid];
      if (info && !info.ai_enabled) return;
      const name = info?.name || cid.slice(0, 8);
      byCompany[name] = (byCompany[name] || 0) + ((e.event_data as any)?.total_tokens || 0);
    });
    const companyData = Object.entries(byCompany)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, tokens]) => ({ name, tokens }));

    return {
      totalCalls: chatEvents.length,
      totalSessions: filteredSessions.length,
      totalTokens,
      totalPrompt,
      totalCompletion,
      totalCostBrl,
      uniqueUsers: uniqueUsers.size,
      timelineData,
      modelData,
      companyData,
      recentCalls: chatEvents.slice(0, 15),
    };
  }, [analytics, pricing, companiesMap, filteredSessions]);

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[400px] text-muted-foreground">
        <AlertCircle className="h-10 w-10 mb-3 text-destructive" />
        <p className="text-lg font-medium">Erro ao carregar dados de IA</p>
        <p className="text-sm mt-1">Verifique se você tem permissão de administrador do sistema.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-accent" />
            IA Atlas — Consumo e Custos
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Acompanhe o uso da IA Atlas em todas as empresas
          </p>
        </div>
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
            <SelectItem value="365">Último ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Activity className="h-4 w-4" /> Chamadas
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.totalCalls}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <MessageSquare className="h-4 w-4" /> Sessões
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.totalSessions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Sparkles className="h-4 w-4" /> Tokens
            </div>
            <p className="text-2xl font-bold text-foreground">{formatTokens(stats.totalTokens)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Coins className="h-4 w-4" /> Custo Estimado
            </div>
            <p className="text-2xl font-bold text-foreground">
              R$ {stats.totalCostBrl.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Users className="h-4 w-4" /> Usuários Ativos
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.uniqueUsers}</p>
          </CardContent>
        </Card>
      </div>

      {analytics.length === 0 && filteredSessions.length === 0 ? (
        <Card>
          <CardContent className="p-8 flex flex-col items-center text-muted-foreground">
            <Sparkles className="h-10 w-10 mb-3" />
            <p className="font-medium">Nenhum dado de uso encontrado</p>
            <p className="text-sm mt-1">Não há registros de analytics no período selecionado.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Tokens por Dia</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={stats.timelineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                    <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip />
                    <Line type="monotone" dataKey="prompt" stroke="hsl(203, 100%, 61%)" name="Prompt" strokeWidth={2} />
                    <Line type="monotone" dataKey="completion" stroke="hsl(66, 59%, 63%)" name="Completion" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Distribuição por Modelo</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={stats.modelData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {stats.modelData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Companies */}
          {stats.companyData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Top 5 Empresas por Consumo (IA Ativa)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={stats.companyData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                    <YAxis dataKey="name" type="category" width={120} fontSize={11} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip formatter={(v: number) => formatTokens(v)} />
                    <Bar dataKey="tokens" fill="hsl(203, 100%, 61%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Recent Calls Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Últimas Chamadas</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead className="text-right">Tokens</TableHead>
                    <TableHead className="text-right">Custo (R$)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentCalls.map((e: any) => {
                    const ed = e.event_data as any;
                    const cost = calculateCost(ed?.model_used, ed?.prompt_tokens || 0, ed?.completion_tokens || 0, pricing);
                    const userName = ed?.user_name || profilesMap[e.user_id] || e.user_id?.slice(0, 8);
                    const companyInfo = companiesMap[ed?.company_id];
                    return (
                      <TableRow key={e.id}>
                        <TableCell className="text-xs">
                          {format(new Date(e.created_at), "dd/MM HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-xs">{userName}</TableCell>
                        <TableCell className="text-xs">{companyInfo?.name || "—"}</TableCell>
                        <TableCell className="text-xs">{ed?.model_used?.split("/").pop() || "—"}</TableCell>
                        <TableCell className="text-right text-xs">{formatTokens(ed?.total_tokens || 0)}</TableCell>
                        <TableCell className="text-right text-xs">R$ {cost.brl.toFixed(4)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default AIUsageDashboardPage;
