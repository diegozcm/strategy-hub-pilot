
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AdminPageContainer } from '../../components/AdminPageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { supabase } from '@/integrations/supabase/client';
import { useClientDiagnostics } from '@/hooks/useClientDiagnostics';
import { 
  XCircle, 
  ArrowLeft,
  Code,
  Database,
  Clock,
  Server,
  CheckCircle2
} from 'lucide-react';
import { format, subDays, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function CriticalErrorsPage() {
  const navigate = useNavigate();
  const { recentErrors } = useClientDiagnostics();

  const { data: failedBackups, isLoading: isLoadingBackups } = useQuery({
    queryKey: ['failed-backups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('backup_jobs')
        .select('*')
        .eq('status', 'failed')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data || [];
    }
  });

  const { data: failedRestores, isLoading: isLoadingRestores } = useQuery({
    queryKey: ['failed-restores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('backup_restore_logs')
        .select('*')
        .eq('status', 'failed')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data || [];
    }
  });

  const totalErrors = recentErrors.length + (failedBackups?.length || 0) + (failedRestores?.length || 0);

  const isLoading = isLoadingBackups || isLoadingRestores;

  if (isLoading) {
    return (
      <AdminPageContainer
        title="Erros Críticos"
        description="Carregando erros..."
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
      title="Erros Críticos"
      description="Erros que requerem atenção imediata"
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
                  <p className="text-sm font-medium text-muted-foreground">Total de Erros</p>
                  <p className="text-2xl font-bold">{totalErrors}</p>
                </div>
                <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-destructive/10">
                  <XCircle className="h-5 w-5 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Erros JavaScript</p>
                  <p className="text-2xl font-bold">{recentErrors.length}</p>
                </div>
                <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-destructive/10">
                  <Code className="h-5 w-5 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Backups Falhos</p>
                  <p className="text-2xl font-bold">{failedBackups?.length || 0}</p>
                </div>
                <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-destructive/10">
                  <Database className="h-5 w-5 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Erros de Cliente (JavaScript)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentErrors.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
                <p className="font-medium">Nenhum erro JavaScript detectado</p>
                <p className="text-sm">O frontend está funcionando normalmente</p>
              </div>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {recentErrors.map((error, index) => (
                  <AccordionItem key={index} value={`error-${index}`}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3 text-left">
                        <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                        <div>
                          <p className="font-medium truncate max-w-md">{error.message}</p>
                          <p className="text-sm text-muted-foreground">{error.time}</p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pl-8 space-y-2">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm font-mono">{error.message}</p>
                        </div>
                        {error.stack && (
                          <div className="p-3 bg-red-50 rounded-lg">
                            <p className="text-xs font-mono text-red-700 whitespace-pre-wrap">
                              {error.stack}
                            </p>
                          </div>
                        )}
                        {error.source && (
                          <p className="text-sm text-muted-foreground">Fonte: {error.source}</p>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Backups com Falha
            </CardTitle>
          </CardHeader>
          <CardContent>
            {failedBackups?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
                <p className="font-medium">Nenhum backup falhou</p>
                <p className="text-sm">Todos os backups foram concluídos com sucesso</p>
              </div>
            ) : (
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {failedBackups?.map((backup) => (
                    <div 
                      key={backup.id} 
                      className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-200"
                    >
                      <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="destructive">{backup.backup_type}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(backup.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        <p className="text-red-800 font-medium">
                          {backup.error_message || 'Erro desconhecido durante o backup'}
                        </p>
                        {backup.tables_included && (
                          <p className="text-sm text-red-600 mt-1">
                            Tabelas: {backup.tables_included.length} • 
                            Processadas: {backup.processed_tables || 0}/{backup.total_tables || 0}
                          </p>
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
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Restaurações com Falha
            </CardTitle>
          </CardHeader>
          <CardContent>
            {failedRestores?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
                <p className="font-medium">Nenhuma restauração falhou</p>
                <p className="text-sm">Todas as restaurações foram concluídas com sucesso</p>
              </div>
            ) : (
              <ScrollArea className="h-48">
                <div className="space-y-3">
                  {failedRestores?.map((restore) => (
                    <div 
                      key={restore.id} 
                      className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-200"
                    >
                      <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="destructive">{restore.restore_type}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(restore.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        <p className="text-red-800 font-medium">
                          {restore.error_message || 'Erro desconhecido durante a restauração'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminPageContainer>
  );
}
