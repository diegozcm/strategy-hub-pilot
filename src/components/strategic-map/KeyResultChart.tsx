import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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

  const chartData = months.map(month => ({
    month: month.name,
    previsto: monthlyTargets[month.key] !== undefined && monthlyTargets[month.key] !== null ? monthlyTargets[month.key] : null,
    realizado: monthlyActual[month.key] !== undefined && monthlyActual[month.key] !== null ? monthlyActual[month.key] : null,
  }));

  // Calcular totais para a tabela
  const calculateTotal = (data: Record<string, number>) => {
    return Object.values(data).reduce((sum, value) => {
      if (value !== null && value !== undefined && !isNaN(value)) {
        return sum + value;
      }
      return sum;
    }, 0);
  };

  const targetTotal = calculateTotal(monthlyTargets);
  const actualTotal = calculateTotal(monthlyActual);
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Evolução Mensal - Previsto vs Realizado</CardTitle>
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
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="month" 
                  className="text-xs fill-muted-foreground"
                />
                <YAxis 
                  className="text-xs fill-muted-foreground"
                  tickFormatter={(value) => `${value.toLocaleString('pt-BR')}`}
                  domain={['auto', 'auto']}
                  includeHidden={true}
                />
                <Tooltip 
                  formatter={(value: number | null, name: string) => [
                    value !== null && value !== undefined ? `${value.toLocaleString('pt-BR')} ${unit}` : 'Sem dados', 
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
                <Line 
                  type="monotone" 
                  dataKey="previsto" 
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
                      const value = monthlyTargets[month.key];
                      const hasValue = value !== null && value !== undefined;
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
                      const value = monthlyActual[month.key];
                      const hasValue = value !== null && value !== undefined;
                      
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
                      const value = monthlyActual[month.key] ?? 0;
                      const target = monthlyTargets[month.key] ?? 0;
                      const achievement = target !== 0 ? (value / target) * 100 : 0;
                      
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
                          {target !== 0 ? (
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