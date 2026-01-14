import { Activity, LogIn, Database, Trash2, UserCheck, Filter } from "lucide-react";
import { AdminPageContainer } from "../../components/AdminPageContainer";
import { StatCard } from "../../components/StatCard";
import { PeriodFilter } from "../../components/PeriodFilter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow, subDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

type ActivityType = "login" | "backup" | "cleanup" | "all";

interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  user_name?: string;
  user_avatar?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

const activityConfig: Record<Exclude<ActivityType, "all">, { icon: typeof Activity; color: string; label: string }> = {
  login: { icon: LogIn, color: "text-blue-500 bg-blue-500/10", label: "Login" },
  backup: { icon: Database, color: "text-green-500 bg-green-500/10", label: "Backup" },
  cleanup: { icon: Trash2, color: "text-orange-500 bg-orange-500/10", label: "Limpeza" },
};

export default function RecentActivityPage() {
  const [dateRange, setDateRange] = useState({ 
    from: subDays(new Date(), 7), 
    to: new Date() 
  });
  const [activityFilter, setActivityFilter] = useState<ActivityType>("all");

  // Fetch all activity types
  const { data: activities, isLoading } = useQuery({
    queryKey: ["admin-activities", dateRange.from, dateRange.to],
    queryFn: async () => {
      const allActivities: ActivityItem[] = [];

      // Fetch logins
      const { data: logins } = await supabase
        .from("user_login_logs")
        .select("id, user_id, login_time")
        .gte("login_time", dateRange.from.toISOString())
        .lte("login_time", dateRange.to.toISOString())
        .order("login_time", { ascending: false })
        .limit(100);

      // Get profile info for logins
      const userIds = [...new Set(logins?.map(l => l.user_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name, avatar_url")
        .in("user_id", userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      logins?.forEach(login => {
        const profile = profileMap.get(login.user_id);
        allActivities.push({
          id: login.id,
          type: "login",
          title: "Login no sistema",
          description: profile ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Usuário" : "Usuário",
          user_name: profile ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() : undefined,
          user_avatar: profile?.avatar_url || undefined,
          timestamp: login.login_time,
        });
      });

      // Fetch backups
      const { data: backups } = await supabase
        .from("backup_jobs")
        .select("id, created_at, status, backup_type, backup_size_bytes")
        .gte("created_at", dateRange.from.toISOString())
        .lte("created_at", dateRange.to.toISOString())
        .order("created_at", { ascending: false });

      backups?.forEach(backup => {
        allActivities.push({
          id: backup.id,
          type: "backup",
          title: `Backup ${backup.backup_type || "completo"}`,
          description: backup.status === "completed" 
            ? `Concluído (${backup.backup_size_bytes ? (backup.backup_size_bytes / 1024 / 1024).toFixed(2) + " MB" : "-"})` 
            : backup.status === "failed" 
              ? "Falhou" 
              : "Em progresso",
          timestamp: backup.created_at,
          metadata: { status: backup.status },
        });
      });

      // Fetch cleanups
      const { data: cleanups } = await supabase
        .from("database_cleanup_logs")
        .select("id, executed_at, cleanup_category, records_deleted, success")
        .gte("executed_at", dateRange.from.toISOString())
        .lte("executed_at", dateRange.to.toISOString())
        .order("executed_at", { ascending: false });

      cleanups?.forEach(cleanup => {
        allActivities.push({
          id: cleanup.id,
          type: "cleanup",
          title: `Limpeza: ${cleanup.cleanup_category}`,
          description: cleanup.success 
            ? `${cleanup.records_deleted} registros removidos` 
            : "Falhou",
          timestamp: cleanup.executed_at,
          metadata: { success: cleanup.success },
        });
      });

      // Sort by timestamp
      allActivities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      return allActivities;
    },
  });

  // Calculate stats
  const stats = useMemo(() => {
    if (!activities) return { total: 0, logins: 0, backups: 0, cleanups: 0 };
    
    return {
      total: activities.length,
      logins: activities.filter(a => a.type === "login").length,
      backups: activities.filter(a => a.type === "backup").length,
      cleanups: activities.filter(a => a.type === "cleanup").length,
    };
  }, [activities]);

  // Filter activities
  const filteredActivities = useMemo(() => {
    if (!activities) return [];
    if (activityFilter === "all") return activities;
    return activities.filter(a => a.type === activityFilter);
  }, [activities, activityFilter]);

  // Group by date
  const groupedActivities = useMemo(() => {
    const groups: Record<string, ActivityItem[]> = {};
    
    filteredActivities.forEach(activity => {
      const date = format(new Date(activity.timestamp), "yyyy-MM-dd");
      if (!groups[date]) groups[date] = [];
      groups[date].push(activity);
    });

    return Object.entries(groups).map(([date, items]) => ({
      date,
      label: format(new Date(date), "EEEE, d 'de' MMMM", { locale: ptBR }),
      items,
    }));
  }, [filteredActivities]);

  return (
    <AdminPageContainer 
      title="Atividade Recente" 
      description="Timeline de ações do sistema"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total de Atividades"
            value={stats.total}
            icon={Activity}
            variant="info"
            isLoading={isLoading}
          />
          <StatCard
            title="Logins"
            value={stats.logins}
            icon={LogIn}
            variant="default"
            isLoading={isLoading}
          />
          <StatCard
            title="Backups"
            value={stats.backups}
            icon={Database}
            variant="success"
            isLoading={isLoading}
          />
          <StatCard
            title="Limpezas"
            value={stats.cleanups}
            icon={Trash2}
            variant="warning"
            isLoading={isLoading}
          />
        </div>

        {/* Timeline */}
        <Card>
          <CardHeader className="space-y-4">
            <CardTitle className="text-lg">Timeline de Atividades</CardTitle>
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <PeriodFilter value={dateRange} onChange={setDateRange} />
              <Select value={activityFilter} onValueChange={(v) => setActivityFilter(v as ActivityType)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as atividades</SelectItem>
                  <SelectItem value="login">Logins</SelectItem>
                  <SelectItem value="backup">Backups</SelectItem>
                  <SelectItem value="cleanup">Limpezas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    <div className="h-4 w-48 bg-muted animate-pulse rounded" />
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="h-16 bg-muted animate-pulse rounded ml-6" />
                    ))}
                  </div>
                ))}
              </div>
            ) : groupedActivities.length > 0 ? (
              <div className="space-y-8">
                {groupedActivities.map(group => (
                  <div key={group.date}>
                    <h3 className="text-sm font-medium text-muted-foreground mb-4 capitalize">
                      {group.label}
                    </h3>
                    <div className="space-y-3">
                      {group.items.map((activity) => {
                        const config = activityConfig[activity.type as Exclude<ActivityType, "all">];
                        const Icon = config.icon;
                        
                        return (
                          <div 
                            key={activity.id} 
                            className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className={cn(
                              "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                              config.color
                            )}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="font-medium text-sm">{activity.title}</p>
                                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                                </div>
                                <Badge variant="outline" className="shrink-0">
                                  {config.label}
                                </Badge>
                              </div>
                              {activity.user_name && (
                                <div className="flex items-center gap-2 mt-2">
                                  <Avatar className="h-5 w-5">
                                    <AvatarImage src={activity.user_avatar} />
                                    <AvatarFallback className="text-xs">
                                      {activity.user_name.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs text-muted-foreground">{activity.user_name}</span>
                                </div>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground shrink-0">
                              {formatDistanceToNow(new Date(activity.timestamp), { 
                                addSuffix: true, 
                                locale: ptBR 
                              })}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                Nenhuma atividade encontrada no período selecionado
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminPageContainer>
  );
}
