
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminPageContainer } from '../../components/AdminPageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { supabase } from '@/integrations/supabase/client';
import { 
  Database, 
  RefreshCw,
  HardDrive,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function DatabaseLogsPage() {
  const [activeTab, setActiveTab] = useState('backups');

  const { data: backupJobs, isLoading: isLoadingBackups, refetch: refetchBackups } = useQuery({
    queryKey: ['backup-jobs-db-logs'],
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

  const { data: restoreLogs, isLoading: isLoadingRestores } = useQuery({
    queryKey: ['restore-logs-db'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('backup_restore_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data || [];
    }
  });

  const { data: cleanupLogs, isLoading: isLoadingCleanups } = useQuery({
    queryKey: ['cleanup-logs-db'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('database_cleanup_logs')
        .select('*')
        .order('executed_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data || [];
    }
  });

  const stats = React.useMemo(() => {
    const totalBackups = backupJobs?.length || 0;
    const successfulBackups = backupJobs?.filter(b => b.status === 'completed').length || 0;
    const successRate = totalBackups > 0 ? Math.round((successfulBackups / totalBackups) * 100) : 0;
    const totalRecords = backupJobs?.filter(b => b.status === 'completed')
      .reduce((acc, b) => acc + (b.total_records || 0), 0) || 0;
    const totalSizeBytes = backupJobs?.filter(b => b.status === 'completed')
      .reduce((acc, b) => acc + (b.backup_size_bytes || 0), 0) || 0;
    const totalSizeMB = (totalSizeBytes / (1024 * 1024)).toFixed(2);

    return {
      totalBackups,
      successRate,
      totalRecords,
      totalSizeMB
    };
  }, [backupJobs]);

  const formatBytes = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDuration = (start: string | null, end: string | null) => {
    if (!start || !end) return 'N/A';
    const duration = new Date(end).getTime() - new Date(start).getTime();
    const seconds = Math.floor(duration / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700">Concluído</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-700">Falhou</Badge>;
      case 'running':
        return <Badge className="bg-blue-100 text-blue-700">Executando</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700">Pendente</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const isLoading = isLoadingBackups || isLoadingRestores || isLoadingCleanups;

  if (isLoading) {
    return (
      <AdminPageContainer
        title="Logs de Banco de Dados"
        description="Carregando logs..."
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
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
      title="Logs de Banco de Dados"
      description="Atividades de backup, restauração e limpeza"
    >
      <div className="space-y-6">
        {/* Header with action button */}
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => refetchBackups()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Total de Backups</p>
                  <p className="text-2xl font-bold">{stats.totalBackups}</p>
                </div>
                <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-primary/10">
                  <Database className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Taxa de Sucesso</p>
                  <p className="text-2xl font-bold">{stats.successRate}%</p>
                  <p className={`text-xs font-medium ${stats.successRate >= 90 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.successRate >= 90 ? 'Ótimo' : 'Atenção'}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-green-500/10">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Registros Salvos</p>
                  <p className="text-2xl font-bold">{stats.totalRecords.toLocaleString()}</p>
                </div>
                <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Tamanho Total</p>
                  <p className="text-2xl font-bold">{stats.totalSizeMB} MB</p>
                </div>
                <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-primary/10">
                  <HardDrive className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="backups" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Backups ({backupJobs?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="restores" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Restaurações ({restoreLogs?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="cleanups" className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Limpezas ({cleanupLogs?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="backups">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Histórico de Backups
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <Accordion type="single" collapsible className="w-full">
                    {backupJobs?.map((backup) => (
                      <AccordionItem key={backup.id} value={backup.id}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-4 text-left w-full pr-4">
                            {backup.status === 'completed' ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                            ) : backup.status === 'failed' ? (
                              <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                            ) : (
                              <Clock className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{backup.backup_type}</Badge>
                                {getStatusBadge(backup.status)}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {format(new Date(backup.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </p>
                            </div>
                            <div className="text-right text-sm">
                              <p className="font-medium">{backup.total_records?.toLocaleString() || 0} registros</p>
                              <p className="text-muted-foreground">{formatBytes(backup.backup_size_bytes)}</p>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="pl-9 space-y-3">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Tabelas</p>
                                <p className="font-medium">{backup.total_tables || 0}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Processadas</p>
                                <p className="font-medium">{backup.processed_tables || 0}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Compressão</p>
                                <p className="font-medium">{backup.compression_ratio ? `${(backup.compression_ratio * 100).toFixed(0)}%` : 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Duração</p>
                                <p className="font-medium">{formatDuration(backup.start_time, backup.end_time)}</p>
                              </div>
                            </div>
                            {backup.error_message && (
                              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                                <p className="text-sm text-red-700 font-medium">Erro:</p>
                                <p className="text-sm text-red-600">{backup.error_message}</p>
                              </div>
                            )}
                            {backup.notes && (
                              <div className="p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm text-muted-foreground">{backup.notes}</p>
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="restores">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Histórico de Restaurações
                </CardTitle>
              </CardHeader>
              <CardContent>
                {restoreLogs?.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <RefreshCw className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">Nenhuma restauração realizada</p>
                    <p className="text-sm">Restaurações de backup aparecerão aqui</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Registros</TableHead>
                          <TableHead>Duração</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {restoreLogs?.map((restore) => (
                          <TableRow key={restore.id}>
                            <TableCell>
                              {format(new Date(restore.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{restore.restore_type}</Badge>
                            </TableCell>
                            <TableCell>{restore.records_restored?.toLocaleString() || 0}</TableCell>
                            <TableCell>{formatDuration(restore.start_time, restore.end_time)}</TableCell>
                            <TableCell>{getStatusBadge(restore.status)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cleanups">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trash2 className="h-5 w-5" />
                  Histórico de Limpezas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cleanupLogs?.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Trash2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">Nenhuma limpeza realizada</p>
                    <p className="text-sm">Operações de limpeza aparecerão aqui</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Categoria</TableHead>
                          <TableHead>Registros Removidos</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Notas</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cleanupLogs?.map((cleanup) => (
                          <TableRow key={cleanup.id}>
                            <TableCell>
                              {format(new Date(cleanup.executed_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{cleanup.cleanup_category}</Badge>
                            </TableCell>
                            <TableCell>{cleanup.records_deleted.toLocaleString()}</TableCell>
                            <TableCell>
                              {cleanup.success ? (
                                <Badge className="bg-green-100 text-green-700">Sucesso</Badge>
                              ) : (
                                <Badge className="bg-red-100 text-red-700">Falhou</Badge>
                              )}
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {cleanup.notes || cleanup.error_details || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminPageContainer>
  );
}
