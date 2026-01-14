import { Building2, Users, Shield, Activity, Clock, CheckCircle } from "lucide-react";
import { AdminPageContainer } from "../../components/AdminPageContainer";
import { StatCard } from "../../components/StatCard";
import { PresenceIndicator } from "../../components/PresenceIndicator";
import { useDashboardStats, useRecentLogins, useLoginStats } from "@/hooks/admin/useDashboardStats";
import { useActiveUsersPresence } from "@/hooks/useActiveUsersPresence";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function DashboardOverviewPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { activeUsers } = useActiveUsersPresence();
  const { data: recentLogins, isLoading: loginsLoading } = useRecentLogins(5);
  const { data: loginChart } = useLoginStats(7);

  return (
    <AdminPageContainer 
      title="Painel Principal" 
      description="Visão geral do sistema administrativo"
    >
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <StatCard
            title="Total de Empresas"
            value={stats?.totalCompanies || 0}
            description={`${stats?.activeCompanies || 0} ativas`}
            icon={Building2}
            variant="info"
            isLoading={statsLoading}
          />
          <StatCard
            title="Total de Usuários"
            value={stats?.totalUsers || 0}
            description={`${stats?.activeUsers || 0} ativos`}
            icon={Users}
            variant="success"
            isLoading={statsLoading}
          />
          <StatCard
            title="Usuários Pendentes"
            value={stats?.pendingUsers || 0}
            description="Aguardando aprovação"
            icon={Clock}
            variant={stats?.pendingUsers && stats.pendingUsers > 0 ? "warning" : "default"}
            isLoading={statsLoading}
          />
          <StatCard
            title="Admins do Sistema"
            value={stats?.systemAdmins || 0}
            icon={Shield}
            variant="default"
            isLoading={statsLoading}
          />
          <StatCard
            title="Usuários Online"
            value={activeUsers.length}
            description="Em tempo real"
            icon={Activity}
            variant="success"
          />
          <StatCard
            title="Startups"
            value={stats?.startupCompanies || 0}
            description="Empresas tipo startup"
            icon={Building2}
            variant="info"
            isLoading={statsLoading}
          />
          <StatCard
            title="Empresas com IA"
            value={stats?.companiesWithAI || 0}
            description="IA Copilot habilitado"
            icon={CheckCircle}
            variant="success"
            isLoading={statsLoading}
          />
          <StatCard
            title="Empresas com OKR"
            value={stats?.companiesWithOKR || 0}
            description="Módulo OKR ativo"
            icon={CheckCircle}
            variant="success"
            isLoading={statsLoading}
          />
        </div>

        {/* Charts and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Login Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Logins por Dia (Últimos 7 dias)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                {loginChart && loginChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={loginChart}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="date" 
                        className="text-xs fill-muted-foreground"
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        className="text-xs fill-muted-foreground"
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px"
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="logins" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{ fill: "hsl(var(--primary))" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    Nenhum dado de login disponível
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Logins */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Últimos Logins</CardTitle>
            </CardHeader>
            <CardContent>
              {loginsLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
                      <div className="flex-1 space-y-1">
                        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                        <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentLogins && recentLogins.length > 0 ? (
                <div className="space-y-3">
                  {recentLogins.map((login) => (
                    <div key={login.id} className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={login.user_avatar || undefined} />
                        <AvatarFallback className="text-xs">
                          {login.user_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{login.user_name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {login.company_name}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(login.login_time), { 
                            addSuffix: true,
                            locale: ptBR 
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  Nenhum login registrado
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Active Users Online */}
        {activeUsers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <PresenceIndicator />
                Usuários Online Agora ({activeUsers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {activeUsers.slice(0, 10).map((user) => (
                  <div 
                    key={user.user_id} 
                    className="flex items-center gap-2 bg-muted/50 rounded-full px-3 py-1.5"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {(user.first_name || user.email || "U").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">
                      {user.first_name || user.email?.split("@")[0] || "Usuário"}
                    </span>
                    <PresenceIndicator size="sm" />
                  </div>
                ))}
                {activeUsers.length > 10 && (
                  <div className="flex items-center px-3 py-1.5 text-sm text-muted-foreground">
                    +{activeUsers.length - 10} mais
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminPageContainer>
  );
}
