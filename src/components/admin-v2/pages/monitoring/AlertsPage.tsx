
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AdminPageContainer } from '../../components/AdminPageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useClientDiagnostics } from '@/hooks/useClientDiagnostics';
import { 
  Bell, 
  AlertTriangle, 
  Info, 
  ChevronRight,
  XCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { format, subDays, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AlertItem {
  id: string;
  type: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: Date;
  source: string;
}

export default function AlertsPage() {
  const navigate = useNavigate();
  const { diagnostics } = useClientDiagnostics();

  const { data: backupJobs, isLoading: isLoadingBackups } = useQuery({
    queryKey: ['backup-jobs-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('backup_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data || [];
    }
  });

  const { data: cleanupLogs, isLoading: isLoadingCleanup } = useQuery({
    queryKey: ['cleanup-logs-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('database_cleanup_logs')
        .select('*')
        .order('executed_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data || [];
    }
  });

  const allAlerts: AlertItem[] = React.useMemo(() => {
    const alerts: AlertItem[] = [];

    diagnostics.recentErrors.forEach((error, index) => {
      alerts.push({
        id: `error-${index}`,
        type: 'critical',
        message: error.message,
        timestamp: new Date(error.timestamp),
        source: 'Cliente JavaScript'
      });
    });

    backupJobs?.filter(job => job.status === 'failed').forEach(job => {
      alerts.push({
        id: `backup-fail-${job.id}`,
        type: 'critical',
        message: job.error_message || 'Falha no backup',
        timestamp: new Date(job.created_at),
        source: 'Sistema de Backup'
      });
    });

    backupJobs?.filter(job => job.status === 'completed').forEach(job => {
      alerts.push({
        id: `backup-success-${job.id}`,
        type: 'info',
        message: `Backup ${job.backup_type} concluído: ${job.total_records || 0} registros`,
        timestamp: new Date(job.created_at),
        source: 'Sistema de Backup'
      });
    });

    cleanupLogs?.forEach(log => {
      if (log.success) {
        alerts.push({
          id: `cleanup-${log.id}`,
          type: 'info',
          message: `Limpeza ${log.cleanup_category}: ${log.records_deleted} registros removidos`,
          timestamp: new Date(log.executed_at),
          source: 'Limpeza de Dados'
        });
      } else {
        alerts.push({
          id: `cleanup-fail-${log.id}`,
          type: 'warning',
          message: `Falha na limpeza ${log.cleanup_category}: ${log.error_details || 'Erro desconhecido'}`,
          timestamp: new Date(log.executed_at),
          source: 'Limpeza de Dados'
        });
      }
    });

    return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [diagnostics.recentErrors, backupJobs, cleanupLogs]);

  const recentAlerts = allAlerts.filter(alert => 
    isAfter(alert.timestamp, subDays(new Date(), 1))
  );

  const criticalCount = allAlerts.filter(a => a.type === 'critical').length;
  const warningCount = allAlerts.filter(a => a.type === 'warning').length;
  const infoCount = allAlerts.filter(a => a.type === 'info').length;

  const getAlertIcon = (type: 'critical' | 'warning' | 'info') => {
    switch (type) {
      case 'critical': return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'info': return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getAlertBg = (type: 'critical' | 'warning' | 'info') => {
    switch (type) {
      case 'critical': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'info': return 'bg-blue-50 border-blue-200';
    }
  };

  const isLoading = isLoadingBackups || isLoadingCleanup;

  if (isLoading) {
    return (
      <AdminPageContainer
        title="Central de Alertas"
        description="Carregando alertas..."
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      </AdminPageContainer>
    );
  }

  return (
    <AdminPageContainer
      title="Central de Alertas"
      description="Visão consolidada de erros, avisos e informações do sistema"
    >
      <div className="space-y-6">
        {/* Cards de Contagem */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card 
            className="bg-red-50 border-red-200 cursor-pointer hover:bg-red-100 transition-colors"
            onClick={() => navigate('/app/admin-v2/monitoring/alerts/critical')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 font-medium">Críticos</p>
                  <p className="text-4xl font-bold text-red-700">{criticalCount}</p>
                </div>
                <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-yellow-50 border-yellow-200 cursor-pointer hover:bg-yellow-100 transition-colors"
            onClick={() => navigate('/app/admin-v2/monitoring/alerts/warnings')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600 font-medium">Avisos</p>
                  <p className="text-4xl font-bold text-yellow-700">{warningCount}</p>
                </div>
                <div className="h-16 w-16 bg-yellow-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-8 w-8 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-blue-50 border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors"
            onClick={() => navigate('/app/admin-v2/monitoring/alerts/info')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Informações</p>
                  <p className="text-4xl font-bold text-blue-700">{infoCount}</p>
                </div>
                <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Info className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alertas Recentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Alertas Recentes (últimas 24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentAlerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
                <p className="font-medium">Nenhum alerta nas últimas 24 horas</p>
                <p className="text-sm">O sistema está funcionando normalmente</p>
              </div>
            ) : (
              <ScrollArea className="h-80">
                <div className="space-y-3">
                  {recentAlerts.slice(0, 20).map((alert) => (
                    <div 
                      key={alert.id} 
                      className={`flex items-start gap-3 p-3 rounded-lg border ${getAlertBg(alert.type)}`}
                    >
                      {getAlertIcon(alert.type)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{alert.message}</p>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{format(alert.timestamp, "HH:mm", { locale: ptBR })}</span>
                          <span>•</span>
                          <span>{alert.source}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Links Rápidos */}
        <Card>
          <CardHeader>
            <CardTitle>Acesso Rápido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="h-auto py-4 justify-between"
                onClick={() => navigate('/app/admin-v2/monitoring/alerts/critical')}
              >
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span>Ver Erros Críticos</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </Button>

              <Button 
                variant="outline" 
                className="h-auto py-4 justify-between"
                onClick={() => navigate('/app/admin-v2/monitoring/alerts/warnings')}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <span>Ver Avisos</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </Button>

              <Button 
                variant="outline" 
                className="h-auto py-4 justify-between"
                onClick={() => navigate('/app/admin-v2/monitoring/alerts/info')}
              >
                <div className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-600" />
                  <span>Ver Informações</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminPageContainer>
  );
}
