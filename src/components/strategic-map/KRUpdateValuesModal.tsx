import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KeyResult } from '@/types/strategic-map';

interface KRUpdateValuesModalProps {
  keyResult: KeyResult | null;
  open: boolean;
  onClose: () => void;
  onSave: (keyResultData: Partial<KeyResult>) => Promise<any>;
}

export const KRUpdateValuesModal = ({ keyResult, open, onClose, onSave }: KRUpdateValuesModalProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [monthlyActual, setMonthlyActual] = useState<Record<string, number>>({});
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const currentYear = new Date().getFullYear();
  const months = [
    { key: `${selectedYear}-01`, name: 'Janeiro', short: 'Jan' },
    { key: `${selectedYear}-02`, name: 'Fevereiro', short: 'Fev' },
    { key: `${selectedYear}-03`, name: 'Março', short: 'Mar' },
    { key: `${selectedYear}-04`, name: 'Abril', short: 'Abr' },
    { key: `${selectedYear}-05`, name: 'Maio', short: 'Mai' },
    { key: `${selectedYear}-06`, name: 'Junho', short: 'Jun' },
    { key: `${selectedYear}-07`, name: 'Julho', short: 'Jul' },
    { key: `${selectedYear}-08`, name: 'Agosto', short: 'Ago' },
    { key: `${selectedYear}-09`, name: 'Setembro', short: 'Set' },
    { key: `${selectedYear}-10`, name: 'Outubro', short: 'Out' },
    { key: `${selectedYear}-11`, name: 'Novembro', short: 'Nov' },
    { key: `${selectedYear}-12`, name: 'Dezembro', short: 'Dez' },
  ];

  // Generate year options (from 2020 to current year + 5)
  const yearOptions = [];
  for (let year = 2020; year <= currentYear + 5; year++) {
    yearOptions.push(year);
  }

  // Calculate yearly actual based on aggregation type
  const calculateYearlyActual = (actuals: Record<string, number>) => {
    const values = Object.values(actuals).filter(value => value > 0);
    if (values.length === 0) return 0;

    const aggregationType = keyResult?.aggregation_type || 'sum';
    
    switch (aggregationType) {
      case 'sum':
        return values.reduce((sum, value) => sum + value, 0);
      case 'average':
        return values.reduce((sum, value) => sum + value, 0) / values.length;
      case 'max':
        return Math.max(...values);
      case 'min':
        return Math.min(...values);
      default:
        return values.reduce((sum, value) => sum + value, 0);
    }
  };

  // Initialize form when keyResult changes
  useEffect(() => {
    if (keyResult) {
      setMonthlyActual(keyResult.monthly_actual as Record<string, number> || {});
    }
  }, [keyResult]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyResult || isSaving) return;
    
    setIsSaving(true);
    
    try {
      const yearlyActual = calculateYearlyActual(monthlyActual);
      
      const cleanMonthlyActual = Object.fromEntries(
        Object.entries(monthlyActual)
          .filter(([_, value]) => typeof value === 'number' && !isNaN(value))
      );

      await onSave({
        id: keyResult.id,
        monthly_actual: cleanMonthlyActual,
        yearly_actual: yearlyActual,
        current_value: yearlyActual,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!keyResult) return null;

  const monthlyTargets = keyResult.monthly_targets as Record<string, number> || {};

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Atualizar Valores - {keyResult.title}</DialogTitle>
          <DialogDescription>
            Atualize os valores realizados mensais para este resultado-chave
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <Label>Valores Realizados ({selectedYear})</Label>
              <p className="text-sm text-muted-foreground">
                Atualize os valores realizados para cada mês.
              </p>
            </div>
            
            <div className="w-32">
              <Label className="text-sm font-medium">Ano</Label>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-5 gap-4 p-3 bg-muted/30 rounded-lg font-medium text-sm">
              <div>Mês</div>
              <div className="text-center">Meta</div>
              <div className="text-center">Realizado</div>
              <div className="text-center">% Atingimento</div>
              <div className="text-center">Unidade</div>
            </div>
            
            {months.map((month) => {
              const target = monthlyTargets[month.key] || 0;
              const actual = monthlyActual[month.key] || 0;
              const percentage = target > 0 ? (actual / target) * 100 : 0;

              return (
                <div key={month.key} className="grid grid-cols-5 gap-4 items-center p-3 border rounded-lg">
                  <div>
                    <Label className="text-sm font-medium">{month.name}</Label>
                  </div>
                  <div className="text-center text-sm">
                    {target.toFixed(2)}
                  </div>
                  <div>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0"
                      value={monthlyActual[month.key] || ''}
                      onChange={(e) => {
                        const value = e.target.value ? parseFloat(e.target.value) : 0;
                        setMonthlyActual(prev => ({
                          ...prev,
                          [month.key]: value
                        }));
                      }}
                    />
                  </div>
                  <div className="text-center">
                    <span className={`text-sm font-medium ${
                      percentage >= 100 ? 'text-green-600' :
                      percentage >= 80 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-center text-sm text-muted-foreground">
                    {keyResult.unit}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar Valores'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};