import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, ReferenceArea, BarChart, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { BarChart3, TableIcon } from 'lucide-react';
import { useState } from 'react';
import { calculateKRStatus, type TargetDirection } from '@/lib/krHelpers';
import { formatValueWithUnit } from '@/lib/utils';
import { KeyResultWithMetrics } from '@/hooks/useKRMetrics';
import { cn } from '@/lib/utils';
import { 
  isFrequencyPeriodBased, 
  getFrequencyLabel, 
  getPeriodsForFrequency, 
  KRFrequency,
  getFrequencyBadgeColor
} from '@/lib/krFrequencyHelpers';

interface KeyResultChartProps {
  keyResult: KeyResultWithMetrics;
  monthlyTargets: Record<string, number>;
  monthlyActual: Record<string, number>;
  unit: string;
  selectedYear: number;
  onYearChange?: (year: number) => void;
  targetDirection?: TargetDirection;
  aggregationType?: 'sum' | 'average' | 'max' | 'min' | 'last';
  selectedPeriod?: 'ytd' | 'monthly' | 'yearly' | 'quarterly' | 'semesterly' | 'bimonthly';
  yearOptions?: Array<{ value: number; label: string }>;
}

export const KeyResultChart = ({ 
  keyResult,
  monthlyTargets, 
  monthlyActual, 
  unit, 
  selectedYear,
  onYearChange,
  targetDirection = 'maximize',
  aggregationType = 'sum',
  selectedPeriod = 'ytd',
  yearOptions: propYearOptions
}: KeyResultChartProps) => {
  // Detect frequency - default to monthly for backward compatibility
  const frequency = (keyResult.frequency as KRFrequency) || 'monthly';
  const isPeriodBased = isFrequencyPeriodBased(frequency);

  // Helper functions for validity period
  const isMonthInValidity = (monthKey: string, startMonth?: string, endMonth?: string): boolean => {
    if (!startMonth || !endMonth) return false;
    return monthKey >= startMonth && monthKey <= endMonth;
  };

  const formatValidityPeriod = (startMonth?: string, endMonth?: string): string | null => {
    if (!startMonth || !endMonth) return null;
    
    const formatMonth = (monthKey: string) => {
      const [year, month] = monthKey.split('-');
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      return `${monthNames[parseInt(month) - 1]}/${year}`;
    };
    
    return `${formatMonth(startMonth)} até ${formatMonth(endMonth)}`;
  };

  // Get aggregation type label
  const getAggregationLabel = (type: string) => {
    switch (type) {
      case 'sum': return 'Total';
      case 'average': return 'Média';
      case 'max': return 'Máximo';
      case 'min': return 'Mínimo';
      default: return 'Total';
    }
  };
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  
  // Use year options from props or fallback to current year
  const finalYearOptions = propYearOptions && propYearOptions.length > 0
    ? propYearOptions
    : [{ value: new Date().getFullYear(), label: new Date().getFullYear().toString() }];
  
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

  // Calculate magnitudes for dual axis logic
  const previstoVals = Object.values(normalizedTargets).filter(v => v !== null && Number.isFinite(v)) as number[];
  const realizadoVals = Object.values(normalizedActuals).filter(v => v !== null && Number.isFinite(v)) as number[];
  
  const maxAbsPrev = previstoVals.length > 0 ? Math.max(...previstoVals.map(Math.abs)) : 0;
  const maxAbsReal = realizadoVals.length > 0 ? Math.max(...realizadoVals.map(Math.abs)) : 0;
  
  const useDualAxis = maxAbsPrev > 0 && maxAbsReal > 0 && 
    (Math.max(maxAbsPrev, maxAbsReal) / Math.min(maxAbsPrev, maxAbsReal)) >= 10;

  // Calculate totals based on selected period
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
  
  // Determine which months to include based on selected period
  const getMonthsForPeriod = () => {
    if (selectedPeriod === 'monthly') {
      return months.filter(month => month.key === currentMonth);
    } else if (selectedPeriod === 'yearly') {
      return months;
    } else {
      return months.filter(month => {
        const target = normalizedTargets[month.key];
        const actual = normalizedActuals[month.key];
        const hasTarget = typeof target === 'number' && Number.isFinite(target) && target > 0;
        const hasActual = typeof actual === 'number' && Number.isFinite(actual);
        return hasTarget && hasActual;
      });
    }
  };

  const monthsForTotal = getMonthsForPeriod();

  // Use pre-calculated values from database based on selected period
  const targetTotal = selectedPeriod === 'yearly'
    ? (keyResult.yearly_target ?? 0)
    : selectedPeriod === 'monthly'
    ? (keyResult.current_month_target ?? 0)
    : (keyResult.ytd_target ?? 0);

  const actualTotal = selectedPeriod === 'yearly'
    ? (keyResult.yearly_actual ?? 0)
    : selectedPeriod === 'monthly'
    ? (keyResult.current_month_actual ?? 0)
    : (keyResult.ytd_actual ?? 0);
  
  const preCalculatedPercentage = selectedPeriod === 'yearly'
    ? (keyResult.yearly_percentage ?? 0)
    : selectedPeriod === 'monthly'
    ? (keyResult.monthly_percentage ?? 0)
    : (keyResult.ytd_percentage ?? 0);

  // Calculate the maximum value for barAxis domain (0 to 110% of max)
  const maxBarValue = Math.max(
    Math.abs(targetTotal), 
    Math.abs(actualTotal),
    0
  );
  const barAxisMax = maxBarValue * 1.1;

  // Get period label for Total column
  const getPeriodLabel = () => {
    if (selectedPeriod === 'monthly') return '(Mês)';
    if (selectedPeriod === 'yearly') return '(Ano)';
    return '(YTD)';
  };

  // Format value for table with 1 decimal place and smaller unit
  const formatValueForTable = (value: number, unit: string) => {
    const formattedValue = value.toLocaleString('pt-BR', { 
      minimumFractionDigits: 1, 
      maximumFractionDigits: 1 
    });
    
    if (unit === 'R$') {
      return (
        <>
          R$ {formattedValue} 
        </>
      );
    }
    
    return (
      <>
        {formattedValue} <span className="text-xs text-muted-foreground">{unit}</span>
      </>
    );
  };

  // ============== Period-based chart data (for quarterly, semiannual, annual) ==============
  const periods = isPeriodBased ? getPeriodsForFrequency(frequency, selectedYear) : [];
  
  const periodChartData = periods.map(period => {
    let meta = 0;
    let realizado = 0;
    let metaCount = 0;
    let realizadoCount = 0;

    period.monthKeys.forEach(monthKey => {
      const target = normalizedTargets[monthKey];
      const actual = normalizedActuals[monthKey];
      
      if (target !== null) {
        meta += target;
        metaCount++;
      }
      if (actual !== null) {
        realizado += actual;
        realizadoCount++;
      }
    });

    if (aggregationType === 'average' && metaCount > 0) {
      meta = meta / metaCount;
    }
    if (aggregationType === 'average' && realizadoCount > 0) {
      realizado = realizado / realizadoCount;
    }

    const percentage = meta > 0 ? (realizado / meta) * 100 : 0;
    const status = calculateKRStatus(realizado, meta, targetDirection);

    return {
      period: period.label,
      periodKey: period.key,
      meta: meta || 0,
      realizado: realizado || 0,
      percentage,
      status
    };
  });

  // Get chart title based on frequency
  const getChartTitle = () => {
    if (frequency === 'quarterly') return 'Evolução Trimestral - Meta vs Realizado';
    if (frequency === 'semesterly') return 'Evolução Semestral - Meta vs Realizado';
    if (frequency === 'yearly') return 'Meta Anual - Meta vs Realizado';
    return 'Evolução Mensal - Previsto vs Realizado';
  };

  // Monthly chart data (original behavior)
  const chartData = [
    ...months.map(month => ({
      month: month.name,
      previsto: normalizedTargets[month.key],
      realizado: normalizedActuals[month.key],
      previstoBar: null,
      realizadoBar: null,
    })),
    {
      month: `Total ${getPeriodLabel().replace(/[()]/g, '')}`,
      previsto: null,
      realizado: null,
      previstoBar: targetTotal !== 0 ? targetTotal : null,
      realizadoBar: actualTotal !== 0 ? actualTotal : null,
    }
  ];

  // Get validity indices for chart highlighting
  const getValidityIndices = () => {
    if (!keyResult.start_month || !keyResult.end_month) return null;
    
    const startIdx = months.findIndex(m => m.key >= keyResult.start_month!);
    const endIdx = months.findIndex(m => m.key > keyResult.end_month!);
    
    if (startIdx === -1) return null;
    
    return {
      startMonth: months[startIdx]?.name,
      endMonth: months[endIdx === -1 ? months.length - 1 : endIdx - 1]?.name
    };
  };

  // Calculate max value for period chart Y-axis
  const maxPeriodValue = Math.max(
    ...periodChartData.flatMap(d => [d.meta, d.realizado]),
    0
  ) * 1.15;

  // ============== Period-based bar chart rendering ==============
  const renderPeriodChart = () => (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={periodChartData} 
          margin={{ top: 30, right: 30, left: 20, bottom: 20 }}
          barCategoryGap={frequency === 'yearly' ? '40%' : '25%'}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
          <XAxis 
            dataKey="period" 
            className="text-sm fill-muted-foreground font-medium"
            tickLine={false}
            axisLine={{ stroke: 'hsl(var(--border))' }}
          />
          <YAxis 
            className="text-xs fill-muted-foreground"
            tickFormatter={(value) => formatValueWithUnit(value, unit)}
            domain={[0, maxPeriodValue]}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip 
            cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
            content={({ active, payload, label }) => {
              if (!active || !payload || payload.length === 0) return null;
              
              const data = payload[0]?.payload;
              const percentage = data?.percentage || 0;
              const status = data?.status;
              
              return (
                <div className="bg-background border border-border rounded-lg shadow-lg p-3 min-w-[180px]">
                  <p className="font-semibold text-sm mb-2 text-foreground">{label}</p>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-sm">Meta:</span>
                      <span className="font-medium text-sm">{formatValueWithUnit(data?.meta || 0, unit)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-sm">Realizado:</span>
                      <span className="font-semibold text-sm text-primary">{formatValueWithUnit(data?.realizado || 0, unit)}</span>
                    </div>
                    <div className="border-t border-border pt-1.5 mt-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-sm">Atingimento:</span>
                        <span className={`font-bold text-sm ${status?.color || ''}`}>
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '10px' }}
            formatter={(value) => (
              <span className="text-sm text-foreground">
                {value === 'meta' ? 'Meta' : 'Realizado'}
              </span>
            )}
          />
          <Bar 
            dataKey="meta" 
            fill="hsl(var(--muted-foreground))"
            opacity={0.4}
            radius={[6, 6, 0, 0]}
            name="meta"
            maxBarSize={frequency === 'yearly' ? 120 : 80}
            label={{ 
              position: 'top', 
              formatter: (value: number) => formatValueWithUnit(value, unit),
              style: { 
                fontSize: '11px', 
                fill: 'hsl(var(--muted-foreground))',
                fontWeight: 500
              }
            }}
          />
          <Bar 
            dataKey="realizado" 
            radius={[6, 6, 0, 0]}
            name="realizado"
            maxBarSize={frequency === 'yearly' ? 120 : 80}
            label={{ 
              position: 'top', 
              formatter: (value: number) => formatValueWithUnit(value, unit),
              style: { 
                fontSize: '12px', 
                fill: 'hsl(var(--primary))',
                fontWeight: 600
              }
            }}
          >
            {periodChartData.map((entry, index) => {
              const status = entry.status;
              let fillColor = 'hsl(var(--primary))';
              
              if (status?.isExcellent) {
                fillColor = 'hsl(142.1 76.2% 36.3%)';
              } else if (status?.isGood) {
                fillColor = 'hsl(var(--primary))';
              } else if (entry.percentage >= 50) {
                fillColor = 'hsl(38 92% 50%)';
              } else if (entry.percentage > 0) {
                fillColor = 'hsl(0 84.2% 60.2%)';
              }
              
              return <Cell key={`cell-${index}`} fill={fillColor} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  // ============== Period-based table rendering ==============
  const renderPeriodTable = () => (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-32 bg-background">Indicador</TableHead>
            {periodChartData.map(period => (
              <TableHead 
                key={period.periodKey} 
                className="text-center min-w-28 font-medium"
              >
                {period.period}
              </TableHead>
            ))}
            <TableHead className="text-center min-w-28 bg-muted font-semibold">
              Total Anual
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium bg-background">Meta</TableCell>
            {periodChartData.map(period => (
              <TableCell key={period.periodKey} className="text-center">
                {period.meta > 0 ? formatValueForTable(period.meta, unit) : '-'}
              </TableCell>
            ))}
            <TableCell className="text-center bg-muted/50 font-semibold">
              {targetTotal > 0 ? formatValueForTable(targetTotal, unit) : '-'}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium bg-background">Realizado</TableCell>
            {periodChartData.map(period => (
              <TableCell key={period.periodKey} className="text-center">
                <span className="font-medium text-primary">
                  {period.realizado > 0 ? formatValueForTable(period.realizado, unit) : '-'}
                </span>
              </TableCell>
            ))}
            <TableCell className="text-center bg-muted/50 font-semibold">
              <span className="text-primary">
                {actualTotal > 0 ? formatValueForTable(actualTotal, unit) : '-'}
              </span>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium bg-background">% Atingimento</TableCell>
            {periodChartData.map(period => (
              <TableCell key={period.periodKey} className="text-center">
                {period.meta > 0 ? (
                  <span className={`font-semibold ${period.status?.color || ''}`}>
                    {period.percentage.toFixed(1)}%
                  </span>
                ) : '-'}
              </TableCell>
            ))}
            <TableCell className="text-center bg-muted/50 font-semibold">
              {targetTotal > 0 ? (
                <span className={`font-semibold ${calculateKRStatus(actualTotal, targetTotal, targetDirection).color}`}>
                  {preCalculatedPercentage.toFixed(1)}%
                </span>
              ) : '-'}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );

  // ============== Monthly line chart rendering (original) ==============
  const renderMonthlyChart = () => (
    <div className="h-[270px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 20, right: useDualAxis ? 60 : 35, left: 10, bottom: 5 }}>
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
          <YAxis 
            yAxisId="barAxis"
            orientation="right"
            className="text-xs fill-muted-foreground"
            tickFormatter={(value) => `${value.toLocaleString('pt-BR')}`}
            domain={[0, barAxisMax]}
            label={{ 
              value: 'Total', 
              angle: -90, 
              position: 'insideRight',
              style: { textAnchor: 'middle', fontSize: '12px', fill: 'hsl(var(--muted-foreground))' }
            }}
          />
          <Tooltip 
            formatter={(value: number | null, name: string) => {
              if (value === null || value === undefined || !Number.isFinite(Number(value))) {
                return ['Sem dados', name];
              }
              
              let label = 'Realizado';
              if (name === 'previsto' || name === 'previstoBar') {
                label = 'Previsto (Meta)';
              } else if (name === 'realizado' || name === 'realizadoBar') {
                label = 'Realizado';
              }
              
              return [formatValueWithUnit(Number(value), unit), label];
            }}
            labelFormatter={(label) => label.includes('Total') ? label : `Mês: ${label}`}
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
            }}
          />
          <Legend 
            formatter={(value) => {
              if (value === 'previstoBar' || value === 'realizadoBar') return null;
              
              return (
                <span className="text-sm">
                  {value === 'previsto' ? 'Previsto (Meta)' : 'Realizado'}
                </span>
              );
            }}
          />
          {(() => {
            const validity = getValidityIndices();
            if (!validity) return null;
            return (
              <ReferenceArea
                x1={validity.startMonth}
                x2={validity.endMonth}
                yAxisId="left"
                fill="hsl(142.1 76.2% 36.3%)"
                fillOpacity={0.1}
                strokeOpacity={0.3}
              />
            );
          })()}
          <ReferenceLine y={0} yAxisId="left" stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
          {useDualAxis && <ReferenceLine y={0} yAxisId="right" stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />}
          <ReferenceLine y={0} yAxisId="barAxis" stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
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
          <Bar 
            dataKey="previstoBar"
            yAxisId="barAxis"
            fill="hsl(var(--muted-foreground))"
            opacity={0.5}
            radius={[4, 4, 0, 0]}
            barSize={30}
            name="Previsto (Meta)"
            label={{ 
              position: 'top', 
              formatter: (value: number) => formatValueWithUnit(value, unit),
              style: { fontSize: '11px', fill: 'hsl(var(--muted-foreground))' }
            }}
          />
          <Bar 
            dataKey="realizadoBar"
            yAxisId="barAxis"
            fill="hsl(var(--primary))"
            radius={[4, 4, 0, 0]}
            barSize={30}
            name="Realizado"
            label={{ 
              position: 'top', 
              formatter: (value: number) => formatValueWithUnit(value, unit),
              style: { fontSize: '11px', fill: 'hsl(var(--primary))', fontWeight: 600 }
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );

  // ============== Monthly table rendering (original) ==============
  const renderMonthlyTable = () => (
    <div className="rounded-md border overflow-x-scroll [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar]:block [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-400 [&::-webkit-scrollbar-thumb]:rounded-full" style={{ scrollbarColor: '#9ca3af #f3f4f6', scrollbarWidth: 'thin' }}>
      <Table className="relative">
        <TableHeader>
          <TableRow>
            <TableHead className="w-32 sticky left-0 bg-background z-10 border-r">Indicador</TableHead>
            {months.map(month => {
              const isCurrentMonth = month.key === currentMonth;
              const inValidity = isMonthInValidity(month.key, keyResult.start_month, keyResult.end_month);
              return (
                <TableHead 
                  key={month.key} 
                  className={cn(
                    "text-center min-w-20",
                    inValidity && "bg-green-50 dark:bg-green-900/20 border-b-2 border-green-300 dark:border-green-700"
                  )}
                >
                  {month.name}
                  {isCurrentMonth && (
                    <span className="block text-xs text-primary">(atual)</span>
                  )}
                </TableHead>
              );
            })}
            <TableHead className="text-center min-w-24 bg-muted font-semibold">
              {getAggregationLabel(aggregationType)} <span className="text-xs">{getPeriodLabel()}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium sticky left-0 bg-background z-10 border-r">Previsto</TableCell>
            {months.map(month => {
              const isCurrentMonth = month.key === currentMonth;
              const inValidity = isMonthInValidity(month.key, keyResult.start_month, keyResult.end_month);
              const value = normalizedTargets[month.key];
              const hasValue = value !== null && value !== undefined && Number.isFinite(Number(value));
              return (
                <TableCell 
                  key={month.key} 
                  className={cn(
                    "text-center min-w-20",
                    isCurrentMonth && "bg-blue-50 dark:bg-blue-900/20",
                    !isCurrentMonth && inValidity && "bg-green-50 dark:bg-green-900/20"
                  )}
                >
                  {hasValue ? (
                    <span className={value < 0 ? "text-red-600" : ""}>
                      {formatValueForTable(value, unit)}
                    </span>
                  ) : '-'}
                </TableCell>
              );
            })}
            <TableCell className="text-center bg-gray-100 font-semibold min-w-24">
              {targetTotal !== 0 ? (
                <span className={targetTotal < 0 ? "text-red-600" : ""}>
                  {formatValueForTable(targetTotal, unit)}
                </span>
              ) : '-'}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium sticky left-0 bg-background z-10 border-r">Realizado</TableCell>
            {months.map(month => {
              const isCurrentMonth = month.key === currentMonth;
              const inValidity = isMonthInValidity(month.key, keyResult.start_month, keyResult.end_month);
              const value = normalizedActuals[month.key];
              const hasValue = value !== null && value !== undefined && Number.isFinite(Number(value));
              
              return (
                <TableCell 
                  key={month.key} 
                  className={cn(
                    "text-center min-w-20",
                    isCurrentMonth && "bg-blue-50 dark:bg-blue-900/20",
                    !isCurrentMonth && inValidity && "bg-green-50 dark:bg-green-900/20"
                  )}
                >
                  {hasValue ? (
                    <span className={value < 0 ? "text-red-600 font-semibold" : ""}>
                      {formatValueForTable(value, unit)}
                    </span>
                  ) : '-'}
                </TableCell>
              );
            })}
            <TableCell className="text-center bg-gray-100 font-semibold min-w-24">
              {actualTotal !== 0 ? (
                <span className={actualTotal < 0 ? "text-red-600" : ""}>
                  {formatValueForTable(actualTotal, unit)}
                </span>
              ) : '-'}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium sticky left-0 bg-background z-10 border-r">% Atingimento</TableCell>
            {months.map(month => {
              const isCurrentMonth = month.key === currentMonth;
              const inValidity = isMonthInValidity(month.key, keyResult.start_month, keyResult.end_month);
              const actual = normalizedActuals[month.key];
              const target = normalizedTargets[month.key];
              const hasActual = typeof actual === 'number' && Number.isFinite(actual);
              const hasTarget = typeof target === 'number' && Number.isFinite(target) && target > 0;
              
              const status = hasActual && hasTarget ? calculateKRStatus(actual, target, targetDirection) : null;
              
              return (
                <TableCell 
                  key={month.key} 
                  className={cn(
                    "text-center min-w-20",
                    isCurrentMonth && "bg-blue-50 dark:bg-blue-900/20",
                    !isCurrentMonth && inValidity && "bg-green-50 dark:bg-green-900/20"
                  )}
                >
                  {status ? (
                    <span className={`${status.color} font-semibold`}>
                      {status.percentage.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
              );
            })}
            <TableCell className="text-center bg-gray-100 font-semibold min-w-24">
              {targetTotal !== 0 ? (
                (() => {
                  const totalStatus = calculateKRStatus(actualTotal, targetTotal, targetDirection);
                  return (
                    <span className={`${totalStatus.color} font-semibold`}>
                      {preCalculatedPercentage.toFixed(1)}%
                    </span>
                  );
                })()
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <CardTitle className="text-lg">{getChartTitle()}</CardTitle>
          {isPeriodBased && (
            <Badge className={getFrequencyBadgeColor(frequency)}>
              {getFrequencyLabel(frequency)}
            </Badge>
          )}
          {keyResult.start_month && keyResult.end_month && (
            <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
              📅 {formatValidityPeriod(keyResult.start_month, keyResult.end_month)}
            </Badge>
          )}
          {!isPeriodBased && useDualAxis && (
            <Badge variant="outline" className="text-xs">
              Escalas independentes (3 eixos)
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium whitespace-nowrap">Ano:</Label>
            <Select 
              value={selectedYear.toString()} 
              onValueChange={(value) => onYearChange?.(parseInt(value))}
            >
              <SelectTrigger className="w-24 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {finalYearOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === 'chart' ? (
          isPeriodBased ? renderPeriodChart() : renderMonthlyChart()
        ) : (
          isPeriodBased ? renderPeriodTable() : renderMonthlyTable()
        )}
      </CardContent>
    </Card>
  );
};
