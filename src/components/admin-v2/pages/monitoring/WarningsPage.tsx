
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AdminPageContainer } from '../../components/AdminPageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { 
  AlertTriangle, 
  ArrowLeft, 
  Database,
  Timer,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Warning {
  id: string;
  type: 'backup-old' | 'cleanup' | 'slow-operation';
  message: string;
  timestamp: Date;
  details?: string;
}

export default function WarningsPage() {
  const navigate = useNavigate();

  const { data: backupJobs, isLoading: isLoadingBackups } = useQuery({
    queryKey: ['backup-jobs-warnings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('backup_jobs')
        .select('*')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error) throw error;
      return data || [];
    }
  });

  const { data: cleanupLogs, isLoading: isLoadingCleanup } = useQuery({
    queryKey: ['cleanup-logs-warnings'],
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

  const { data: pendingBackups, isLoading: isLoadingPending } = useQuery({
    queryKey: ['pending-backups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('backup_jobs')
        .select('*')
        .in('status', ['pending', 'running'])
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  const warnings: Warning[] = React.useMemo(() => {
    const warningsList: Warning[] = [];

    if (backupJobs && backupJobs.length > 0) {
      const lastBackup = backupJobs[0];
      const lastBackupDate = new Date(lastBackup.created_at);
      const daysSinceBackup = differenceInDays(new Date(), lastBackupDate);
      
      if (daysSinceBackup > 7) {
        warningsList.push({
          id: 'backup-old',
          type: 'backup-old',
          message: `Último backup realizado há ${daysSinceBackup} dias`,
          timestamp: lastBackupDate,
          details: 'Recomendamos realizar backups regulares para proteção dos dados'
        });
      }
    } else if (backupJobs && backupJobs.length === 0) {
      warningsList.push({
        id: 'no-backup',
        type: 'backup-old',
        message: 'Nenhum backup bem-sucedido encontrado',
        timestamp: new Date(),
        details: 'Execute um backup completo o mais rápido possível'
      });
    }

    cleanupLogs?.filter(log => !log.success).forEach(log => {
      warningsList.push({
        id: `cleanup-fail-${log.id}`,
        type: 'cleanup',
        message: `Falha na limpeza: ${log.cleanup_category}`,
        timestamp: new Date(log.executed_at),
        details: log.error_details || 'Erro desconhecido'
      });
    });

    pendingBackups?.forEach(backup => {
      const startTime = backup.start_time ? new Date(backup.start_time) : new Date(backup.created_at);
      const runningMinutes = Math.floor((Date.now() - startTime.getTime()) / 60000);
      
      if (runningMinutes > 30) {
        warningsList.push({
          id: `long-running-${backup.id}`,
          type: 'slow-operation',
          message: `Backup em execução há ${runningMinutes} minutos`,
          timestamp: startTime,
          details: `Tipo: ${backup.backup_type} • Status: ${backup.status}`
        });
      }
    });

    cleanupLogs?.filter(log => log.success && log.records_deleted > 100).forEach(log => {
      warningsList.push({
        id: `large-cleanup-${log.id}`,
        type: 'cleanup',
        message: `Limpeza grande: ${log.records_deleted} registros de ${log.cleanup_category}`,
        timestamp: new Date(log.executed_at),
        details: 'Operação de limpeza com alto volume de exclusões'
      });
    });

    return warningsList.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [backupJobs, cleanupLogs, pendingBackups]);

  const getWarningIcon = (type: Warning['type']) => {
    switch (type) {
      case 'backup-old': return <Database className="h-5 w-5 text-yellow-600" />;
      case 'cleanup': return <Trash2 className="h-5 w-5 text-yellow-600" />;
      case 'slow-operation': return <Timer className="h-5 w-5 text-yellow-600" />;
    }
  };

  const isLoading = isLoadingBackups || isLoadingCleanup || isLoadingPending;

  const backupWarnings = warnings.filter(w => w.type === 'backup-old');
  const slowWarnings = warnings.filter(w => w.type === 'slow-operation');

  if (isLoading) {
    return (
      <AdminPageContainer
        title="Avisos do Sistema"
        description="Carregando avisos..."
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
      title="Avisos do Sistema"
      description="Alertas que requerem atenção mas não são críticos"
    >
      <div className="space-y-6">
        {/* Header with back button */}
        <div className="flex justify-between items-center">
          <Button variant="outline" size="sm" onClick={() => navigate('/app/admin/monitoring/alerts')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Total de Avisos</p>
                  <p className="text-2xl font-bold">{warnings.length}</p>
                </div>
                <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-yellow-500/10">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Avisos de Backup</p>
                  <p className="text-2xl font-bold">{backupWarnings.length}</p>
                </div>
                <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-yellow-500/10">
                  <Database className="h-5 w-5 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Operações Lentas</p>
                  <p className="text-2xl font-bold">{slowWarnings.length}</p>
                </div>
                <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-yellow-500/10">
                  <Timer className="h-5 w-5 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Todos os Avisos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {warnings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
                <p className="font-medium text-green-700">Nenhum aviso ativo</p>
                <p className="text-sm">O sistema está funcionando dentro dos parâmetros normais</p>
              </div>
            ) : (
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {warnings.map((warning) => (
                    <div 
                      key={warning.id} 
                      className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200"
                    >
                      {getWarningIcon(warning.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
                            {warning.type === 'backup-old' && 'Backup'}
                            {warning.type === 'cleanup' && 'Limpeza'}
                            {warning.type === 'slow-operation' && 'Performance'}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {format(warning.timestamp, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        <p className="font-medium text-yellow-800">{warning.message}</p>
                        {warning.details && (
                          <p className="text-sm text-yellow-600 mt-1">{warning.details}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recomendações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <Database className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-800">Backups Regulares</p>
                  <p className="text-sm text-blue-600">
                    Configure backups automáticos diários ou semanais para garantir a segurança dos dados
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <Trash2 className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-800">Limpeza de Dados</p>
                  <p className="text-sm text-blue-600">
                    Execute limpezas periódicas para manter o banco de dados otimizado
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <Timer className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-800">Monitoramento</p>
                  <p className="text-sm text-blue-600">
                    Verifique regularmente esta página para identificar problemas antes que se tornem críticos
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminPageContainer>
  );
}
