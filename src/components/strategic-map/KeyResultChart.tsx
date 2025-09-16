import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BarChart3, TableIcon } from 'lucide-react';

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
    previsto: monthlyTargets[month.key] || 0,
    realizado: monthlyActual[month.key] || 0,
  }));

  // Calcular totais para a tabela
  const calculateTotal = (data: Record<string, number>) => {
    return Object.values(data).reduce((sum, value) => sum + (value || 0), 0);
  };

  const targetTotal = calculateTotal(monthlyTargets);
  const actualTotal = calculateTotal(monthlyActual);
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">Evolução Mensal - Previsto vs Realizado</CardTitle>
        <p className="text-sm text-muted-foreground">
          Acompanhe o progresso dos valores realizados em comparação com as metas mensais
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="chart" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chart" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Gráfico
            </TabsTrigger>
            <TabsTrigger value="table" className="flex items-center gap-2">
              <TableIcon className="h-4 w-4" />
              Tabela
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="chart" className="space-y-4">
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
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      `${value.toLocaleString('pt-BR')} ${unit}`, 
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
                    dot={{ fill: 'hsl(var(--muted-foreground))', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="realizado" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          <TabsContent value="table" className="space-y-4">
            <div className="rounded-md border">
              {/* Fixed Header */}
              <div className="border-b bg-muted/50">
                <div className="flex">
                  <div className="w-32 p-4 font-medium bg-background border-r">Indicador</div>
                  {months.map(month => {
                    const isCurrentMonth = month.key === currentMonth;
                    return (
                      <div key={month.key} className="min-w-20 p-4 text-center font-medium text-muted-foreground">
                        {month.name}
                        {isCurrentMonth && (
                          <div className="text-xs text-primary">(atual)</div>
                        )}
                      </div>
                    );
                  })}
                  <div className="min-w-24 p-4 text-center font-semibold bg-muted">
                    Total
                  </div>
                </div>
              </div>
              
              {/* Scrollable Body */}
              <ScrollArea className="max-h-[300px]">
                <div className="divide-y">
                  {/* Previsto Row */}
                  <div className="flex hover:bg-muted/50">
                    <div className="w-32 p-4 font-medium bg-background border-r">Previsto</div>
                    {months.map(month => {
                      const isCurrentMonth = month.key === currentMonth;
                      const value = monthlyTargets[month.key] || 0;
                      return (
                        <div 
                          key={month.key} 
                          className={`min-w-20 p-4 text-center ${isCurrentMonth ? "bg-blue-50" : ""}`}
                        >
                          {value > 0 ? `${value.toLocaleString('pt-BR')}${unit ? ` ${unit}` : ''}` : '-'}
                        </div>
                      );
                    })}
                    <div className="min-w-24 p-4 text-center bg-gray-100 font-semibold">
                      {targetTotal > 0 ? `${targetTotal.toLocaleString('pt-BR')}${unit ? ` ${unit}` : ''}` : '-'}
                    </div>
                  </div>
                  
                  {/* Realizado Row */}
                  <div className="flex hover:bg-muted/50">
                    <div className="w-32 p-4 font-medium bg-background border-r">Realizado</div>
                    {months.map(month => {
                      const isCurrentMonth = month.key === currentMonth;
                      const value = monthlyActual[month.key] || 0;
                      
                      return (
                        <div 
                          key={month.key} 
                          className={`min-w-20 p-4 text-center ${isCurrentMonth ? "bg-blue-50" : ""}`}
                        >
                          {value > 0 ? `${value.toLocaleString('pt-BR')}${unit ? ` ${unit}` : ''}` : '-'}
                        </div>
                      );
                    })}
                    <div className="min-w-24 p-4 text-center bg-gray-100 font-semibold">
                      {actualTotal > 0 ? `${actualTotal.toLocaleString('pt-BR')}${unit ? ` ${unit}` : ''}` : '-'}
                    </div>
                  </div>
                  
                  {/* % Atingimento Row */}
                  <div className="flex hover:bg-muted/50">
                    <div className="w-32 p-4 font-medium bg-background border-r">% Atingimento</div>
                    {months.map(month => {
                      const isCurrentMonth = month.key === currentMonth;
                      const value = monthlyActual[month.key] || 0;
                      const target = monthlyTargets[month.key] || 0;
                      const achievement = target > 0 ? (value / target) * 100 : 0;
                      
                      const getAchievementColor = (percentage: number) => {
                        if (percentage >= 100) return "text-green-600 font-semibold";
                        if (percentage >= 80) return "text-yellow-600 font-semibold";
                        return "text-red-600 font-semibold";
                      };
                      
                      return (
                        <div 
                          key={month.key} 
                          className={`min-w-20 p-4 text-center ${isCurrentMonth ? "bg-blue-50" : ""}`}
                        >
                          {target > 0 ? (
                            <span className={getAchievementColor(achievement)}>
                              {achievement.toFixed(0)}%
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      );
                    })}
                    <div className="min-w-24 p-4 text-center bg-gray-100 font-semibold">
                      {targetTotal > 0 && actualTotal > 0 ? (
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
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};