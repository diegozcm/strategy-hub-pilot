import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface KeyResultTestChartProps {
  monthlyTargets: Record<string, number | null | undefined>;
  monthlyActual: Record<string, number | null | undefined>;
  unit?: string;
  selectedYear: number;
}

interface TestChartData {
  month: string;
  previsto?: number;
  realizado?: number;
}

export function KeyResultTestChart({ 
  monthlyTargets = {}, 
  monthlyActual = {}, 
  unit = '', 
  selectedYear 
}: KeyResultTestChartProps) {
  
  // Gerar meses do ano selecionado
  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(selectedYear, i, 1);
    return {
      key: date.toISOString().substring(0, 7),
      name: date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
    };
  });

  // Função de conversão explícita e rigorosa
  const parseValue = (val: any): number | undefined => {
    if (val === null || val === undefined || val === '') return undefined;
    
    // Se já é número finito
    if (typeof val === 'number' && Number.isFinite(val)) {
      return val;
    }
    
    // Se é string, limpar e converter
    if (typeof val === 'string') {
      const cleaned = val.trim()
        .replace(/\./g, '')      // Remove separador de milhar (ex: 1.000 -> 1000)
        .replace(',', '.');       // Troca vírgula por ponto (ex: 10,5 -> 10.5)
      const num = parseFloat(cleaned);
      return Number.isFinite(num) ? num : undefined;
    }
    
    return undefined;
  };

  // Construir dados do gráfico com logs para debug
  const testData: TestChartData[] = months.map(month => {
    const prev = parseValue(monthlyTargets[month.key]);
    const real = parseValue(monthlyActual[month.key]);
    
    // Log para debug - ver exatamente o que está sendo processado
    console.log(`📊 [TEST CHART] ${month.name}:`, {
      previsto: prev,
      realizado: real,
      rawPrevisto: monthlyTargets[month.key],
      rawRealizado: monthlyActual[month.key],
      tipos: {
        rawPrev: typeof monthlyTargets[month.key],
        rawReal: typeof monthlyActual[month.key]
      }
    });
    
    return {
      month: month.name,
      previsto: prev,
      realizado: real
    };
  });

  // Calcular ranges para exibir no badge
  const previstoValues = testData.map(d => d.previsto).filter(v => v !== undefined) as number[];
  const realizadoValues = testData.map(d => d.realizado).filter(v => v !== undefined) as number[];
  
  const previstoMin = previstoValues.length > 0 ? Math.min(...previstoValues) : 0;
  const previstoMax = previstoValues.length > 0 ? Math.max(...previstoValues) : 0;
  const realizadoMin = realizadoValues.length > 0 ? Math.min(...realizadoValues) : 0;
  const realizadoMax = realizadoValues.length > 0 ? Math.max(...realizadoValues) : 0;

  console.log('📊 [TEST CHART] Ranges:', {
    previsto: { min: previstoMin, max: previstoMax },
    realizado: { min: realizadoMin, max: realizadoMax }
  });

  return (
    <Card className="mb-6 border-2 border-dashed border-primary/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg">🧪 Gráfico de Teste - Debug (Construído do Zero)</CardTitle>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs">
              Prev: {previstoMin.toLocaleString('pt-BR')} → {previstoMax.toLocaleString('pt-BR')}
            </Badge>
            <Badge variant="outline" className="text-xs">
              Real: {realizadoMin.toLocaleString('pt-BR')} → {realizadoMax.toLocaleString('pt-BR')}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[270px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={testData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              
              <XAxis 
                dataKey="month" 
                className="text-xs fill-muted-foreground"
              />
              
              {/* YAxis simples com domínio automático que inclui negativos */}
              <YAxis 
                className="text-xs fill-muted-foreground"
                tickFormatter={(value) => value.toLocaleString('pt-BR')}
                domain={['dataMin - 10', 'dataMax + 10']}
              />
              
              <Tooltip 
                formatter={(value: any, name: string) => {
                  if (value === undefined || value === null) return ['Sem dados', name];
                  const numValue = Number(value);
                  if (!Number.isFinite(numValue)) return ['Inválido', name];
                  return [
                    `${numValue.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })} ${unit}`,
                    name === 'previsto' ? 'Previsto' : 'Realizado'
                  ];
                }}
                labelFormatter={(label) => `Mês: ${label}`}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
              />
              
              {/* Linha de referência no zero */}
              <ReferenceLine 
                y={0} 
                stroke="hsl(var(--destructive))" 
                strokeWidth={2}
                strokeDasharray="3 3" 
              />
              
              {/* Linha Previsto - Cinza sólida */}
              <Line 
                type="monotone"
                dataKey="previsto"
                stroke="#9CA3AF"
                strokeWidth={2}
                dot={{ r: 4, fill: '#9CA3AF' }}
                connectNulls={false}
                name="Previsto"
              />
              
              {/* Linha Realizado - Azul sólida */}
              <Line 
                type="monotone"
                dataKey="realizado"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={{ r: 5, fill: '#3B82F6' }}
                connectNulls={false}
                name="Realizado"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 p-3 bg-muted rounded-md text-xs text-muted-foreground">
          <p><strong>Debug Info:</strong></p>
          <p>• Conversão explícita: String → Number (remove pontos, troca vírgula por ponto)</p>
          <p>• YAxis domain: ['dataMin - 10', 'dataMax + 10'] para forçar inclusão de negativos</p>
          <p>• undefined para dados ausentes (Recharts lida melhor que null)</p>
          <p>• Verifique o console para logs detalhados de cada mês</p>
        </div>
      </CardContent>
    </Card>
  );
}
