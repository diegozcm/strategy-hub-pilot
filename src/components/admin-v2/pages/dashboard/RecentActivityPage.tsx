import { Activity, LogIn, Database, Trash2, Filter, UserCog, RotateCcw, ArrowRight, Clock } from "lucide-react";
import { AdminPageContainer } from "../../components/AdminPageContainer";
import { PeriodFilter } from "../../components/PeriodFilter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow, subDays, format, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

type ActivityType = "login" | "backup" | "cleanup" | "impersonation" | "restore" | "all";

interface ActivityItem {
  id: string;
  type: Exclude<ActivityType, "all">;
  title: string;
  description: string;
  user_name?: string;
  user_avatar?: string;
  target_user_name?: string;
  target_user_avatar?: string;
  timestamp: string;
  status?: "success" | "failed" | "pending" | "active";
  metadata?: Record<string, unknown>;
}

const activityConfig: Record<Exclude<ActivityType, "all">, { icon: typeof Activity; color: string; bgColor: string; label: string }> = {
  login: { icon: LogIn, color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-100 dark:bg-blue-900/30", label: "Login" },
  backup: { icon: Database, color: "text-emerald-600 dark:text-emerald-400", bgColor: "bg-emerald-100 dark:bg-emerald-900/30", label: "Backup" },
  cleanup: { icon: Trash2, color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-100 dark:bg-amber-900/30", label: "Limpeza" },
  impersonation: { icon: UserCog, color: "text-purple-600 dark:text-purple-400", bgColor: "bg-purple-100 dark:bg-purple-900/30", label: "Impersonação" },
  restore: { icon: RotateCcw, color: "text-cyan-600 dark:text-cyan-400", bgColor: "bg-cyan-100 dark:bg-cyan-900/30", label: "Restauração" },
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case "success":
    case "completed":
      return { label: "Concluído", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" };
    case "failed":
    case "error":
      return { label: "Falhou", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" };
    case "pending":
    case "in_progress":
      return { label: "Em progresso", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" };
    case "active":
      return { label: "Ativa", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" };
    default:
      return { label: status, className: "bg-muted text-muted-foreground" };
  }
};

interface StatsData {
  logins: number;
  backups: number;
  cleanups: number;
  others: number;
}

export default function RecentActivityPage() {
  const [dateRange, setDateRange] = useState({ 
    from: subDays(new Date(), 7), 
    to: new Date() 
  });
  const [activityFilter, setActivityFilter] = useState<ActivityType>("all");

  // Separate query for accurate counts
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-activity-stats", dateRange.from, dateRange.to],
    queryFn: async (): Promise<StatsData> => {
      const [loginsCount, backupsCount, cleanupsCount, impersonationsCount, restoresCount] = await Promise.all([
        supabase
          .from("user_login_logs")
          .select("*", { count: "exact", head: true })
          .gte("login_time", dateRange.from.toISOString())
          .lte("login_time", dateRange.to.toISOString()),
        supabase
          .from("backup_jobs")
          .select("*", { count: "exact", head: true })
          .gte("created_at", dateRange.from.toISOString())
          .lte("created_at", dateRange.to.toISOString()),
        supabase
          .from("database_cleanup_logs")
          .select("*", { count: "exact", head: true })
          .gte("executed_at", dateRange.from.toISOString())
          .lte("executed_at", dateRange.to.toISOString()),
        supabase
          .from("admin_impersonation_sessions")
          .select("*", { count: "exact", head: true })
          .gte("started_at", dateRange.from.toISOString())
          .lte("started_at", dateRange.to.toISOString()),
        supabase
          .from("backup_restore_logs")
          .select("*", { count: "exact", head: true })
          .gte("created_at", dateRange.from.toISOString())
          .lte("created_at", dateRange.to.toISOString()),
      ]);

      return {
        logins: loginsCount.count || 0,
        backups: backupsCount.count || 0,
        cleanups: cleanupsCount.count || 0,
        others: (impersonationsCount.count || 0) + (restoresCount.count || 0),
      };
    },
  });

  // Fetch timeline activities with proper limits
  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ["admin-activities-timeline", dateRange.from, dateRange.to],
    queryFn: async () => {
      const allActivities: ActivityItem[] = [];

      // Fetch logins with limit
      const { data: logins } = await supabase
        .from("user_login_logs")
        .select("id, user_id, login_time")
        .gte("login_time", dateRange.from.toISOString())
        .lte("login_time", dateRange.to.toISOString())
        .order("login_time", { ascending: false })
        .limit(50);

      // Get all unique user IDs for profile lookup
      const allUserIds = new Set<string>();
      logins?.forEach(l => allUserIds.add(l.user_id));

      // Fetch impersonation sessions with limit
      const { data: impersonations } = await supabase
        .from("admin_impersonation_sessions")
        .select("id, admin_user_id, impersonated_user_id, started_at, ended_at, is_active")
        .gte("started_at", dateRange.from.toISOString())
        .lte("started_at", dateRange.to.toISOString())
        .order("started_at", { ascending: false })
        .limit(50);

      impersonations?.forEach(i => {
        allUserIds.add(i.admin_user_id);
        allUserIds.add(i.impersonated_user_id);
      });

      // Fetch restore logs with limit
      const { data: restores } = await supabase
        .from("backup_restore_logs")
        .select("id, admin_user_id, restore_type, records_restored, status, start_time, end_time, tables_restored, created_at")
        .gte("created_at", dateRange.from.toISOString())
        .lte("created_at", dateRange.to.toISOString())
        .order("created_at", { ascending: false })
        .limit(50);

      restores?.forEach(r => allUserIds.add(r.admin_user_id));

      // Fetch backups with limit
      const { data: backups } = await supabase
        .from("backup_jobs")
        .select("id, created_at, status, backup_type, backup_size_bytes, admin_user_id, total_tables")
        .gte("created_at", dateRange.from.toISOString())
        .lte("created_at", dateRange.to.toISOString())
        .order("created_at", { ascending: false })
        .limit(50);

      backups?.forEach(b => {
        if (b.admin_user_id) allUserIds.add(b.admin_user_id);
      });

      // Fetch cleanups with limit
      const { data: cleanups } = await supabase
        .from("database_cleanup_logs")
        .select("id, executed_at, cleanup_category, records_deleted, success, admin_user_id")
        .gte("executed_at", dateRange.from.toISOString())
        .lte("executed_at", dateRange.to.toISOString())
        .order("executed_at", { ascending: false })
        .limit(50);

      cleanups?.forEach(c => {
        if (c.admin_user_id) allUserIds.add(c.admin_user_id);
      });

      // Get profile info for all users
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name, avatar_url")
        .in("user_id", Array.from(allUserIds));
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      const getProfileName = (userId: string) => {
        const profile = profileMap.get(userId);
        return profile ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Usuário" : "Usuário";
      };
      const getProfileAvatar = (userId: string) => profileMap.get(userId)?.avatar_url || undefined;

      // Process logins
      logins?.forEach(login => {
        allActivities.push({
          id: login.id,
          type: "login",
          title: "Login realizado",
          description: getProfileName(login.user_id),
          user_name: getProfileName(login.user_id),
          user_avatar: getProfileAvatar(login.user_id),
          timestamp: login.login_time,
          status: "success",
        });
      });

      // Process impersonations
      impersonations?.forEach(imp => {
        const adminName = getProfileName(imp.admin_user_id);
        const targetName = getProfileName(imp.impersonated_user_id);
        const isActive = imp.is_active;
        const duration = imp.ended_at 
          ? differenceInMinutes(new Date(imp.ended_at), new Date(imp.started_at))
          : null;

        allActivities.push({
          id: imp.id,
          type: "impersonation",
          title: "Sessão de impersonação",
          description: `${adminName} → ${targetName}${duration ? ` • ${duration} min` : ""}`,
          user_name: adminName,
          user_avatar: getProfileAvatar(imp.admin_user_id),
          target_user_name: targetName,
          target_user_avatar: getProfileAvatar(imp.impersonated_user_id),
          timestamp: imp.started_at,
          status: isActive ? "active" : "success",
          metadata: { duration },
        });
      });

      // Process restores
      restores?.forEach(restore => {
        const tablesCount = restore.tables_restored?.length || 0;
        allActivities.push({
          id: restore.id,
          type: "restore",
          title: `Restauração ${restore.restore_type || "completa"}`,
          description: restore.status === "completed"
            ? `${restore.records_restored || 0} registros${tablesCount > 0 ? ` • ${tablesCount} tabelas` : ""}`
            : "Aguardando...",
          user_name: getProfileName(restore.admin_user_id),
          user_avatar: getProfileAvatar(restore.admin_user_id),
          timestamp: restore.created_at,
          status: restore.status === "completed" ? "success" : restore.status === "failed" ? "failed" : "pending",
        });
      });

      // Process backups
      backups?.forEach(backup => {
        const size = backup.backup_size_bytes ? `${(backup.backup_size_bytes / 1024 / 1024).toFixed(2)} MB` : null;
        const tables = backup.total_tables ? `${backup.total_tables} tabelas` : null;
        const parts = [size, tables].filter(Boolean);
        
        allActivities.push({
          id: backup.id,
          type: "backup",
          title: `Backup ${backup.backup_type || "automático"}`,
          description: parts.length > 0 ? parts.join(" • ") : "Processando...",
          user_name: backup.admin_user_id ? getProfileName(backup.admin_user_id) : undefined,
          user_avatar: backup.admin_user_id ? getProfileAvatar(backup.admin_user_id) : undefined,
          timestamp: backup.created_at,
          status: backup.status === "completed" ? "success" : backup.status === "failed" ? "failed" : "pending",
        });
      });

      // Process cleanups
      cleanups?.forEach(cleanup => {
        allActivities.push({
          id: cleanup.id,
          type: "cleanup",
          title: `Limpeza: ${cleanup.cleanup_category}`,
          description: `${cleanup.records_deleted} registros removidos`,
          user_name: cleanup.admin_user_id ? getProfileName(cleanup.admin_user_id) : undefined,
          user_avatar: cleanup.admin_user_id ? getProfileAvatar(cleanup.admin_user_id) : undefined,
          timestamp: cleanup.executed_at,
          status: cleanup.success ? "success" : "failed",
        });
      });

      // Sort by timestamp
      allActivities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      return allActivities.slice(0, 100);
    },
  });

  const isLoading = statsLoading || activitiesLoading;

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

  const statCards = [
    { label: "Logins", value: stats?.logins || 0, sublabel: "realizados", icon: LogIn, color: "text-blue-600 dark:text-blue-400" },
    { label: "Backups", value: stats?.backups || 0, sublabel: "executados", icon: Database, color: "text-emerald-600 dark:text-emerald-400" },
    { label: "Limpezas", value: stats?.cleanups || 0, sublabel: "executadas", icon: Trash2, color: "text-amber-600 dark:text-amber-400" },
    { label: "Outros", value: stats?.others || 0, sublabel: "atividades", icon: Activity, color: "text-muted-foreground" },
  ];

  return (
    <AdminPageContainer 
      title="Atividade Recente" 
      description="Timeline de ações do sistema"
    >
      <div className="space-y-6">
        {/* Stats Summary Card */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">Resumo do Período</CardTitle>
              <PeriodFilter value={dateRange} onChange={setDateRange} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {statCards.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div 
                    key={stat.label} 
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <div className={cn("p-2 rounded-md bg-background", stat.color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      {statsLoading ? (
                        <div className="h-6 w-12 bg-muted animate-pulse rounded" />
                      ) : (
                        <p className="text-xl font-bold">{stat.value.toLocaleString('pt-BR')}</p>
                      )}
                      <p className="text-xs text-muted-foreground">{stat.label} {stat.sublabel}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-base font-medium">Timeline</CardTitle>
              <Select value={activityFilter} onValueChange={(v) => setActivityFilter(v as ActivityType)}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas atividades</SelectItem>
                  <SelectItem value="login">Logins</SelectItem>
                  <SelectItem value="backup">Backups</SelectItem>
                  <SelectItem value="restore">Restaurações</SelectItem>
                  <SelectItem value="cleanup">Limpezas</SelectItem>
                  <SelectItem value="impersonation">Impersonações</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {activitiesLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-14 h-4 bg-muted rounded" />
                    <div className="h-8 w-8 bg-muted rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 bg-muted rounded" />
                      <div className="h-3 w-48 bg-muted rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : groupedActivities.length > 0 ? (
              <div className="space-y-8">
                {groupedActivities.map(group => (
                  <div key={group.date}>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                        {group.label}
                      </span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                    <div className="relative pl-4 border-l-2 border-muted space-y-0">
                      {group.items.map((activity) => {
                        const config = activityConfig[activity.type];
                        const Icon = config.icon;
                        const statusConfig = activity.status ? getStatusConfig(activity.status) : null;
                        
                        return (
                          <div 
                            key={activity.id} 
                            className="relative flex items-center gap-3 py-2.5 pl-4 -ml-[1px] hover:bg-muted/40 rounded-r-lg transition-colors group"
                          >
                            {/* Timeline dot */}
                            <div className="absolute -left-[9px] top-1/2 -translate-y-1/2">
                              <div className={cn(
                                "h-4 w-4 rounded-full border-2 border-background flex items-center justify-center",
                                config.bgColor
                              )}>
                                <div className={cn("h-1.5 w-1.5 rounded-full", config.color.replace("text-", "bg-"))} />
                              </div>
                            </div>

                            {/* Time */}
                            <span className="text-xs text-muted-foreground w-11 shrink-0 font-mono tabular-nums">
                              {format(new Date(activity.timestamp), "HH:mm")}
                            </span>
                            
                            {/* Icon */}
                            <div className={cn(
                              "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                              config.bgColor
                            )}>
                              <Icon className={cn("h-4 w-4", config.color)} />
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{activity.title}</span>
                                <span className="text-sm text-muted-foreground truncate hidden sm:inline">
                                  {activity.description}
                                </span>
                              </div>
                            </div>
                            
                            {/* User */}
                            {activity.user_name && (
                              <div className="hidden md:flex items-center gap-1.5 shrink-0">
                                <Avatar className="h-6 w-6 border border-border">
                                  <AvatarImage src={activity.user_avatar} />
                                  <AvatarFallback className="text-[10px] bg-muted">
                                    {activity.user_name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                {activity.target_user_name && (
                                  <>
                                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                    <Avatar className="h-6 w-6 border border-border">
                                      <AvatarImage src={activity.target_user_avatar} />
                                      <AvatarFallback className="text-[10px] bg-muted">
                                        {activity.target_user_name.charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>
                                  </>
                                )}
                              </div>
                            )}
                            
                            {/* Status */}
                            {statusConfig && (
                              <Badge 
                                variant="outline" 
                                className={cn("text-[10px] px-2 py-0.5 h-5 shrink-0 border-0 font-medium", statusConfig.className)}
                              >
                                {statusConfig.label}
                              </Badge>
                            )}
                            
                            {/* Relative time on hover */}
                            <span className="text-[10px] text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
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
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma atividade no período</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminPageContainer>
  );
}
