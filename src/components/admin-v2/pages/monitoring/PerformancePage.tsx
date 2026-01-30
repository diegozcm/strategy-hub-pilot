
import React, { useState, useEffect } from 'react';
import { AdminPageContainer } from '../../components/AdminPageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useClientDiagnostics } from '@/hooks/useClientDiagnostics';
import { 
  Gauge, 
  RefreshCw, 
  Clock, 
  Zap, 
  HardDrive,
  Activity,
  Timer,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'medium' | 'bad';
  threshold: { good: number; medium: number };
}

export default function PerformancePage() {
  const { perfMetrics, recentErrors, checkNow } = useClientDiagnostics();
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [memoryUsage, setMemoryUsage] = useState<number | null>(null);

  useEffect(() => {
    collectPerformanceMetrics();
  }, []);

  const collectPerformanceMetrics = () => {
    const metrics: PerformanceMetric[] = [];

    // Navigation Timing API
    if (window.performance && (window.performance as any).timing) {
      const timing = (window.performance as any).timing;
      
      const domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart;
      const pageLoad = timing.loadEventEnd - timing.navigationStart;
      const dnsLookup = timing.domainLookupEnd - timing.domainLookupStart;
      const tcpConnection = timing.connectEnd - timing.connectStart;
      const serverResponse = timing.responseEnd - timing.requestStart;
      const domProcessing = timing.domComplete - timing.domLoading;

      if (domContentLoaded > 0) {
        metrics.push({
          name: 'DOM Content Loaded',
          value: domContentLoaded,
          unit: 'ms',
          status: domContentLoaded < 1000 ? 'good' : domContentLoaded < 2500 ? 'medium' : 'bad',
          threshold: { good: 1000, medium: 2500 }
        });
      }

      if (pageLoad > 0) {
        metrics.push({
          name: 'Page Load Time',
          value: pageLoad,
          unit: 'ms',
          status: pageLoad < 2000 ? 'good' : pageLoad < 4000 ? 'medium' : 'bad',
          threshold: { good: 2000, medium: 4000 }
        });
      }

      if (dnsLookup > 0) {
        metrics.push({
          name: 'DNS Lookup',
          value: dnsLookup,
          unit: 'ms',
          status: dnsLookup < 50 ? 'good' : dnsLookup < 150 ? 'medium' : 'bad',
          threshold: { good: 50, medium: 150 }
        });
      }

      if (tcpConnection > 0) {
        metrics.push({
          name: 'TCP Connection',
          value: tcpConnection,
          unit: 'ms',
          status: tcpConnection < 100 ? 'good' : tcpConnection < 300 ? 'medium' : 'bad',
          threshold: { good: 100, medium: 300 }
        });
      }

      if (serverResponse > 0) {
        metrics.push({
          name: 'Server Response',
          value: serverResponse,
          unit: 'ms',
          status: serverResponse < 200 ? 'good' : serverResponse < 500 ? 'medium' : 'bad',
          threshold: { good: 200, medium: 500 }
        });
      }

      if (domProcessing > 0) {
        metrics.push({
          name: 'DOM Processing',
          value: domProcessing,
          unit: 'ms',
          status: domProcessing < 500 ? 'good' : domProcessing < 1500 ? 'medium' : 'bad',
          threshold: { good: 500, medium: 1500 }
        });
      }
    }

    // Paint Timing API
    if (window.performance && window.performance.getEntriesByType) {
      const paintEntries = window.performance.getEntriesByType('paint');
      paintEntries.forEach((entry) => {
        metrics.push({
          name: entry.name === 'first-paint' ? 'First Paint' : 'First Contentful Paint',
          value: Math.round(entry.startTime),
          unit: 'ms',
          status: entry.startTime < 1000 ? 'good' : entry.startTime < 2500 ? 'medium' : 'bad',
          threshold: { good: 1000, medium: 2500 }
        });
      });
    }

    setPerformanceMetrics(metrics);

    // Memory API (Chrome only)
    if ((performance as any).memory) {
      const memory = (performance as any).memory;
      const usedPercent = Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100);
      setMemoryUsage(usedPercent);
    }
  };

  const getStatusColor = (status: 'good' | 'medium' | 'bad') => {
    switch (status) {
      case 'good': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'bad': return 'text-red-600';
    }
  };

  const getStatusBadge = (status: 'good' | 'medium' | 'bad') => {
    switch (status) {
      case 'good': return <Badge className="bg-green-100 text-green-700">Bom</Badge>;
      case 'medium': return <Badge className="bg-yellow-100 text-yellow-700">Médio</Badge>;
      case 'bad': return <Badge className="bg-red-100 text-red-700">Lento</Badge>;
    }
  };

  const formatTime = (ms: number) => {
    if (ms >= 1000) {
      return `${(ms / 1000).toFixed(2)}s`;
    }
    return `${ms}ms`;
  };

  const domLoadTime = performanceMetrics.find(m => m.name === 'DOM Content Loaded')?.value || 0;
  const pageLoadTime = performanceMetrics.find(m => m.name === 'Page Load Time')?.value || 0;
  const firstPaint = performanceMetrics.find(m => m.name === 'First Paint')?.value || 0;

  return (
    <AdminPageContainer
      title="Performance do Sistema"
      description="Métricas de tempo de carregamento e operações"
    >
      <div className="space-y-6">
        {/* Header with action button */}
        <div className="flex justify-end">
          <Button onClick={() => { checkNow(); collectPerformanceMetrics(); }} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar Métricas
          </Button>
        </div>

        {/* Cards Principais */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">DOM Load</p>
                  <p className="text-2xl font-bold">{formatTime(domLoadTime)}</p>
                  <p className={`text-xs font-medium ${domLoadTime < 1500 ? 'text-green-600' : 'text-red-600'}`}>
                    {domLoadTime < 1500 ? 'Rápido' : 'Lento'}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-cofound-blue-light/10">
                  <Zap className="h-5 w-5 text-cofound-blue-light" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Page Load</p>
                  <p className="text-2xl font-bold">{formatTime(pageLoadTime)}</p>
                  <p className={`text-xs font-medium ${pageLoadTime < 3000 ? 'text-green-600' : 'text-red-600'}`}>
                    {pageLoadTime < 3000 ? 'Normal' : 'Lento'}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-cofound-blue-light/10">
                  <Clock className="h-5 w-5 text-cofound-blue-light" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">First Paint</p>
                  <p className="text-2xl font-bold">{formatTime(firstPaint)}</p>
                  <p className={`text-xs font-medium ${firstPaint < 1000 ? 'text-green-600' : 'text-yellow-600'}`}>
                    {firstPaint < 1000 ? 'Ótimo' : 'Aceitável'}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-cofound-blue-light/10">
                  <Activity className="h-5 w-5 text-cofound-blue-light" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Memória</p>
                  <p className="text-2xl font-bold">{memoryUsage !== null ? `${memoryUsage}%` : 'N/A'}</p>
                  <p className={`text-xs font-medium ${memoryUsage !== null && memoryUsage < 70 ? 'text-green-600' : 'text-red-600'}`}>
                    {memoryUsage !== null && memoryUsage < 70 ? 'Normal' : 'Alto'}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-cofound-blue-light/10">
                  <HardDrive className="h-5 w-5 text-cofound-blue-light" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Métricas de Navegação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5" />
              Métricas de Navegação
            </CardTitle>
          </CardHeader>
          <CardContent>
            {performanceMetrics.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Timer className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Métricas não disponíveis</p>
                <p className="text-sm">Recarregue a página para coletar métricas</p>
              </div>
            ) : (
              <div className="space-y-4">
                {performanceMetrics.map((metric, index) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b last:border-0">
                    <div className="flex-1">
                      <p className="font-medium">{metric.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress 
                          value={Math.min((metric.value / metric.threshold.medium) * 100, 100)} 
                          className="h-2 w-32"
                        />
                        <span className="text-xs text-muted-foreground">
                          Limite: {formatTime(metric.threshold.good)} / {formatTime(metric.threshold.medium)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-mono text-lg ${getStatusColor(metric.status)}`}>
                        {formatTime(metric.value)}
                      </span>
                      {getStatusBadge(metric.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Uso de Memória */}
        {memoryUsage !== null && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Uso de Memória JavaScript
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Progress value={memoryUsage} className="flex-1 h-4" />
                  <span className={`text-2xl font-bold ${
                    memoryUsage < 50 ? 'text-green-600' : 
                    memoryUsage < 70 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {memoryUsage}%
                  </span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>0%</span>
                  <span className="text-green-600">50% (Bom)</span>
                  <span className="text-yellow-600">70% (Médio)</span>
                  <span className="text-red-600">100% (Crítico)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Operações Lentas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Operações Lentas Detectadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentErrors.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-3 text-green-500" />
                <p className="font-medium text-green-700">Nenhuma operação lenta</p>
                <p className="text-sm">Todas as operações estão dentro dos limites normais</p>
              </div>
            ) : (
              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {recentErrors.map((error, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <Timer className="h-5 w-5 text-yellow-600" />
                      <div className="flex-1">
                        <p className="font-medium text-yellow-800">{error.message}</p>
                        <p className="text-sm text-yellow-600">{error.time}</p>
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
