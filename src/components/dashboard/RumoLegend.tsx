import { Card } from '@/components/ui/card';

export const RumoLegend = () => {
  return (
    <Card className="p-4 bg-card/50 backdrop-blur">
      <h3 className="text-sm font-semibold mb-3 text-foreground">Legenda de Performance</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500 border border-red-600" />
          <span className="text-xs text-muted-foreground">≤ 70% Crítico</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-500 border border-yellow-600" />
          <span className="text-xs text-muted-foreground">71-90% Atenção</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500 border border-green-600" />
          <span className="text-xs text-muted-foreground">91-105% No Alvo</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-500 border border-blue-600" />
          <span className="text-xs text-muted-foreground">&gt; 105% Superado</span>
        </div>
      </div>
    </Card>
  );
};
