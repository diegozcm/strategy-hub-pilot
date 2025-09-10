import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { KeyResult } from '@/types/strategic-map';
import { KeyResultHistoryTab } from './KeyResultHistoryTab';
import { KeyResultMetrics } from './KeyResultMetrics';
import { KeyResultChart } from './KeyResultChart';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface EditKeyResultModalProps {
  keyResult: KeyResult;
  open: boolean;
  onClose: () => void;
  onSave: (keyResultData: Partial<KeyResult>) => Promise<any>;
  onAggregationTypeChange?: (keyResultId: string, newType: 'sum' | 'average' | 'max' | 'min') => void;
}

export const EditKeyResultModal = ({ keyResult, open, onClose, onSave, onAggregationTypeChange }: EditKeyResultModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [savingAggregationType, setSavingAggregationType] = useState(false);
  const [monthlyActual, setMonthlyActual] = useState<Record<string, number>>({});
  const [monthlyTargets, setMonthlyTargets] = useState<Record<string, number>>({});
  const [status, setStatus] = useState<string>('');
  const [originalMonthlyActual, setOriginalMonthlyActual] = useState<Record<string, number>>({});
  const [originalMonthlyTargets, setOriginalMonthlyTargets] = useState<Record<string, number>>({});
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [aggregationType, setAggregationType] = useState<'sum' | 'average' | 'max' | 'min'>('sum');
  const [editMode, setEditMode] = useState<boolean>(false);

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

  // Função para calcular a meta anual baseada no tipo de agregação
  const calculateYearlyTarget = (targets: Record<string, number>) => {
    const values = Object.values(targets).filter(value => value > 0);
    if (values.length === 0) return 0;

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

  // Função para calcular o valor anual realizado
  const calculateYearlyActual = (actuals: Record<string, number>) => {
    const values = Object.values(actuals).filter(value => value > 0);
    if (values.length === 0) return 0;

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

  // Função para salvar o tipo de agregação
  const saveAggregationType = async (newType: 'sum' | 'average' | 'max' | 'min') => {
    try {
      setSavingAggregationType(true);
      
      // Usar diretamente o supabase client ao invés de onSave para não fechar o modal
      const { error } = await supabase
        .from('key_results')
        .update({ aggregation_type: newType })
        .eq('id', keyResult.id);

      if (error) throw error;

      // Atualizar o estado local
      setAggregationType(newType);
      
      // Notificar o componente pai sobre a mudança
      if (onAggregationTypeChange) {
        onAggregationTypeChange(keyResult.id, newType);
      }

      toast({
        title: "Tipo de cálculo salvo",
        description: "A preferência foi salva com sucesso.",
      });
    } catch (error) {
      console.error('Error saving aggregation type:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o tipo de cálculo.",
        variant: "destructive",
      });
    } finally {
      setSavingAggregationType(false);
    }
  };

  const handleAggregationTypeChange = (newType: 'sum' | 'average' | 'max' | 'min') => {
    setAggregationType(newType);
    saveAggregationType(newType);
  };

  useEffect(() => {
    if (keyResult.monthly_actual) {
      setMonthlyActual(keyResult.monthly_actual as Record<string, number>);
      setOriginalMonthlyActual(keyResult.monthly_actual as Record<string, number>);
    }
    if (keyResult.monthly_targets) {
      setMonthlyTargets(keyResult.monthly_targets as Record<string, number>);
      setOriginalMonthlyTargets(keyResult.monthly_targets as Record<string, number>);
    }
    // Carrega o tipo de agregação salvo ou usa 'sum' como padrão
    if (keyResult.aggregation_type) {
      setAggregationType(keyResult.aggregation_type);
    }
  }, [keyResult]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      console.log('Current monthlyTargets:', monthlyTargets);
      console.log('Current monthlyActual:', monthlyActual);
      
      // Calcular valor anual atual a partir dos valores mensais usando o tipo de agregação
      const yearlyActual = calculateYearlyActual(monthlyActual);

      // Verificar se houve alteração nos valores mensais ou metas
      const valuesChanged = JSON.stringify(monthlyActual) !== JSON.stringify(originalMonthlyActual);
      const targetsChanged = JSON.stringify(monthlyTargets) !== JSON.stringify(originalMonthlyTargets);
      
      console.log('Values changed:', valuesChanged);
      console.log('Targets changed:', targetsChanged);
      
      // Calcular meta anual a partir das metas mensais usando o tipo de agregação
      const yearlyTarget = calculateYearlyTarget(monthlyTargets);
      
      // Se valores foram alterados, mostrar progresso
      if (valuesChanged && yearlyActual > 0) {
        console.log('Values updated, showing progress');
      }

      const dataToSave = {
        id: keyResult.id,
        monthly_actual: monthlyActual,
        monthly_targets: monthlyTargets,
        yearly_actual: yearlyActual,
        yearly_target: yearlyTarget,
        target_value: yearlyTarget, // Atualizar também o target_value para compatibilidade
        current_value: yearlyActual, // Atualizar também o current_value para compatibilidade
        aggregation_type: aggregationType
      };
      
      console.log('Data to save:', dataToSave);

      await onSave(dataToSave);
      
      onClose();
    } catch (error) {
      console.error('Error updating key result:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Atualizar Resultado-Chave</DialogTitle>
          <DialogDescription>
            Atualize os valores realizados mensalmente para "{keyResult.title}"
          </DialogDescription>
        </DialogHeader>
        
        {/* Indicadores e Gráfico na parte superior */}
        <KeyResultMetrics
          yearlyTarget={calculateYearlyTarget(monthlyTargets)}
          yearlyActual={calculateYearlyActual(monthlyActual)}
          unit={keyResult.unit || ''}
          achievementPercentage={(() => {
            const target = calculateYearlyTarget(monthlyTargets);
            const actual = calculateYearlyActual(monthlyActual);
            return target > 0 ? (actual / target) * 100 : 0;
          })()}
          currentMonth={new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        />
        
        <KeyResultChart
          monthlyTargets={monthlyTargets}
          monthlyActual={monthlyActual}
          unit={keyResult.unit || ''}
          selectedYear={selectedYear}
        />
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs defaultValue="monthly-data" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info">Informações</TabsTrigger>
              <TabsTrigger value="monthly-data">Dados Mensais</TabsTrigger>
              <TabsTrigger value="history">Histórico</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Meta Anual</Label>
                  <p className="text-lg font-semibold">
                    {calculateYearlyTarget(monthlyTargets).toFixed(2)} {keyResult.unit}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Realizado no Ano</Label>
                  <p className="text-lg font-semibold">
                    {calculateYearlyActual(monthlyActual).toFixed(2)} {keyResult.unit}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Informações Adicionais</Label>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    O progresso é calculado automaticamente com base nos valores realizados.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">% de Atingimento:</span>
                  <span className="text-lg font-bold">
                    {(() => {
                      const totalTarget = calculateYearlyTarget(monthlyTargets);
                      const totalActual = calculateYearlyActual(monthlyActual);
                      return totalTarget > 0 ? ((totalActual / totalTarget) * 100).toFixed(1) : '0.0';
                    })()}%
                  </span>
                </div>
              </div>

              {keyResult.responsible && (
                <div>
                  <Label className="text-sm font-medium">Responsável</Label>
                  <p className="text-sm text-muted-foreground">{keyResult.responsible}</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="monthly-data" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="space-y-2">
                    <Label>Dados Mensais ({selectedYear})</Label>
                    <p className="text-sm text-muted-foreground">
                      Gerencie os valores previstos e realizados para cada mês.
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

                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="edit-mode"
                        checked={editMode}
                        onCheckedChange={setEditMode}
                      />
                      <Label htmlFor="edit-mode" className="text-sm font-medium">
                        Modo Edição de Metas
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Habilite para editar os valores previstos (metas)
                    </p>
                  </div>
                </div>

                {editMode && (
                  <div className="p-4 border rounded-lg bg-muted/30">
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Como calcular a meta anual?</Label>
                      <div className="relative">
                        <Select 
                          value={aggregationType} 
                          onValueChange={handleAggregationTypeChange}
                          disabled={savingAggregationType}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sum">Somar todas as metas mensais</SelectItem>
                            <SelectItem value="average">Calcular a média das metas mensais</SelectItem>
                            <SelectItem value="max">Usar o maior valor entre as metas</SelectItem>
                            <SelectItem value="min">Usar o menor valor entre as metas</SelectItem>
                          </SelectContent>
                        </Select>
                        {savingAggregationType && (
                          <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
                            <LoadingSpinner size="sm" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {aggregationType === 'sum' && 'A meta anual será a soma de todas as metas mensais'}
                        {aggregationType === 'average' && 'A meta anual será a média de todas as metas mensais'}
                        {aggregationType === 'max' && 'A meta anual será o maior valor entre as metas mensais'}
                        {aggregationType === 'min' && 'A meta anual será o menor valor entre as metas mensais'}
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="grid grid-cols-5 gap-4 p-3 bg-muted/30 rounded-lg font-medium text-sm">
                    <div>Mês</div>
                    <div className="text-center">Previsto (Meta)</div>
                    <div className="text-center">Realizado (Indicador Atual)</div>
                    <div className="text-center">% Atingimento</div>
                    <div className="text-center">Unidade</div>
                  </div>
                  
                  {months.map((month) => {
                    const target = monthlyTargets[month.key] || 0;
                    const actual = monthlyActual[month.key] || 0;
                    const percentage = target > 0 ? (actual / target) * 100 : 0;

                    return (
                      <div key={month.key} className="grid grid-cols-5 gap-4 items-center p-3 border rounded-lg hover:bg-muted/20">
                        <div>
                          <Label className="text-sm font-medium">{month.name}</Label>
                        </div>
                        <div>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0"
                            value={monthlyTargets[month.key] || ''}
                            disabled={!editMode}
                            onChange={(e) => {
                              const value = e.target.value ? parseFloat(e.target.value) : 0;
                              setMonthlyTargets(prev => ({
                                ...prev,
                                [month.key]: value
                              }));
                            }}
                            className={!editMode ? "bg-muted text-muted-foreground" : ""}
                          />
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
                            percentage >= 80 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {target > 0 ? `${percentage.toFixed(1)}%` : '-'}
                          </span>
                        </div>
                        <div className="text-center">
                          <span className="text-sm text-muted-foreground">{keyResult.unit || ''}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-4 bg-muted rounded-lg space-y-3">
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>Tipo de Cálculo:</span>
                    <span className="font-medium">
                      {aggregationType === 'sum' && 'Soma das metas mensais'}
                      {aggregationType === 'average' && 'Média das metas mensais'}
                      {aggregationType === 'max' && 'Maior valor mensal'}
                      {aggregationType === 'min' && 'Menor valor mensal'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-background rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Meta Anual</div>
                      <div className="text-lg font-bold text-primary">
                        {calculateYearlyTarget(monthlyTargets).toFixed(2)} {keyResult.unit}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-background rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Realizado no Ano</div>
                      <div className="text-lg font-bold text-green-600">
                        {calculateYearlyActual(monthlyActual).toFixed(2)} {keyResult.unit}
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Progresso Anual:</span>
                      <span className="text-lg font-bold">
                        {(() => {
                          const target = calculateYearlyTarget(monthlyTargets);
                          const actual = calculateYearlyActual(monthlyActual);
                          const progress = target > 0 ? ((actual / target) * 100) : 0;
                          return (
                            <span className={`${
                              progress >= 100 ? 'text-green-600' : 
                              progress >= 80 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {progress.toFixed(1)}%
                            </span>
                          );
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <KeyResultHistoryTab keyResult={keyResult} />
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              Salvar Atualizações
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};