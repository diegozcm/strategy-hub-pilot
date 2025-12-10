import React, { useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TrendingUp, TrendingDown, Target, Activity, AlertCircle, CheckCircle } from 'lucide-react';
import { KeyResult, StrategicObjective } from '@/types/strategic-map';
import { cn } from '@/lib/utils';

interface KRTableViewProps {
  keyResults: KeyResult[];
  objectives: StrategicObjective[];
  pillars: { id: string; name: string; color: string }[];
  periodType: 'ytd' | 'quarterly' | 'monthly' | 'yearly';
  selectedYear?: number;
  selectedMonth?: number;
  selectedQuarter?: 1 | 2 | 3 | 4;
  selectedQuarterYear?: number;
  onKRClick: (kr: KeyResult) => void;
  customMetricsMap: Map<string, {
    ytd: { target: number; actual: number; percentage: number };
    monthly: { target: number; actual: number; percentage: number };
    yearly: { target: number; actual: number; percentage: number };
    quarterly: { target: number; actual: number; percentage: number };
  }>;
}

const formatValue = (value: number, unit: string = '%'): string => {
  if (unit === '%') {
    return `${value.toFixed(1).replace('.', ',')}%`;
  } else if (unit === 'R$') {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
};

const getEfficiencyColor = (efficiency: number): string => {
  if (efficiency >= 100) return 'text-green-600 dark:text-green-400';
  if (efficiency >= 80) return 'text-yellow-600 dark:text-yellow-400';
  if (efficiency >= 50) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
};

const getEfficiencyBadge = (efficiency: number): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } => {
  if (efficiency >= 100) return { label: 'Excelente', variant: 'default' };
  if (efficiency >= 80) return { label: 'Bom', variant: 'secondary' };
  if (efficiency >= 50) return { label: 'Atenção', variant: 'outline' };
  return { label: 'Crítico', variant: 'destructive' };
};

