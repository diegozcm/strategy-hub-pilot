import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { KeyResult } from '@/types/strategic-map';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface KREditModalProps {
  keyResult: KeyResult | null;
  open: boolean;
  onClose: () => void;
  onSave: (keyResultData: Partial<KeyResult>) => Promise<any>;
  objectives?: Array<{ id: string; title: string; }>;
}

export const KREditModal = ({ keyResult, open, onClose, onSave, objectives = [] }: KREditModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [savingAggregationType, setSavingAggregationType] = useState(false);
  
  // Form states
  const [basicInfo, setBasicInfo] = useState({
    title: '',
    description: '',
    unit: '',
    responsible: '',
    objective_id: ''
  });
  
  const [monthlyTargets, setMonthlyTargets] = useState<Record<string, number>>({});
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

  // Calculate functions
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

  // Save aggregation type
  const saveAggregationType = async (newType: 'sum' | 'average' | 'max' | 'min') => {
    if (!keyResult) return;
    
    try {
      setSavingAggregationType(true);
      
      const { error } = await supabase
        .from('key_results')
        .update({ aggregation_type: newType })
        .eq('id', keyResult.id);

      if (error) throw error;

      setAggregationType(newType);
      
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

  // Initialize form when keyResult changes
  useEffect(() => {
    if (keyResult) {
      setBasicInfo({
        title: keyResult.title,
        description: keyResult.description || '',
        unit: keyResult.unit || '',
        responsible: keyResult.responsible || '',
        objective_id: keyResult.objective_id || 'none'
      });
      
      setMonthlyTargets(keyResult.monthly_targets as Record<string, number> || {});
      setAggregationType(keyResult.aggregation_type || 'sum');
    }
  }, [keyResult]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyResult) return;
    
    try {
      setLoading(true);
      
      const yearlyTarget = calculateYearlyTarget(monthlyTargets);

      const dataToSave = {
        id: keyResult.id,
        title: basicInfo.title,
        description: basicInfo.description,
        unit: basicInfo.unit,
        responsible: basicInfo.responsible,
        objective_id: basicInfo.objective_id === '' || basicInfo.objective_id === 'none' ? null : basicInfo.objective_id,
        monthly_targets: monthlyTargets,
        yearly_target: yearlyTarget,
        target_value: yearlyTarget,
        aggregation_type: aggregationType
      };

      await onSave(dataToSave);
      onClose();
    } catch (error) {
      console.error('Error updating key result:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!keyResult) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Resultado-Chave</DialogTitle>
          <DialogDescription>
            Edite as informações básicas e metas mensais do resultado-chave
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs defaultValue="basic-info" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic-info">Informações Básicas</TabsTrigger>
              <TabsTrigger value="monthly-targets">Metas Mensais</TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic-info" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={basicInfo.title}
                    onChange={(e) => setBasicInfo({...basicInfo, title: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="unit">Unidade *</Label>
                  <Select 
                    value={basicInfo.unit} 
                    onValueChange={(value) => setBasicInfo({...basicInfo, unit: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="%">% (Percentual)</SelectItem>
                      <SelectItem value="R$">R$ (Reais)</SelectItem>
                      <SelectItem value="un">Unidades</SelectItem>
                      <SelectItem value="h">Horas</SelectItem>
                      <SelectItem value="dias">Dias</SelectItem>
                      <SelectItem value="pontos">Pontos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={basicInfo.description}
                  onChange={(e) => setBasicInfo({...basicInfo, description: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="responsible">Responsável</Label>
                  <Input
                    id="responsible"
                    value={basicInfo.responsible}
                    onChange={(e) => setBasicInfo({...basicInfo, responsible: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="objective">Objetivo Estratégico</Label>
                  <Select 
                    value={basicInfo.objective_id} 
                    onValueChange={(value) => setBasicInfo({...basicInfo, objective_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um objetivo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum objetivo</SelectItem>
                      {objectives.map((objective) => (
                        <SelectItem key={objective.id} value={objective.id}>
                          {objective.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            {/* Monthly Targets Tab */}
            <TabsContent value="monthly-targets" className="space-y-4 mt-4">
              <div className="flex justify-between items-center">
                <div className="space-y-2">
                  <Label>Metas Mensais ({selectedYear})</Label>
                  <p className="text-sm text-muted-foreground">
                    Defina as metas para cada mês do ano selecionado.
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

              <div className="p-4 border rounded-lg bg-muted/30">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Como calcular a meta anual?</Label>
                  <div className="relative">
                    <Select 
                      value={aggregationType} 
                      onValueChange={(value) => {
                        setAggregationType(value as 'sum' | 'average' | 'max' | 'min');
                        saveAggregationType(value as 'sum' | 'average' | 'max' | 'min');
                      }}
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
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-4 gap-4 p-3 bg-muted/30 rounded-lg font-medium text-sm">
                  <div>Mês</div>
                  <div className="text-center">Meta</div>
                  <div className="text-center">Meta Anual Calculada</div>
                  <div className="text-center">Unidade</div>
                </div>
                
                {months.map((month) => (
                  <div key={month.key} className="grid grid-cols-4 gap-4 items-center p-3 border rounded-lg">
                    <div>
                      <Label className="text-sm font-medium">{month.name}</Label>
                    </div>
                    <div>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0"
                        value={monthlyTargets[month.key] || ''}
                        onChange={(e) => {
                          const value = e.target.value ? parseFloat(e.target.value) : 0;
                          setMonthlyTargets(prev => ({
                            ...prev,
                            [month.key]: value
                          }));
                        }}
                      />
                    </div>
                    <div className="text-center text-sm font-medium">
                      {calculateYearlyTarget(monthlyTargets).toFixed(2)}
                    </div>
                    <div className="text-center text-sm text-muted-foreground">
                      {basicInfo.unit}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

          </Tabs>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <LoadingSpinner size="sm" className="mr-2" />}
              Salvar Atualizações
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};