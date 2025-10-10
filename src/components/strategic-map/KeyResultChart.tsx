import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BarChart3, TableIcon } from 'lucide-react';
import { useState } from 'react';

interface KeyResultChartProps {
  monthlyTargets: Record<string, number>;
  monthlyActual: Record<string, number>;
  unit: string;
  selectedYear: number;
}

export const KeyResultChart = ({ 
  monthlyTargets, 
  monthlyActual, 
  unit, 
  selectedYear 
}: KeyResultChartProps) => {
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  
  const months = [
    { key: `${selectedYear}-01`, name: 'Jan' },
    { key: `${selectedYear}-02`, name: 'Fev' },
    { key: `${selectedYear}-03`, name: 'Mar' },
    { key: `${selectedYear}-04`, name: 'Abr' },
    { key: `${selectedYear}-05`, name: 'Mai' },
    { key: `${selectedYear}-06`, name: 'Jun' },
    { key: `${selectedYear}-07`, name: 'Jul' },
    { key: `${selectedYear}-08`, name: 'Ago' },
    { key: `${selectedYear}-09`, name: 'Set' },
    { key: `${selectedYear}-10`, name: 'Out' },
    { key: `${selectedYear}-11`, name: 'Nov' },
    { key: `${selectedYear}-12`, name: 'Dez' },
  ];

const normalizeNumber = (val: unknown): number | null => {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') return Number.isFinite(val) ? val : null;
  if (typeof val === 'string') {
    const cleaned = val.trim().replace(/\s+/g, '').replace(',', '.');
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : null;
  }
  return null;
};

const normalizedTargets: Record<string, number | null> =
  Object.fromEntries(Object.entries(monthlyTargets || {}).map(([k, v]) => [k, normalizeNumber(v as unknown)]));

const normalizedActuals: Record<string, number | null> =
  Object.fromEntries(Object.entries(monthlyActual || {}).map(([k, v]) => [k, normalizeNumber(v as unknown)]));

  const chartData = months.map(month => ({
    month: month.name,
    previsto: normalizedTargets[month.key],
    realizado: normalizedActuals[month.key],
  }));

  // Calculate magnitudes for dual axis logic
  const previstoVals = Object.values(normalizedTargets).filter(v => v !== null && Number.isFinite(v)) as number[];
  const realizadoVals = Object.values(normalizedActuals).filter(v => v !== null && Number.isFinite(v)) as number[];
  
  const maxAbsPrev = previstoVals.length > 0 ? Math.max(...previstoVals.map(Math.abs)) : 0;
  const maxAbsReal = realizadoVals.length > 0 ? Math.max(...realizadoVals.map(Math.abs)) : 0;
  
  const useDualAxis = maxAbsPrev > 0 && maxAbsReal > 0 && 
    (Math.max(maxAbsPrev, maxAbsReal) / Math.min(maxAbsPrev, maxAbsReal)) >= 10;

  const calculateTotal = (data: Record<string, number | null | undefined>) => {
    return Object.values(data).reduce((sum, value) => {
      const n = typeof value === 'number' ? value : Number(value as any);
      return Number.isFinite(n) ? sum + n : sum;
    }, 0);
  };

  const targetTotal = calculateTotal(normalizedTargets);
  const actualTotal = calculateTotal(normalizedActuals);
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg">Evolução Mensal - Previsto vs Realizado</CardTitle>
          {useDualAxis && (
            <Badge variant="outline" className="text-xs">
              Escalas independentes
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewMode('chart')}
            className={`h-8 w-8 ${viewMode === 'chart' ? 'bg-accent' : ''}`}
          >
            <BarChart3 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewMode('table')}
            className={`h-8 w-8 ${viewMode === 'table' ? 'bg-accent' : ''}`}
          >
            <TableIcon className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === 'chart' ? (
          <div className="h-[270px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: useDualAxis ? 50 : 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="month" 
                  className="text-xs fill-muted-foreground"
                />
                <YAxis 
                  yAxisId="left"
                  className="text-xs fill-muted-foreground"
                  tickFormatter={(value) => `${value.toLocaleString('pt-BR')}`}
                  domain={['auto', 'auto']}
                  includeHidden={true}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  className="text-xs fill-muted-foreground"
                  tickFormatter={(value) => `${value.toLocaleString('pt-BR')}`}
                  domain={['auto', 'auto']}
                  includeHidden={true}
                  hide={!useDualAxis}
                />
                <Tooltip 
                  formatter={(value: number | null, name: string) => [
                    value !== null && value !== undefined && Number.isFinite(Number(value)) ? `${Number(value).toLocaleString('pt-BR')} ${unit}` : 'Sem dados', 
                    name === 'previsto' ? 'Previsto' : 'Realizado'
                  ]}
                  labelFormatter={(label) => `Mês: ${label}`}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
                <Legend 
                  formatter={(value) => (
                    <span className="text-sm">
                      {value === 'previsto' ? 'Previsto (Meta)' : 'Realizado'}
                    </span>
                  )}
                />
                <ReferenceLine y={0} yAxisId="left" stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                {useDualAxis && <ReferenceLine y={0} yAxisId="right" stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />}
                <Line 
                  type="monotone" 
                  dataKey="previsto"
                  yAxisId="left"
                  stroke="hsl(var(--muted-foreground))" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  connectNulls={false}
                  dot={{ fill: 'hsl(var(--muted-foreground))', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: 'hsl(var(--muted-foreground))' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="realizado"
                  yAxisId={useDualAxis ? 'right' : 'left'}
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  connectNulls={false}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="rounded-md border">
            <ScrollArea className="w-full overflow-x-auto">
              <Table className="relative">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32 sticky left-0 bg-background z-10 border-r">Indicador</TableHead>
                    {months.map(month => {
                      const isCurrentMonth = month.key === currentMonth;
                      return (
                        <TableHead key={month.key} className="text-center min-w-20">
                          {month.name}
                          {isCurrentMonth && (
                            <span className="block text-xs text-primary">(atual)</span>
                          )}
                        </TableHead>
                      );
                    })}
                    <TableHead className="text-center min-w-24 bg-muted font-semibold">
                      Total
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium sticky left-0 bg-background z-10 border-r">Previsto</TableCell>
                    {months.map(month => {
                      const isCurrentMonth = month.key === currentMonth;
                      const value = normalizedTargets[month.key];
                      const hasValue = value !== null && value !== undefined && Number.isFinite(Number(value));
                      return (
                        <TableCell 
                          key={month.key} 
                          className={`text-center min-w-20 ${isCurrentMonth ? "bg-blue-50" : "bg-background"}`}
                        >
                          {hasValue ? (
                            <span className={value < 0 ? "text-red-600" : ""}>
                              {value.toLocaleString('pt-BR')}{unit ? ` ${unit}` : ''}
                            </span>
                          ) : '-'}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-center bg-gray-100 font-semibold min-w-24">
                      {targetTotal !== 0 ? (
                        <span className={targetTotal < 0 ? "text-red-600" : ""}>
                          {targetTotal.toLocaleString('pt-BR')}{unit ? ` ${unit}` : ''}
                        </span>
                      ) : '-'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium sticky left-0 bg-background z-10 border-r">Realizado</TableCell>
                    {months.map(month => {
                      const isCurrentMonth = month.key === currentMonth;
                      const value = normalizedActuals[month.key];
                      const hasValue = value !== null && value !== undefined && Number.isFinite(Number(value));
                      
                      return (
                        <TableCell 
                          key={month.key} 
                          className={`text-center min-w-20 ${isCurrentMonth ? "bg-blue-50" : "bg-background"}`}
                        >
                          {hasValue ? (
                            <span className={value < 0 ? "text-red-600 font-semibold" : ""}>
                              {value.toLocaleString('pt-BR')}{unit ? ` ${unit}` : ''}
                            </span>
                          ) : '-'}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-center bg-gray-100 font-semibold min-w-24">
                      {actualTotal !== 0 ? (
                        <span className={actualTotal < 0 ? "text-red-600" : ""}>
                          {actualTotal.toLocaleString('pt-BR')}{unit ? ` ${unit}` : ''}
                        </span>
                      ) : '-'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium sticky left-0 bg-background z-10 border-r">% Atingimento</TableCell>
                    {months.map(month => {
                      const isCurrentMonth = month.key === currentMonth;
                      const value = normalizedActuals[month.key];
                      const target = normalizedTargets[month.key];
                      const v = Number.isFinite(Number(value)) ? Number(value) : 0;
                      const t = Number.isFinite(Number(target)) ? Number(target) : 0;
                      const achievement = t !== 0 ? (v / t) * 100 : 0;
                      
                      const getAchievementColor = (percentage: number) => {
                        if (percentage >= 100) return "text-green-600 font-semibold";
                        if (percentage >= 80) return "text-yellow-600 font-semibold";
                        return "text-red-600 font-semibold";
                      };
                      
                      return (
                        <TableCell 
                          key={month.key} 
                          className={`text-center min-w-20 ${isCurrentMonth ? "bg-blue-50" : "bg-background"}`}
                        >
                          {t !== 0 ? (
                            <span className={getAchievementColor(achievement)}>
                              {achievement.toFixed(0)}%
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-center bg-gray-100 font-semibold min-w-24">
                      {targetTotal !== 0 ? (
                        <span className={
                          ((actualTotal / targetTotal) * 100) >= 100 ? "text-green-600 font-semibold" :
                          ((actualTotal / targetTotal) * 100) >= 80 ? "text-yellow-600 font-semibold" :
                          "text-red-600 font-semibold"
                        }>
                          {((actualTotal / targetTotal) * 100).toFixed(0)}%
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
};