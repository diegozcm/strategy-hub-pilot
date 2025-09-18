import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import { SystemHealthStatus } from '@/components/ui/SystemHealthStatus';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { useClientDiagnostics } from '@/hooks/useClientDiagnostics';
import { useToast } from '@/hooks/use-toast';
import { useOperationState } from '@/hooks/useOperationState';
import { useHealthMonitor } from '@/hooks/useHealthMonitor';
import { Monitor, Shield, Activity, RefreshCw, CheckCircle, AlertTriangle, FileText, Trash2 } from 'lucide-react';

export const MonitoringPage: React.FC = () => {
  const { operations, getFailedOperations } = useOperationState();
  const { healthStatus, checkPageHealth } = useHealthMonitor();
  const { toast } = useToast();
  const { 
    statusChecks, recentErrors, perfMetrics, lastChecked,
    autoRefresh, toggleAutoRefresh, checkNow, exportLogs, clearLocalCache
  } = useClientDiagnostics();

  const activeOperations = Object.entries(operations).filter(([, op]) => op.loading);
  const failedOperations = Object.values(operations).filter((op) => op.error).length;
  const totalOperations = Object.keys(operations).length;

  const handleSystemCheck = () => {
    window.location.reload();
  };

  const onVerify = () => {
    checkNow();
    checkPageHealth();
  };

  const handleClearCache = () => {
    clearLocalCache();
    toast({ title: 'Cache limpo', description: 'Storage local e tokens foram limpos.' });
  };

  return (
    <div className="space-y-6">
      {/* Header unificado */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Monitor className="h-5 w-5" />
                <span>Monitoramento do Sistema</span>
              </CardTitle>
              <CardDescription>
                Monitore a saúde, operações e logs do sistema em tempo real
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={checkPageHealth}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Verificar Saúde
              </Button>
              <Button onClick={handleSystemCheck}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Recarregar Sistema
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Métricas principais */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="text-center p-4">
          <div className="flex items-center justify-center mb-2">
            <Activity className="h-6 w-6 text-green-500" />
          </div>
          <div className="text-2xl font-bold">Online</div>
          <div className="text-sm text-muted-foreground">Status do Sistema</div>
        </Card>

        <Card className="text-center p-4">
          <div className="flex items-center justify-center mb-2">
            <Monitor className="h-6 w-6 text-blue-500" />
          </div>
          <div className="text-2xl font-bold">{totalOperations}</div>
          <div className="text-sm text-muted-foreground">Operações Totais</div>
        </Card>

        <Card className="text-center p-4">
          <div className="flex items-center justify-center mb-2">
            <Activity className="h-6 w-6 text-yellow-500" />
          </div>
          <div className="text-2xl font-bold">{activeOperations.length}</div>
          <div className="text-sm text-muted-foreground">Operações Ativas</div>
        </Card>

        <Card className="text-center p-4">
          <div className="flex items-center justify-center mb-2">
            <AlertTriangle className="h-6 w-6 text-red-500" />
          </div>
          <div className="text-2xl font-bold">{failedOperations}</div>
          <div className="text-sm text-muted-foreground">Operações Falharam</div>
        </Card>
      </div>

      {/* Conteúdo principal seguindo padrão da tela de Usuários */}
      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Status do Sistema */}
          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <CardTitle>Status do Sistema</CardTitle>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Auto Refresh</span>
                    <Switch checked={autoRefresh} onCheckedChange={toggleAutoRefresh} />
                  </div>
                  <Button variant="outline" onClick={onVerify}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Verificar Saúde
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant={statusChecks.react && statusChecks.dom && statusChecks.localStorage && statusChecks.noRecentErrors && statusChecks.memoryUsage ? 'default' : 'destructive'}>
                  {statusChecks.react && statusChecks.dom && statusChecks.localStorage && statusChecks.noRecentErrors && statusChecks.memoryUsage ? 'Saudável' : 'Atenção'}
                </Badge>
                <div className="text-xs text-muted-foreground">{lastChecked.toLocaleString()}</div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {([
                  { key: 'react', label: 'react', ok: statusChecks.react },
                  { key: 'dom', label: 'dom', ok: statusChecks.dom },
                  { key: 'localStorage', label: 'localStorage', ok: statusChecks.localStorage },
                  { key: 'noRecentErrors', label: 'noRecentErrors', ok: statusChecks.noRecentErrors },
                  { key: 'memoryUsage', label: 'memoryUsage', ok: statusChecks.memoryUsage },
                ] as const).map((item) => (
                  <div key={item.key} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                    <span className="text-sm">{item.label}</span>
                    <Badge variant={item.ok ? 'secondary' : 'destructive'} className="text-xs">
                      {item.ok ? 'OK' : 'Falha'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Grid secundária (Erros / Performance) */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Erros Recentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48">
                  {recentErrors.length === 0 ? (
                    <div className="text-sm text-muted-foreground">Nenhum erro recente encontrado</div>
                  ) : (
                    <div className="space-y-2">
                      {recentErrors.slice(0, 10).map((e, idx) => (
                        <div key={idx} className="text-xs">
                          <div className="font-medium text-foreground">{e.message}</div>
                          <div className="text-muted-foreground">{e.source || ''} · {e.time}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Métricas de Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48">
                  {perfMetrics.length === 0 ? (
                    <div className="text-sm text-muted-foreground">Sem métricas coletadas ainda</div>
                  ) : (
                    <div className="space-y-2">
                      {perfMetrics.map((m, idx) => (
                        <div key={idx} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                          <span>{m.name}</span>
                          <span className="font-semibold">{m.value}ms</span>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Ferramentas de Diagnóstico */}
          <Card>
            <CardHeader>
              <CardTitle>Ferramentas de Diagnóstico</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={exportLogs}>
                  <FileText className="h-4 w-4 mr-2" />
                  Exportar Logs
                </Button>
                <Button variant="outline" onClick={handleSystemCheck}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Recarregar Aplicação
                </Button>
                <Button variant="destructive" onClick={handleClearCache}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpar Cache Local
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Detalhamento existente */}
          <SystemHealthStatus />
        </CardContent>
      </Card>
    </div>
  );
};