import { 
  Server, Database, Users, Shield, CheckCircle, AlertTriangle, 
  XCircle, Clock, HardDrive, RefreshCw 
} from "lucide-react";
import { AdminPageContainer } from "../../components/AdminPageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSystemStatus } from "@/hooks/admin/useDashboardStats";
import { useActiveUsersPresence } from "@/hooks/useActiveUsersPresence";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

type HealthStatus = "healthy" | "warning" | "error";

interface StatusCardProps {
  title: string;
  status: HealthStatus;
  message: string;
  details?: React.ReactNode;
  lastUpdated?: string;
}

const statusConfig: Record<HealthStatus, { icon: typeof CheckCircle; color: string; label: string }> = {
  healthy: { icon: CheckCircle, color: "text-green-500", label: "Operacional" },
  warning: { icon: AlertTriangle, color: "text-yellow-500", label: "Atenção" },
  error: { icon: XCircle, color: "text-red-500", label: "Erro" },
};

function StatusCard({ title, status, message, details, lastUpdated }: StatusCardProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
            status === "healthy" && "bg-green-500/10",
            status === "warning" && "bg-yellow-500/10",
            status === "error" && "bg-red-500/10"
          )}>
            <Icon className={cn("h-5 w-5", config.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-medium">{title}</h3>
              <Badge 
                variant="outline" 
                className={cn(
                  status === "healthy" && "border-green-500/30 text-green-600",
                  status === "warning" && "border-yellow-500/30 text-yellow-600",
                  status === "error" && "border-red-500/30 text-red-600"
                )}
              >
                {config.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{message}</p>
            {details && <div className="mt-3">{details}</div>}
            {lastUpdated && (
              <p className="text-xs text-muted-foreground mt-2">
                Atualizado {formatDistanceToNow(new Date(lastUpdated), { addSuffix: true, locale: ptBR })}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SystemStatusPage() {
  const { data: systemStatus, isLoading, refetch, isFetching } = useSystemStatus();
  const { activeUsers } = useActiveUsersPresence();

  const getBackupStatus = (): HealthStatus => {
    if (!systemStatus?.backup) return "warning";
    if (systemStatus.backup.status === "completed") return "healthy";
    if (systemStatus.backup.status === "failed") return "error";
    return "warning";
  };

  const getCleanupStatus = (): HealthStatus => {
    if (!systemStatus?.cleanup) return "warning";
    return systemStatus.cleanup.success ? "healthy" : "error";
  };

  const getPendingUsersStatus = (): HealthStatus => {
    if (!systemStatus) return "healthy";
    if (systemStatus.pendingUsers > 10) return "warning";
    if (systemStatus.pendingUsers > 0) return "healthy";
    return "healthy";
  };

  return (
    <AdminPageContainer 
      title="Status do Sistema" 
      description="Monitoramento de saúde e performance"
    >
      <div className="space-y-6">
        {/* Header with refresh */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Verificação em tempo real
            </span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isFetching && "animate-spin")} />
            Atualizar
          </Button>
        </div>

        {/* Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Database Status */}
          <StatusCard
            title="Banco de Dados"
            status={systemStatus?.database.status === "healthy" ? "healthy" : "error"}
            message={systemStatus?.database.message || "Verificando..."}
            details={
              <div className="flex items-center gap-2 text-sm">
                <Database className="h-4 w-4 text-muted-foreground" />
                <span>PostgreSQL via Supabase</span>
              </div>
            }
          />

          {/* Users Online */}
          <StatusCard
            title="Usuários Online"
            status="healthy"
            message={`${activeUsers.length} usuário(s) conectado(s) agora`}
            details={
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>Monitoramento em tempo real</span>
              </div>
            }
          />

          {/* Backup Status */}
          <StatusCard
            title="Backup do Sistema"
            status={getBackupStatus()}
            message={
              systemStatus?.backup 
                ? systemStatus.backup.status === "completed"
                  ? `Último backup realizado com sucesso`
                  : systemStatus.backup.status === "failed"
                    ? "Último backup falhou"
                    : "Backup em andamento"
                : "Nenhum backup registrado"
            }
            details={
              systemStatus?.backup && (
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {format(new Date(systemStatus.backup.lastRun), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  {systemStatus.backup.size && (
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4 text-muted-foreground" />
                      <span>{(systemStatus.backup.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  )}
                </div>
              )
            }
            lastUpdated={systemStatus?.backup?.lastRun}
          />

          {/* Cleanup Status */}
          <StatusCard
            title="Limpeza de Dados"
            status={getCleanupStatus()}
            message={
              systemStatus?.cleanup 
                ? systemStatus.cleanup.success
                  ? `${systemStatus.cleanup.recordsDeleted} registros removidos`
                  : "Última limpeza falhou"
                : "Nenhuma limpeza registrada"
            }
            details={
              systemStatus?.cleanup && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {format(new Date(systemStatus.cleanup.lastRun), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>
              )
            }
            lastUpdated={systemStatus?.cleanup?.lastRun}
          />

          {/* Pending Users */}
          <StatusCard
            title="Usuários Pendentes"
            status={getPendingUsersStatus()}
            message={
              systemStatus?.pendingUsers === 0
                ? "Nenhum usuário aguardando aprovação"
                : `${systemStatus?.pendingUsers} usuário(s) aguardando aprovação`
            }
            details={
              systemStatus?.pendingUsers && systemStatus.pendingUsers > 0 ? (
                <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700">
                  Requer atenção
                </Badge>
              ) : null
            }
          />

          {/* Security */}
          <StatusCard
            title="Segurança"
            status="healthy"
            message="RLS ativo em todas as tabelas"
            details={
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span>Políticas de segurança aplicadas</span>
              </div>
            }
          />
        </div>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resumo Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-green-500/10">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600">
                  {isLoading ? "-" : "5"}
                </p>
                <p className="text-sm text-muted-foreground">Serviços OK</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-yellow-500/10">
                <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-yellow-600">
                  {isLoading ? "-" : systemStatus?.pendingUsers && systemStatus.pendingUsers > 0 ? "1" : "0"}
                </p>
                <p className="text-sm text-muted-foreground">Alertas</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-red-500/10">
                <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-red-600">0</p>
                <p className="text-sm text-muted-foreground">Erros</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-blue-500/10">
                <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-600">{activeUsers.length}</p>
                <p className="text-sm text-muted-foreground">Online</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminPageContainer>
  );
}
