import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { SystemHealthStatus } from '@/components/ui/SystemHealthStatus';
import { OperationFeedback } from '@/components/ui/OperationFeedback';
import { useOperationState } from '@/hooks/useOperationState';
import { useHealthMonitor } from '@/hooks/useHealthMonitor';
import { Monitor, Shield, Activity, RefreshCw, CheckCircle, AlertTriangle, FileText } from 'lucide-react';

export const MonitoringPage: React.FC = () => {
  const { operations, retryOperation, getFailedOperations } = useOperationState();
  const { healthStatus, checkPageHealth } = useHealthMonitor();

  const activeOperations = Object.entries(operations).filter(([, op]) => op.loading);
  const failedOperations = getFailedOperations();
  const totalOperations = Object.keys(operations).length;

  const handleSystemCheck = () => {
    checkPageHealth();
    window.location.reload();
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
          <div className="text-2xl font-bold">{failedOperations.length}</div>
          <div className="text-sm text-muted-foreground">Operações Falharam</div>
        </Card>
      </div>

      {/* Abas principais */}
      <Card>
        <CardContent className="p-6">
          <Tabs defaultValue="status" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="status">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span className="hidden sm:inline">Status</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="operations">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  <span className="hidden sm:inline">Operações</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="logs">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Logs</span>
                </div>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="status" className="space-y-6">
              <SystemHealthStatus />
            </TabsContent>

            <TabsContent value="operations" className="space-y-6">
              <OperationFeedback 
                operations={Object.entries(operations).map(([id, op]) => ({ id, ...op }))} 
                onRetry={retryOperation}
              />
            </TabsContent>

            <TabsContent value="logs" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Logs do Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4" />
                      <p>Sistema de logs em desenvolvimento</p>
                      <p className="text-sm">Em breve: histórico de eventos, alertas e problemas detectados</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};