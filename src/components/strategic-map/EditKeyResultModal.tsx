import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KeyResult } from '@/types/strategic-map';

interface EditKeyResultModalProps {
  keyResult: KeyResult;
  open: boolean;
  onClose: () => void;
  onSave: (keyResultData: Partial<KeyResult>) => Promise<any>;
}

export const EditKeyResultModal = ({ keyResult, open, onClose, onSave }: EditKeyResultModalProps) => {
  const [loading, setLoading] = useState(false);
  const [monthlyActual, setMonthlyActual] = useState<Record<string, number>>({});
  const [status, setStatus] = useState<string>('');
  const [originalMonthlyActual, setOriginalMonthlyActual] = useState<Record<string, number>>({});

  const currentYear = new Date().getFullYear();
  const months = [
    { key: `${currentYear}-01`, name: 'Janeiro', short: 'Jan' },
    { key: `${currentYear}-02`, name: 'Fevereiro', short: 'Fev' },
    { key: `${currentYear}-03`, name: 'Março', short: 'Mar' },
    { key: `${currentYear}-04`, name: 'Abril', short: 'Abr' },
    { key: `${currentYear}-05`, name: 'Maio', short: 'Mai' },
    { key: `${currentYear}-06`, name: 'Junho', short: 'Jun' },
    { key: `${currentYear}-07`, name: 'Julho', short: 'Jul' },
    { key: `${currentYear}-08`, name: 'Agosto', short: 'Ago' },
    { key: `${currentYear}-09`, name: 'Setembro', short: 'Set' },
    { key: `${currentYear}-10`, name: 'Outubro', short: 'Out' },
    { key: `${currentYear}-11`, name: 'Novembro', short: 'Nov' },
    { key: `${currentYear}-12`, name: 'Dezembro', short: 'Dez' },
  ];

  useEffect(() => {
    if (keyResult.monthly_actual) {
      setMonthlyActual(keyResult.monthly_actual as Record<string, number>);
      setOriginalMonthlyActual(keyResult.monthly_actual as Record<string, number>);
    }
    setStatus(keyResult.status || 'not_started');
  }, [keyResult]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Calcular valor anual atual a partir dos valores mensais
      const yearlyActual = Object.values(monthlyActual).reduce((sum, value) => sum + (value || 0), 0);

      // Verificar se houve alteração nos valores mensais
      const valuesChanged = JSON.stringify(monthlyActual) !== JSON.stringify(originalMonthlyActual);
      
      // Determinar o status final
      let finalStatus = status;
      
      // Se valores foram alterados e o status atual é "not_started", mudar para "in_progress"
      if (valuesChanged && keyResult.status === 'not_started' && status === 'not_started') {
        finalStatus = 'in_progress';
      }

      await onSave({
        id: keyResult.id,
        monthly_actual: monthlyActual,
        yearly_actual: yearlyActual,
        current_value: yearlyActual, // Atualizar também o current_value para compatibilidade
        status: finalStatus
      });
      
      onClose();
    } catch (error) {
      console.error('Error updating key result:', error);
    } finally {
      setLoading(false);
    }
  };

  const monthlyTargets = (keyResult.monthly_targets as Record<string, number>) || {};

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Atualizar Resultado-Chave</DialogTitle>
          <DialogDescription>
            Atualize os valores realizados mensalmente para "{keyResult.title}"
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs defaultValue="monthly" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="info">Informações</TabsTrigger>
              <TabsTrigger value="monthly">Valores Mensais</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Meta Anual</Label>
                  <p className="text-lg font-semibold">{keyResult.yearly_target || keyResult.target_value} {keyResult.unit}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Realizado no Ano</Label>
                  <p className="text-lg font-semibold">
                    {Object.values(monthlyActual).reduce((sum, value) => sum + (value || 0), 0).toFixed(2)} {keyResult.unit}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Não iniciado</SelectItem>
                    <SelectItem value="in_progress">Em progresso</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="suspended">Suspenso</SelectItem>
                  </SelectContent>
                </Select>
                {JSON.stringify(monthlyActual) !== JSON.stringify(originalMonthlyActual) && 
                 keyResult.status === 'not_started' && 
                 status === 'not_started' && (
                  <p className="text-xs text-muted-foreground">
                    💡 Como você está atualizando valores, o status será alterado automaticamente para "Em progresso"
                  </p>
                )}
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">% de Atingimento:</span>
                  <span className="text-lg font-bold">
                    {((Object.values(monthlyActual).reduce((sum, value) => sum + (value || 0), 0) / (keyResult.yearly_target || keyResult.target_value)) * 100).toFixed(1)}%
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

            <TabsContent value="monthly" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Valores Realizados por Mês ({currentYear})</Label>
                <p className="text-sm text-muted-foreground">
                  Atualize os valores que foram efetivamente realizados em cada mês.
                </p>
              </div>

              <div className="space-y-4">
                {months.map((month) => {
                  const target = monthlyTargets[month.key] || 0;
                  const actual = monthlyActual[month.key] || 0;
                  const percentage = target > 0 ? (actual / target) * 100 : 0;

                  return (
                    <div key={month.key} className="grid grid-cols-4 gap-4 items-center p-3 border rounded-lg">
                      <div>
                        <Label className="text-sm font-medium">{month.name}</Label>
                      </div>
                      <div className="text-center">
                        <Label className="text-xs text-muted-foreground">Meta</Label>
                        <p className="text-sm font-medium">{target}</p>
                      </div>
                      <div>
                        <Label htmlFor={`actual-${month.key}`} className="text-xs text-muted-foreground">
                          Realizado
                        </Label>
                        <Input
                          id={`actual-${month.key}`}
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
                        <Label className="text-xs text-muted-foreground">% Atingimento</Label>
                        <p className={`text-sm font-medium ${
                          percentage >= 100 ? 'text-green-600' : 
                          percentage >= 80 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {target > 0 ? `${percentage.toFixed(1)}%` : '-'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Realizado no Ano:</span>
                  <span className="text-lg font-bold">
                    {Object.values(monthlyActual).reduce((sum, value) => sum + (value || 0), 0).toFixed(2)} {keyResult.unit}
                  </span>
                </div>
              </div>
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