import { Eye, MousePointerClick, Clock, Monitor, Smartphone, Tablet, HelpCircle, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "../../components/StatCard";
import {
  useAnalyticsOverview,
  useDailyVisitors,
  useDeviceBreakdown,
} from "@/hooks/admin/useAnalyticsStats";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
} from "recharts";

const DEVICE_ICONS: Record<string, React.ElementType> = {
  Desktop: Monitor,
  Mobile: Smartphone,
  Tablet: Tablet,
  Desconhecido: HelpCircle,
};

const DEVICE_COLORS = [
  "hsl(var(--cofound-blue-light))",
  "hsl(var(--cofound-green))",
  "hsl(var(--warning, 45 93% 47%))",
  "hsl(var(--muted-foreground))",
];

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return sec > 0 ? `${min}m ${sec}s` : `${min}m`;
}

export function AnalyticsSection() {
  const { data: overview, isLoading: overviewLoading } = useAnalyticsOverview(7);
  const { data: dailyData } = useDailyVisitors(7);
  const { data: devices, isLoading: devicesLoading } = useDeviceBreakdown(7);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold">Analytics da Plataforma (7 dias)</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <p className="text-xs">Dados baseados em logins reais dos usuários. Visitantes = usuários únicos. Sessões = total de logins. Duração = tempo entre login e logout.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Visitantes Únicos"
          value={overview?.totalVisitors || 0}
          description="Usuários distintos"
          icon={Eye}
          variant="info"
          isLoading={overviewLoading}
        />
        <StatCard
          title="Total de Sessões"
          value={overview?.totalSessions || 0}
          description="Logins realizados"
          icon={MousePointerClick}
          variant="success"
          isLoading={overviewLoading}
        />
        <StatCard
          title="Logins/Usuário"
          value={overview?.avgLoginsPerUser || 0}
          description="Média de logins por visitante"
          icon={MousePointerClick}
          variant="default"
          isLoading={overviewLoading}
        />
        <StatCard
          title="Duração Média"
          value={overview ? formatDuration(overview.avgSessionDuration) : "—"}
          description="Tempo por sessão"
          icon={Clock}
          variant="warning"
          isLoading={overviewLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visitors Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Visitantes por Dia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              {dailyData && dailyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="visitors"
                      name="Visitantes"
                      stroke="hsl(var(--cofound-blue-light))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--cofound-blue-dark))", r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="sessions"
                      name="Sessões"
                      stroke="hsl(var(--cofound-green))"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: "hsl(var(--cofound-green))", r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Nenhum dado disponível
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Device Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dispositivos</CardTitle>
          </CardHeader>
          <CardContent>
            {devicesLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-10 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : devices && devices.length > 0 ? (
              <div className="space-y-3">
                {devices.map((d, i) => {
                  const Icon = DEVICE_ICONS[d.device] || Monitor;
                  return (
                    <div key={d.device} className="flex items-center gap-3">
                      <div
                        className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${DEVICE_COLORS[i % DEVICE_COLORS.length]}20` }}
                      >
                        <Icon className="h-4 w-4" style={{ color: DEVICE_COLORS[i % DEVICE_COLORS.length] }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">{d.device}</span>
                          <span className="text-xs text-muted-foreground">{d.percentage}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${d.percentage}%`,
                              backgroundColor: DEVICE_COLORS[i % DEVICE_COLORS.length],
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
                <p className="text-xs text-muted-foreground mt-2">
                  Total: {devices.reduce((s, d) => s + d.count, 0)} sessões
                </p>
              </div>
            ) : (
              <div className="h-[150px] flex items-center justify-center text-muted-foreground text-sm">
                Sem dados
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
