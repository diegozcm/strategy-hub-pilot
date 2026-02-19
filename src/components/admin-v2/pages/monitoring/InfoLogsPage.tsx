
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
  Info, 
  ArrowLeft, 
  CheckCircle2,
  Database,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { format, subDays, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface InfoItem {
  id: string;
  type: 'backup' | 'restore' | 'cleanup';
  message: string;
  timestamp: Date;
  details?: string;
}

export default function InfoLogsPage() {
  const navigate = useNavigate();

  const { data: successfulBackups, isLoading: isLoadingBackups } = useQuery({
    queryKey: ['successful-backups-info'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('backup_jobs')
        .select('*')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(30);
      
      if (error) throw error;
      return data || [];
    }
  });

  const { data: successfulRestores, isLoading: isLoadingRestores } = useQuery({
    queryKey: ['successful-restores-info'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('backup_restore_logs')
        .select('*')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data || [];
    }
  });

  const { data: successfulCleanups, isLoading: isLoadingCleanups } = useQuery({
    queryKey: ['successful-cleanups-info'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('database_cleanup_logs')
        .select('*')
        .eq('success', true)
        .order('executed_at', { ascending: false })
        .limit(30);
      
      if (error) throw error;
      return data || [];
    }
  });

  const infoItems: InfoItem[] = React.useMemo(() => {
    const items: InfoItem[] = [];

    successfulBackups?.forEach(backup => {
      const sizeKB = backup.backup_size_bytes ? Math.round(backup.backup_size_bytes / 1024) : 0;
      items.push({
        id: `backup-${backup.id}`,
        type: 'backup',
        message: `Backup ${backup.backup_type} concluído com sucesso`,
        timestamp: new Date(backup.created_at),
        details: `${backup.total_records || 0} registros • ${backup.total_tables || 0} tabelas • ${sizeKB} KB`
      });
    });

    successfulRestores?.forEach(restore => {
      items.push({
        id: `restore-${restore.id}`,
        type: 'restore',
        message: `Restauração ${restore.restore_type} concluída`,
        timestamp: new Date(restore.created_at),
        details: `${restore.records_restored || 0} registros restaurados`
      });
    });

    successfulCleanups?.forEach(cleanup => {
      items.push({
        id: `cleanup-${cleanup.id}`,
        type: 'cleanup',
        message: `Limpeza de ${cleanup.cleanup_category} concluída`,
        timestamp: new Date(cleanup.executed_at),
        details: `${cleanup.records_deleted} registros removidos`
      });
    });

    return items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [successfulBackups, successfulRestores, successfulCleanups]);

  const getInfoIcon = (type: InfoItem['type']) => {
    switch (type) {
      case 'backup': return <Database className="h-5 w-5 text-blue-600" />;
      case 'restore': return <RefreshCw className="h-5 w-5 text-blue-600" />;
      case 'cleanup': return <Trash2 className="h-5 w-5 text-blue-600" />;
    }
  };

  const getInfoBadge = (type: InfoItem['type']) => {
    switch (type) {
      case 'backup': return <Badge className="bg-green-100 text-green-700">Backup</Badge>;
      case 'restore': return <Badge className="bg-purple-100 text-purple-700">Restauração</Badge>;
      case 'cleanup': return <Badge className="bg-blue-100 text-blue-700">Limpeza</Badge>;
    }
  };

  const isLoading = isLoadingBackups || isLoadingRestores || isLoadingCleanups;

  const last7Days = subDays(new Date(), 7);
  const recentBackups = successfulBackups?.filter(b => isAfter(new Date(b.created_at), last7Days)).length || 0;
  const recentCleanups = successfulCleanups?.filter(c => isAfter(new Date(c.executed_at), last7Days)).length || 0;
  const totalRecordsBackedUp = successfulBackups?.reduce((acc, b) => acc + (b.total_records || 0), 0) || 0;

  if (isLoading) {
    return (
      <AdminPageContainer
        title="Informações do Sistema"
        description="Carregando informações..."
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
      title="Informações do Sistema"
      description="Atividades concluídas e eventos informativos"
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Total de Atividades</p>
                  <p className="text-2xl font-bold">{infoItems.length}</p>
                </div>
                <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-blue-500/10">
                  <Info className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Backups (7 dias)</p>
                  <p className="text-2xl font-bold">{recentBackups}</p>
                </div>
                <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-green-500/10">
                  <Database className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Limpezas (7 dias)</p>
                  <p className="text-2xl font-bold">{recentCleanups}</p>
                </div>
                <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-blue-500/10">
                  <Trash2 className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Registros Salvos</p>
                  <p className="text-2xl font-bold">{totalRecordsBackedUp.toLocaleString()}</p>
                </div>
                <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-green-500/10">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              Atividades Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {infoItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Info className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">Nenhuma atividade registrada</p>
                <p className="text-sm">Backups, restaurações e limpezas aparecerão aqui</p>
              </div>
            ) : (
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {infoItems.map((item) => (
                    <div 
                      key={item.id} 
                      className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200"
                    >
                      {getInfoIcon(item.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getInfoBadge(item.type)}
                          <span className="text-sm text-muted-foreground">
                            {format(item.timestamp, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        <p className="font-medium text-blue-800">{item.message}</p>
                        {item.details && (
                          <p className="text-sm text-blue-600 mt-1">{item.details}</p>
                        )}
                      </div>
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Database className="h-4 w-4" />
                Backups
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {successfulBackups?.length || 0}
              </div>
              <p className="text-sm text-muted-foreground">
                Total de backups bem-sucedidos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Restaurações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {successfulRestores?.length || 0}
              </div>
              <p className="text-sm text-muted-foreground">
                Total de restaurações concluídas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Limpezas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {successfulCleanups?.length || 0}
              </div>
              <p className="text-sm text-muted-foreground">
                Total de limpezas realizadas
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminPageContainer>
  );
}
