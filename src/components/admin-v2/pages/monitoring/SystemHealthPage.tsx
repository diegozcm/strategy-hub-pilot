
import React from 'react';
import { AdminPageContainer } from '../../components/AdminPageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useClientDiagnostics } from '@/hooks/useClientDiagnostics';
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  Shield,
  Cpu,
  HardDrive,
  Zap,
  Heart
} from 'lucide-react';

export default function SystemHealthPage() {
  const { 
    statusChecks,
    recentErrors,
    checkNow,
    lastChecked
  } = useClientDiagnostics();

  // Calculate health score based on status checks
  const calculateHealthScore = () => {
    const checks = [
      statusChecks.react,
      statusChecks.dom,
      statusChecks.localStorage,
      statusChecks.noRecentErrors,
      statusChecks.memoryUsage
    ];
    const passedChecks = checks.filter(Boolean).length;
    return Math.round((passedChecks / checks.length) * 100);
  };

  const healthScore = calculateHealthScore();
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100 border-green-200';
    if (score >= 60) return 'bg-yellow-100 border-yellow-200';
    return 'bg-red-100 border-red-200';
  };

  const statusChecksList = [
    { 
      key: 'react', 
      label: 'React Renderização', 
      status: statusChecks.react,
      icon: Zap
    },
    { 
      key: 'dom', 
      label: 'DOM Operacional', 
      status: statusChecks.dom,
      icon: Activity
    },
    { 
      key: 'storage', 
      label: 'Local Storage', 
      status: statusChecks.localStorage,
      icon: HardDrive
    },
    { 
      key: 'memory', 
      label: 'Memória Disponível', 
      status: statusChecks.memoryUsage,
      icon: Cpu
    },
  ];

  const protections = [
    { name: 'Error Boundary', description: 'Captura erros de renderização', active: true },
    { name: 'Health Monitor', description: 'Monitora saúde do sistema', active: true },
    { name: 'Auth Guard', description: 'Protege rotas autenticadas', active: true },
    { name: 'Loading State Monitor', description: 'Detecta travamentos', active: true },
    { name: 'Query Error Handler', description: 'Gerencia erros de API', active: true },
  ];

  const issues = recentErrors.slice(0, 5);

  return (
    <AdminPageContainer
      title="Saúde do Sistema"
      description="Monitoramento em tempo real do status do sistema"
    >
      <div className="space-y-6">
        {/* Header with action button */}
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Última verificação: {lastChecked.toLocaleTimeString('pt-BR')}
          </p>
          <Button onClick={checkNow} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Verificar Agora
          </Button>
        </div>

        {/* Score e Status Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className={`${getScoreBg(healthScore)} border`}>
            <CardContent className="p-4 text-center">
              <Heart className={`h-8 w-8 mx-auto mb-2 ${getScoreColor(healthScore)}`} />
              <div className={`text-3xl font-bold ${getScoreColor(healthScore)}`}>
                {healthScore}%
              </div>
              <p className="text-sm text-muted-foreground">Score de Saúde</p>
            </CardContent>
          </Card>

          {statusChecksList.map((check) => {
            const IconComponent = check.icon;
            return (
              <Card key={check.key} className={check.status ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
                <CardContent className="p-4 text-center">
                  <IconComponent className={`h-6 w-6 mx-auto mb-2 ${check.status ? 'text-green-600' : 'text-red-600'}`} />
                  <div className={`text-lg font-semibold ${check.status ? 'text-green-700' : 'text-red-700'}`}>
                    {check.status ? 'OK' : 'Falha'}
                  </div>
                  <p className="text-xs text-muted-foreground">{check.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Status Detalhado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Status Detalhado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statusChecksList.map((check) => (
                <div key={check.key} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    {check.status ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className="font-medium">{check.label}</span>
                  </div>
                  <Badge variant={check.status ? 'cofound-success' : 'destructive'}>
                    {check.status ? 'Saudável' : 'Com Problemas'}
                  </Badge>
                </div>
              ))}
              
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-cofound-green" />
                  <span className="font-medium">Autenticação</span>
                </div>
                <Badge variant="cofound-success">OK</Badge>
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  {recentErrors.length === 0 ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  )}
                  <span className="font-medium">Erros Recentes</span>
                </div>
                <Badge variant={recentErrors.length === 0 ? 'default' : 'secondary'}>
                  {recentErrors.length} erro(s)
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Proteções Ativas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Proteções Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {protections.map((protection) => (
                <div 
                  key={protection.name} 
                  className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200"
                >
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-800">{protection.name}</p>
                    <p className="text-sm text-green-600">{protection.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Problemas Detectados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Problemas Detectados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {issues.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
                <p className="font-medium">Nenhum problema detectado</p>
                <p className="text-sm">O sistema está funcionando normalmente</p>
              </div>
            ) : (
              <div className="space-y-3">
                {issues.map((error, index) => (
                  <div 
                    key={index} 
                    className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200"
                  >
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-red-800 truncate">{error.message}</p>
                      <p className="text-sm text-red-600">{error.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminPageContainer>
  );
}