export const KRTableView: React.FC<KRTableViewProps> = ({
  keyResults,
  objectives,
  pillars,
  periodType,
  selectedYear,
  selectedMonth,
  selectedQuarter,
  selectedQuarterYear,
  onKRClick,
  customMetricsMap,
}) => {
  // Get metrics for a specific KR based on period type
  const getMetrics = (kr: KeyResult) => {
    const metrics = customMetricsMap.get(kr.id);
    if (!metrics) {
      return { target: 0, actual: 0, percentage: 0 };
    }

    switch (periodType) {
      case 'ytd':
        return metrics.ytd;
      case 'monthly':
        return metrics.monthly;
      case 'yearly':
        return metrics.yearly;
      case 'quarterly':
        return metrics.quarterly;
      default:
        return metrics.ytd;
    }
  };

  // Calculate resultado (difference) and efficiency
  const calculateRMRE = (kr: KeyResult) => {
    const metrics = getMetrics(kr);
    const real = metrics.actual;
    const meta = metrics.target;
    const resultado = real - meta;
    const eficiencia = metrics.percentage;

    return {
      real,
      meta,
      resultado,
      eficiencia,
      isMinimize: kr.target_direction === 'minimize',
    };
  };

  // Get objective and pillar info
  const getObjectiveInfo = (objectiveId: string | undefined) => {
    if (!objectiveId) return { objective: null, pillar: null };
    const objective = objectives.find(o => o.id === objectiveId);
    if (!objective) return { objective: null, pillar: null };
    const pillar = pillars.find(p => p.id === objective.pillar_id);
    return { objective, pillar };
  };

  // Sort KRs by pillar, then objective, then title
  const sortedKRs = useMemo(() => {
    return [...keyResults].sort((a, b) => {
      const infoA = getObjectiveInfo(a.objective_id);
      const infoB = getObjectiveInfo(b.objective_id);
      
      // Sort by pillar order
      const pillarIndexA = pillars.findIndex(p => p.id === infoA.pillar?.id);
      const pillarIndexB = pillars.findIndex(p => p.id === infoB.pillar?.id);
      if (pillarIndexA !== pillarIndexB) return pillarIndexA - pillarIndexB;
      
      // Sort by objective title
      const objTitleA = infoA.objective?.title || '';
      const objTitleB = infoB.objective?.title || '';
      if (objTitleA !== objTitleB) return objTitleA.localeCompare(objTitleB);
      
      // Sort by KR title
      return a.title.localeCompare(b.title);
    });
  }, [keyResults, objectives, pillars]);

  // Get period label for header
  const getPeriodLabel = (): string => {
    switch (periodType) {
      case 'ytd':
        return 'YTD';
      case 'monthly':
        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        return `${monthNames[(selectedMonth || 1) - 1]} ${selectedYear}`;
      case 'yearly':
        return `Ano ${selectedYear}`;
      case 'quarterly':
        return `Q${selectedQuarter} ${selectedQuarterYear}`;
      default:
        return '';
    }
  };

  if (keyResults.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Activity className="h-12 w-12 mb-4 opacity-50" />
        <p>Nenhum resultado-chave encontrado</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[300px] font-semibold">Resultado-Chave</TableHead>
              <TableHead className="w-[150px] font-semibold">Objetivo</TableHead>
              <TableHead className="w-[100px] text-right font-semibold">
                <Tooltip>
                  <TooltipTrigger className="flex items-center justify-end gap-1 w-full">
                    <Target className="h-4 w-4" />
                    Meta
                  </TooltipTrigger>
                  <TooltipContent>Valor meta para o período</TooltipContent>
                </Tooltip>
              </TableHead>
              <TableHead className="w-[100px] text-right font-semibold">
                <Tooltip>
                  <TooltipTrigger className="flex items-center justify-end gap-1 w-full">
                    <Activity className="h-4 w-4" />
                    Real
                  </TooltipTrigger>
                  <TooltipContent>Valor realizado no período</TooltipContent>
                </Tooltip>
              </TableHead>
              <TableHead className="w-[100px] text-right font-semibold">
                <Tooltip>
                  <TooltipTrigger className="flex items-center justify-end gap-1 w-full">
                    {/* Show trend icon */}
                    <TrendingUp className="h-4 w-4" />
                    Resultado
                  </TooltipTrigger>
                  <TooltipContent>Diferença entre Real e Meta (Real - Meta)</TooltipContent>
                </Tooltip>
              </TableHead>
              <TableHead className="w-[150px] text-right font-semibold">
                <Tooltip>
                  <TooltipTrigger className="flex items-center justify-end gap-1 w-full">
                    Eficiência ({getPeriodLabel()})
                  </TooltipTrigger>
                  <TooltipContent>Percentual de atingimento da meta</TooltipContent>
                </Tooltip>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedKRs.map((kr) => {
              const { real, meta, resultado, eficiencia, isMinimize } = calculateRMRE(kr);
              const { objective, pillar } = getObjectiveInfo(kr.objective_id);
              const efficiencyBadge = getEfficiencyBadge(eficiencia);
              
              // Determine if resultado is good or bad based on direction
              const isResultadoPositive = isMinimize ? resultado <= 0 : resultado >= 0;

              return (
                <TableRow 
                  key={kr.id} 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => onKRClick(kr)}
                >
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-foreground line-clamp-2">
                        {kr.title}
                      </span>
                      {pillar && (
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: pillar.color }}
                          />
                          <span className="text-xs text-muted-foreground">
                            {pillar.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground line-clamp-2">
                      {objective?.title || '-'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatValue(meta, kr.unit)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatValue(real, kr.unit)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {isResultadoPositive ? (
                        <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                      )}
                      <span className={cn(
                        'font-mono',
                        isResultadoPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      )}>
                        {resultado >= 0 ? '+' : ''}{formatValue(resultado, kr.unit)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-2">
                        <span className={cn('font-semibold text-sm', getEfficiencyColor(eficiencia))}>
                          {eficiencia.toFixed(1).replace('.', ',')}%
                        </span>
                        <Badge variant={efficiencyBadge.variant} className="text-xs">
                          {efficiencyBadge.label}
                        </Badge>
                      </div>
                      <Progress 
                        value={Math.min(eficiencia, 100)} 
                        className="h-1.5 w-24"
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        
        {/* Summary footer */}
        <div className="border-t bg-muted/30 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {keyResults.length} resultado{keyResults.length !== 1 ? 's' : ''}-chave
            </span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-muted-foreground">
                  {keyResults.filter(kr => {
                    const metrics = customMetricsMap.get(kr.id);
                    const perc = periodType === 'ytd' ? metrics?.ytd.percentage :
                                  periodType === 'monthly' ? metrics?.monthly.percentage :
                                  periodType === 'yearly' ? metrics?.yearly.percentage :
                                  metrics?.quarterly.percentage;
                    return (perc || 0) >= 100;
                  }).length} atingidos
                </span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span className="text-muted-foreground">
                  {keyResults.filter(kr => {
                    const metrics = customMetricsMap.get(kr.id);
                    const perc = periodType === 'ytd' ? metrics?.ytd.percentage :
                                  periodType === 'monthly' ? metrics?.monthly.percentage :
                                  periodType === 'yearly' ? metrics?.yearly.percentage :
                                  metrics?.quarterly.percentage;
                    return (perc || 0) < 50;
                  }).length} críticos
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};
