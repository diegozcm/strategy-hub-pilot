import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">Evolução Mensal - Previsto vs Realizado</CardTitle>
        <p className="text-sm text-muted-foreground">
          Acompanhe o progresso dos valores realizados em comparação com as metas mensais
        </p>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
};