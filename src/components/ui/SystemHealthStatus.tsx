import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  Activity, 
  Monitor, 
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useHealthMonitor } from '@/hooks/useHealthMonitor';
import { useOperationState } from '@/hooks/useOperationState';

export const SystemHealthStatus: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { healthStatus, checkPageHealth } = useHealthMonitor();
  const { operations, getFailedOperations } = useOperationState();

  const activeOperations = Object.values(operations).filter(op => op.loading);
  const failedOperations = getFailedOperations();
  const healthScore = healthStatus.isHealthy ? 100 : Math.max(0, 100 - (healthStatus.issues.length * 25));

  const getHealthColor = () => {
    if (healthScore >= 90) return 'text-green-500';
    if (healthScore >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getHealthIcon = () => {
    if (healthScore >= 90) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (healthScore >= 70) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <AlertTriangle className="h-4 w-4 text-red-500" />;
  };

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle className="text-sm">Sistema de Monitoramento</CardTitle>
            {getHealthIcon()}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 w-6 p-0"
          >
            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Saúde do Sistema</span>
            <span className={`text-xs font-medium ${getHealthColor()}`}>
              {healthScore}%
            </span>
          </div>
          <Progress value={healthScore} className="h-1" />
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 space-y-4">
          {/* System Status */}
          <div>
            <h4 className="text-xs font-semibold mb-2 flex items-center gap-1">
              <Monitor className="h-3 w-3" />
              Status Atual
            </h4>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span>Renderização</span>
                <Badge variant={healthStatus.renderingStatus === 'healthy' ? 'default' : 'destructive'} className="text-xs">
                  {healthStatus.renderingStatus === 'healthy' ? 'OK' : 
                   healthStatus.renderingStatus === 'blank' ? 'Página Vazia' : 'Erro'}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>Operações Ativas</span>
                <Badge variant={activeOperations.length === 0 ? 'default' : 'secondary'} className="text-xs">
                  {activeOperations.length}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>Operações Falharam</span>
                <Badge variant={failedOperations.length === 0 ? 'default' : 'destructive'} className="text-xs">
                  {failedOperations.length}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Protection Features */}
          <div>
            <h4 className="text-xs font-semibold mb-2 flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Proteções Ativas
            </h4>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Error Boundary implementado</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Monitoramento de páginas vazias</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Validação de dados automática</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Recarregamento automático em falhas</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Retry automático de operações</span>
              </div>
            </div>
          </div>

          {/* Issues */}
          {healthStatus.issues.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="text-xs font-semibold mb-2 flex items-center gap-1 text-destructive">
                  <AlertTriangle className="h-3 w-3" />
                  Problemas Detectados
                </h4>
                <div className="space-y-1">
                  {healthStatus.issues.map((issue, index) => (
                    <div key={index} className="text-xs text-destructive flex items-center gap-2">
                      <AlertTriangle className="h-3 w-3" />
                      {issue}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={checkPageHealth}
              className="text-xs h-6 flex items-center gap-1"
            >
              <Activity className="h-3 w-3" />
              Verificar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.location.reload()}
              className="text-xs h-6 flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              Recarregar
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            Última verificação: {healthStatus.lastCheck.toLocaleTimeString()}
          </div>
        </CardContent>
      )}
    </Card>
  );
};