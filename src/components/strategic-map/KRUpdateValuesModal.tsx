import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KeyResult } from '@/types/strategic-map';
import { useToast } from '@/hooks/use-toast';
import { X } from 'lucide-react';
import { calculateKRStatus } from '@/lib/krHelpers';
import { cn } from '@/lib/utils';

// Função para verificar se um mês está dentro da vigência
const isMonthInValidity = (monthKey: string, startMonth?: string | null, endMonth?: string | null): boolean => {
  if (!startMonth || !endMonth) return false;
  return monthKey >= startMonth && monthKey <= endMonth;
};

// Função para formatar a vigência para exibição
const formatValidityPeriod = (startMonth?: string | null, endMonth?: string | null): string | null => {
  if (!startMonth || !endMonth) return null;
  
  const formatMonth = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${monthNames[parseInt(month) - 1]}/${year}`;
  };
  
  return `${formatMonth(startMonth)} até ${formatMonth(endMonth)}`;
};

interface KRUpdateValuesModalProps {
  keyResult: KeyResult | null;
  open: boolean;
  onClose: () => void;
  onSave: (keyResultData: Partial<KeyResult>) => Promise<any>;
}

export const KRUpdateValuesModal = ({ keyResult, open, onClose, onSave }: KRUpdateValuesModalProps) => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [monthlyActual, setMonthlyActual] = useState<Record<string, number>>({});
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>('');

  // Formata número para padrão brasileiro (xxx.xxx.xxx,xx)
  const formatBrazilianNumber = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '';
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Remove formatação e converte para número
  const parseBrazilianNumber = (value: string): number | null => {
    if (!value || value.trim() === '') return null;
    // Remove pontos (separador de milhar) e substitui vírgula por ponto
    const cleaned = value.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  };

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
    const values = Object.values(actuals).filter(value => 
      value !== null && value !== undefined && !isNaN(value)
    );
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
      // Merge dos dados existentes com os novos dados do ano selecionado
      const existingMonthlyActual = (keyResult.monthly_actual as Record<string, number>) || {};
      
      // Limpar valores vazios ou inválidos do monthly_actual do ano atual
      const cleanCurrentYearActual = Object.fromEntries(
        Object.entries(monthlyActual)
          .filter(([_, value]) => typeof value === 'number' && !isNaN(value))
      );
      
      // Preservar dados de outros anos e atualizar apenas o ano selecionado
      const mergedMonthlyActual = { ...existingMonthlyActual };
      Object.keys(mergedMonthlyActual).forEach(key => {
        if (key.startsWith(`${selectedYear}-`)) {
          delete mergedMonthlyActual[key];
        }
      });
      Object.assign(mergedMonthlyActual, cleanCurrentYearActual);

      const yearlyActual = calculateYearlyActual(cleanCurrentYearActual);

      await onSave({
        id: keyResult.id,
        monthly_actual: mergedMonthlyActual,
        yearly_actual: yearlyActual,
        current_value: yearlyActual,
      });

      toast({
        title: "Sucesso",
        description: "Valores atualizados com sucesso!",
      });

      onClose();
    } catch (error) {
      console.error('Error updating values:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar os valores. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!keyResult) return null;

  const monthlyTargets = keyResult.monthly_targets as Record<string, number> || {};

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[920px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Atualizar Valores - {keyResult.title}</DialogTitle>
          <DialogDescription>
            Atualize os valores realizados mensais para este resultado-chave
          </DialogDescription>
        </DialogHeader>

        {keyResult.start_month && keyResult.end_month && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm font-medium text-green-700 dark:text-green-300">
              📅 Vigência: {formatValidityPeriod(keyResult.start_month, keyResult.end_month)}
            </p>
          </div>
        )}
        
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="flex items-start gap-6">
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
            
            <div className="space-y-2">
              <Label>Valores Realizados ({selectedYear})</Label>
              <p className="text-sm text-muted-foreground">
                Atualize os valores realizados para cada mês.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-[150px_180px_240px_140px_50px] gap-4 p-3 bg-muted/30 rounded-lg font-medium text-sm">
              <div>Mês</div>
              <div className="text-center">Meta ({selectedYear})</div>
              <div className="text-center">Realizado</div>
              <div className="text-center">% Atingimento</div>
              <div className="text-center">Unidade</div>
            </div>
            
            {months.map((month, index) => {
              const target = monthlyTargets[month.key] || 0;
              const actual = monthlyActual[month.key] ?? null;
              const status = actual !== null && target !== 0 
                ? calculateKRStatus(actual, target, keyResult.target_direction || 'maximize')
                : null;
              const percentage = status?.percentage ?? null;

              return (
                <div 
                  key={month.key} 
                  className={cn(
                    "grid grid-cols-[150px_180px_240px_140px_50px] gap-4 items-center p-3 border rounded-lg",
                    isMonthInValidity(month.key, keyResult.start_month, keyResult.end_month) && 
                      "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                  )}
                >
                  <div className="font-medium text-sm">
                    {month.name}
                  </div>
                  <div className="text-right text-base font-medium pr-2">
                    {formatBrazilianNumber(target)}
                  </div>
                  <div className="flex gap-1 items-center">
                    <Input
                      type="text"
                      placeholder="0,00"
                      tabIndex={index + 1}
                      value={editingField === month.key 
                        ? tempValue 
                        : (monthlyActual[month.key] !== undefined 
                            ? formatBrazilianNumber(monthlyActual[month.key]) 
                            : '')
                      }
                      onFocus={() => {
                        setEditingField(month.key);
                        setTempValue(monthlyActual[month.key]?.toString() || '');
                      }}
                      onChange={(e) => {
                        setTempValue(e.target.value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Tab' && !e.shiftKey && index < months.length - 1) {
                          e.preventDefault();
                          const nextInput = document.querySelector(`input[tabindex="${index + 2}"]`) as HTMLInputElement;
                          if (nextInput) {
                            nextInput.focus();
                          }
                        } else if (e.key === 'Tab' && e.shiftKey && index > 0) {
                          e.preventDefault();
                          const prevInput = document.querySelector(`input[tabindex="${index}"]`) as HTMLInputElement;
                          if (prevInput) {
                            prevInput.focus();
                          }
                        } else if (e.key === 'Enter') {
                          e.preventDefault();
                          (e.target as HTMLInputElement).blur();
                          if (index < months.length - 1) {
                            const nextInput = document.querySelector(`input[tabindex="${index + 2}"]`) as HTMLInputElement;
                            if (nextInput) {
                              nextInput.focus();
                            }
                          }
                        }
                      }}
                      onBlur={() => {
                        const value = parseBrazilianNumber(tempValue);
                        if (tempValue === '' || tempValue === '-') {
                          setMonthlyActual(prev => {
                            const newActual = { ...prev };
                            delete newActual[month.key];
                            return newActual;
                          });
                        } else if (value !== null) {
                          setMonthlyActual(prev => ({
                            ...prev,
                            [month.key]: value
                          }));
                        }
                        setEditingField(null);
                        setTempValue('');
                      }}
                      className="flex-1 text-right font-mono text-base"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0"
                      onClick={() => {
                        setMonthlyActual(prev => {
                          const newActual = { ...prev };
                          delete newActual[month.key];
                          return newActual;
                        });
                      }}
                      title="Limpar valor realizado"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-center">
                    {percentage !== null && status ? (
                      <span className={`text-sm font-medium ${status.color}`}>
                        {percentage.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
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