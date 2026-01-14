import { Activity, LogIn, Database, Trash2, Filter, UserCog, RotateCcw, Eye, CheckCircle, XCircle, Clock, ArrowRight } from "lucide-react";
import { AdminPageContainer } from "../../components/AdminPageContainer";
import { StatCard } from "../../components/StatCard";
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

type ActivityType = "login" | "backup" | "cleanup" | "impersonation" | "restore" | "access" | "all";

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
  metadata?: Record<string, unknown>;
}

const activityConfig: Record<Exclude<ActivityType, "all">, { icon: typeof Activity; color: string; label: string }> = {
  login: { icon: LogIn, color: "text-blue-500 bg-blue-500/10", label: "Login" },
  backup: { icon: Database, color: "text-green-500 bg-green-500/10", label: "Backup" },
  cleanup: { icon: Trash2, color: "text-orange-500 bg-orange-500/10", label: "Limpeza" },
  impersonation: { icon: UserCog, color: "text-purple-500 bg-purple-500/10", label: "Impersonação" },
  restore: { icon: RotateCcw, color: "text-cyan-500 bg-cyan-500/10", label: "Restauração" },
  access: { icon: Eye, color: "text-slate-500 bg-slate-500/10", label: "Acesso" },
};

const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "completed":
    case "success":
      return "default";
    case "failed":
    case "error":
      return "destructive";
    case "in_progress":
    case "pending":
      return "secondary";
    default:
      return "outline";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "completed":
    case "success":
      return <CheckCircle className="h-3 w-3" />;
    case "failed":
    case "error":
      return <XCircle className="h-3 w-3" />;
    case "in_progress":
    case "pending":
      return <Clock className="h-3 w-3" />;
    default:
      return null;
  }
};

