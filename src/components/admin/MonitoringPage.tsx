import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SystemHealthStatus } from '@/components/ui/SystemHealthStatus';
import { OperationFeedback } from '@/components/ui/OperationFeedback';
import { useOperationState } from '@/hooks/useOperationState';
import { Monitor, Shield, Activity } from 'lucide-react';

export const MonitoringPage: React.FC = () => {
  const { operations, retryOperation } = useOperationState();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Monitor className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Monitoramento do Sistema</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* System Health Status */}
        <div className="space-y-4">
          <SystemHealthStatus />
        </div>

        {/* Operation Feedback */}
        <div className="space-y-4">
          <OperationFeedback 
            operations={Object.entries(operations).map(([id, op]) => ({ id, ...op }))} 
            onRetry={retryOperation}
          />
        </div>
      </div>

      {/* System Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Visão Geral do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 bg-muted/50 rounded">
              <Activity className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">Sistema Online</div>
              <div className="text-sm text-muted-foreground">Funcionamento Normal</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded">
              <Monitor className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">{Object.keys(operations).length}</div>
              <div className="text-sm text-muted-foreground">Operações Monitoradas</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded">
              <Shield className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">Protegido</div>
              <div className="text-sm text-muted-foreground">Error Boundaries Ativas</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};