const getStatusLabel = (status: string): string => {
  switch (status) {
    case "completed":
      return "Concluído";
    case "success":
      return "Sucesso";
    case "failed":
    case "error":
      return "Falhou";
    case "in_progress":
      return "Em progresso";
    case "pending":
      return "Pendente";
    case "partial":
      return "Parcial";
    default:
      return status;
  }
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

      // Get all unique user IDs for profile lookup
      const allUserIds = new Set<string>();
      logins?.forEach(l => allUserIds.add(l.user_id));

      // Fetch impersonation sessions
      const { data: impersonations } = await supabase
        .from("admin_impersonation_sessions")
        .select("id, admin_user_id, impersonated_user_id, started_at, ended_at, is_active")
        .gte("started_at", dateRange.from.toISOString())
        .lte("started_at", dateRange.to.toISOString())
        .order("started_at", { ascending: false });

      impersonations?.forEach(i => {
        allUserIds.add(i.admin_user_id);
        allUserIds.add(i.impersonated_user_id);
      });

      // Fetch restore logs
      const { data: restores } = await supabase
        .from("backup_restore_logs")
        .select("id, admin_user_id, restore_type, records_restored, status, start_time, end_time, tables_restored, created_at")
        .gte("created_at", dateRange.from.toISOString())
        .lte("created_at", dateRange.to.toISOString())
        .order("created_at", { ascending: false });

      restores?.forEach(r => allUserIds.add(r.admin_user_id));

      // Fetch profile access logs
      const { data: accesses } = await supabase
        .from("profile_access_logs")
        .select("id, accessing_user_id, accessed_user_id, access_type, accessed_at")
        .gte("accessed_at", dateRange.from.toISOString())
        .lte("accessed_at", dateRange.to.toISOString())
        .order("accessed_at", { ascending: false })
        .limit(100);

      accesses?.forEach(a => {
        allUserIds.add(a.accessing_user_id);
        allUserIds.add(a.accessed_user_id);
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
          title: "Login no sistema",
          description: `${getProfileName(login.user_id)} realizou login`,
          user_name: getProfileName(login.user_id),
          user_avatar: getProfileAvatar(login.user_id),
          timestamp: login.login_time,
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
          title: isActive ? "Sessão de impersonação ativa" : "Sessão de impersonação encerrada",
          description: `${adminName} assumiu identidade de ${targetName}`,
          user_name: adminName,
          user_avatar: getProfileAvatar(imp.admin_user_id),
          target_user_name: targetName,
          target_user_avatar: getProfileAvatar(imp.impersonated_user_id),
          timestamp: imp.started_at,
          metadata: { 
            is_active: isActive, 
            duration,
            ended_at: imp.ended_at,
          },
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
            ? `${restore.records_restored || 0} registros restaurados${tablesCount > 0 ? ` • ${tablesCount} tabelas` : ""}`
            : restore.status === "failed"
              ? "Restauração falhou"
              : "Restauração em progresso",
          user_name: getProfileName(restore.admin_user_id),
          user_avatar: getProfileAvatar(restore.admin_user_id),
          timestamp: restore.created_at,
          metadata: { 
            status: restore.status,
            records_restored: restore.records_restored,
            tables_count: tablesCount,
          },
        });
      });

      // Process profile accesses
      accesses?.forEach(access => {
        const accessingName = getProfileName(access.accessing_user_id);
        const accessedName = getProfileName(access.accessed_user_id);
        allActivities.push({
          id: access.id,
          type: "access",
          title: "Perfil visualizado",
          description: `${accessingName} acessou perfil de ${accessedName}`,
          user_name: accessingName,
          user_avatar: getProfileAvatar(access.accessing_user_id),
          target_user_name: accessedName,
          target_user_avatar: getProfileAvatar(access.accessed_user_id),
          timestamp: access.accessed_at,
          metadata: { access_type: access.access_type },
        });
      });

      // Fetch backups
      const { data: backups } = await supabase
        .from("backup_jobs")
        .select("id, created_at, status, backup_type, backup_size_bytes, admin_user_id")
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
              ? "Backup falhou" 
              : "Backup em progresso",
          user_name: backup.admin_user_id ? getProfileName(backup.admin_user_id) : undefined,
          user_avatar: backup.admin_user_id ? getProfileAvatar(backup.admin_user_id) : undefined,
          timestamp: backup.created_at,
          metadata: { status: backup.status },
        });
      });

      // Fetch cleanups
      const { data: cleanups } = await supabase
        .from("database_cleanup_logs")
        .select("id, executed_at, cleanup_category, records_deleted, success, admin_user_id")
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
            : "Limpeza falhou",
          user_name: cleanup.admin_user_id ? getProfileName(cleanup.admin_user_id) : undefined,
          user_avatar: cleanup.admin_user_id ? getProfileAvatar(cleanup.admin_user_id) : undefined,
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
    if (!activities) return { total: 0, logins: 0, backups: 0, cleanups: 0, impersonations: 0, restores: 0, accesses: 0 };
    
    return {
      total: activities.length,
      logins: activities.filter(a => a.type === "login").length,
      backups: activities.filter(a => a.type === "backup").length,
      cleanups: activities.filter(a => a.type === "cleanup").length,
      impersonations: activities.filter(a => a.type === "impersonation").length,
      restores: activities.filter(a => a.type === "restore").length,
      accesses: activities.filter(a => a.type === "access").length,
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
        {/* Stats Cards - 2x3 Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            title="Total"
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
            title="Restaurações"
            value={stats.restores}
            icon={RotateCcw}
            variant="info"
            isLoading={isLoading}
          />
          <StatCard
            title="Limpezas"
            value={stats.cleanups}
            icon={Trash2}
            variant="warning"
            isLoading={isLoading}
          />
          <StatCard
            title="Impersonações"
            value={stats.impersonations}
            icon={UserCog}
            variant="default"
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
                <SelectTrigger className="w-full sm:w-[200px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as atividades</SelectItem>
                  <SelectItem value="login">Logins</SelectItem>
                  <SelectItem value="backup">Backups</SelectItem>
                  <SelectItem value="restore">Restaurações</SelectItem>
                  <SelectItem value="cleanup">Limpezas</SelectItem>
                  <SelectItem value="impersonation">Impersonações</SelectItem>
                  <SelectItem value="access">Acessos a perfis</SelectItem>
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
                      <div key={j} className="h-20 bg-muted animate-pulse rounded ml-6" />
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
                        const config = activityConfig[activity.type];
                        const Icon = config.icon;
                        const status = activity.metadata?.status as string | undefined;
                        const isActive = activity.metadata?.is_active as boolean | undefined;
                        const duration = activity.metadata?.duration as number | undefined;
                        
                        return (
                          <div 
                            key={activity.id} 
                            className="flex items-start gap-4 p-4 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
                          >
                            <div className={cn(
                              "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                              config.color
                            )}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium text-sm">{activity.title}</p>
                                    {status && (
                                      <Badge 
                                        variant={getStatusVariant(status)} 
                                        className="gap-1 text-xs"
                                      >
                                        {getStatusIcon(status)}
                                        {getStatusLabel(status)}
                                      </Badge>
                                    )}
                                    {isActive !== undefined && (
                                      <Badge 
                                        variant={isActive ? "secondary" : "outline"} 
                                        className="gap-1 text-xs"
                                      >
                                        {isActive ? <Clock className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                                        {isActive ? "Ativa" : "Encerrada"}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                                </div>
                                <Badge variant="outline" className="shrink-0">
                                  {config.label}
                                </Badge>
                              </div>
                              
                              {/* User info */}
                              <div className="flex items-center gap-3 mt-3">
                                {activity.user_name && (
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-5 w-5">
                                      <AvatarImage src={activity.user_avatar} />
                                      <AvatarFallback className="text-xs">
                                        {activity.user_name.charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs text-muted-foreground">{activity.user_name}</span>
                                  </div>
                                )}
                                
                                {/* Target user for impersonation/access */}
                                {activity.target_user_name && (
                                  <>
                                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                    <div className="flex items-center gap-2">
                                      <Avatar className="h-5 w-5">
                                        <AvatarImage src={activity.target_user_avatar} />
                                        <AvatarFallback className="text-xs">
                                          {activity.target_user_name.charAt(0)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="text-xs text-muted-foreground">{activity.target_user_name}</span>
                                    </div>
                                  </>
                                )}
                                
                                {/* Duration for impersonation */}
                                {duration !== undefined && duration !== null && (
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {duration} min
                                  </span>
                                )}
                              </div>
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
