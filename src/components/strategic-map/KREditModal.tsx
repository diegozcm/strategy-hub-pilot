import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { KeyResult } from '@/types/strategic-map';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getDirectionLabel, getDirectionDescription, type TargetDirection } from '@/lib/krHelpers';
import { useAuth } from '@/hooks/useMultiTenant';
import { useCompanyUsers } from '@/hooks/useCompanyUsers';
import { cn } from '@/lib/utils';

// Função para verificar se um mês está dentro da vigência
const isMonthInValidity = (monthKey: string, startMonth?: string, endMonth?: string): boolean => {
  if (!startMonth || !endMonth) return false;
  return monthKey >= startMonth && monthKey <= endMonth;
};

// Função para formatar a vigência para exibição
const formatValidityPeriod = (startMonth?: string, endMonth?: string): string | null => {
  if (!startMonth || !endMonth) return null;
  
  const formatMonth = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${monthNames[parseInt(month) - 1]}/${year}`;
  };
  
  return `${formatMonth(startMonth)} até ${formatMonth(endMonth)}`;
};

interface KREditModalProps {
  keyResult: KeyResult | null;
  open: boolean;
  onClose: () => void;
  onSave: (keyResultData: Partial<KeyResult>) => Promise<any>;
  objectives?: Array<{ id: string; title: string; }>;
}

export const KREditModal = ({ keyResult, open, onClose, onSave, objectives = [] }: KREditModalProps) => {
  const { toast } = useToast();
  const { company } = useAuth();
  const { users: companyUsers, loading: loadingUsers } = useCompanyUsers(company?.id);
  const [savingAggregationType, setSavingAggregationType] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Form states
  const [basicInfo, setBasicInfo] = useState({
    title: '',
    description: '',
    unit: '',
    responsible: '',
    objective_id: '',
    target_direction: 'maximize' as TargetDirection,
    start_month: '',
    end_month: '',
    assigned_owner_id: ''
  });
  
  const [monthlyTargets, setMonthlyTargets] = useState<Record<string, number>>({});
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [aggregationType, setAggregationType] = useState<'sum' | 'average' | 'max' | 'min'>('sum');
  const [editMode, setEditMode] = useState<boolean>(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>('');

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
    const cleaned = value.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
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

  // Validation function
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!basicInfo.title.trim()) {
      newErrors.title = 'Título é obrigatório';
    }
    
    if (!basicInfo.unit) {
      newErrors.unit = 'Unidade é obrigatória';
    }
    
    if (!basicInfo.target_direction) {
      newErrors.target_direction = 'Direcionamento é obrigatório';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Initialize form when keyResult changes
  useEffect(() => {
    if (keyResult) {
      setBasicInfo({
        title: keyResult.title,
        description: keyResult.description || '',
        unit: keyResult.unit || '',
        responsible: keyResult.responsible || '',
        objective_id: keyResult.objective_id || 'none',
        target_direction: (keyResult.target_direction as TargetDirection) || 'maximize',
        start_month: keyResult.start_month || '',
        end_month: keyResult.end_month || '',
        assigned_owner_id: keyResult.assigned_owner_id || ''
      });
      
      setAggregationType(keyResult.aggregation_type || 'sum');
      setErrors({}); // Clear errors when opening modal
    }
  }, [keyResult]);

  // Filtrar dados do ano selecionado quando o ano mudar
  useEffect(() => {
    if (keyResult) {
      // Filtrar monthly_targets para o ano selecionado
      const filteredTargets: Record<string, number> = {};
      if (keyResult.monthly_targets) {
        Object.entries(keyResult.monthly_targets as Record<string, number>).forEach(([key, value]) => {
          if (key.startsWith(`${selectedYear}-`)) {
            filteredTargets[key] = value;
          }
        });
      }
      
      setMonthlyTargets(filteredTargets);
    }
  }, [selectedYear, keyResult]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyResult || isSaving) return;
    
    // Validate before proceeding
    if (!validateForm()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Merge dos dados existentes com os novos dados do ano selecionado
      const existingMonthlyTargets = (keyResult.monthly_targets as Record<string, number>) || {};
      
      // Limpar valores vazios ou inválidos do monthly_targets do ano atual
      const cleanCurrentYearTargets = Object.fromEntries(
        Object.entries(monthlyTargets)
          .filter(([_, value]) => typeof value === 'number' && !isNaN(value))
      );
      
      // Preservar dados de outros anos e atualizar apenas o ano selecionado
      const mergedMonthlyTargets = { ...existingMonthlyTargets };
      Object.keys(mergedMonthlyTargets).forEach(key => {
        if (key.startsWith(`${selectedYear}-`)) {
          delete mergedMonthlyTargets[key];
        }
      });
      Object.assign(mergedMonthlyTargets, cleanCurrentYearTargets);

      const yearlyTarget = calculateYearlyTarget(cleanCurrentYearTargets);

      await onSave({
        id: keyResult.id,
        title: basicInfo.title,
        description: basicInfo.description,
        unit: basicInfo.unit,
        responsible: basicInfo.responsible,
        objective_id: basicInfo.objective_id === '' || basicInfo.objective_id === 'none' ? null : basicInfo.objective_id,
        monthly_targets: mergedMonthlyTargets,
        yearly_target: yearlyTarget,
        target_value: yearlyTarget,
        aggregation_type: aggregationType,
        target_direction: basicInfo.target_direction,
        start_month: basicInfo.start_month || null,
        end_month: basicInfo.end_month || null,
        assigned_owner_id: basicInfo.assigned_owner_id === 'none' || basicInfo.assigned_owner_id === '' ? null : basicInfo.assigned_owner_id
      });

      toast({
        title: "Sucesso",
        description: "Resultado-chave atualizado com sucesso!",
      });

      onClose();
    } catch (error) {
      console.error('Error saving key result:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as alterações. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
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
        
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <Tabs defaultValue="basic-info" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic-info">Informações Básicas</TabsTrigger>
              <TabsTrigger value="monthly-targets">Metas Mensais</TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic-info" className="space-y-4 mt-4">
              <Alert className="mb-4">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Direcionamento:</strong> Define como o resultado será interpretado.
                  Escolha "Maior é melhor" para metas que devem crescer (receita, clientes) 
                  ou "Menor é melhor" para metas que devem diminuir (custos, tempo, erros).
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className={errors.title ? 'text-destructive' : ''}>
                    Título *
                  </Label>
                  <Input
                    id="title"
                    value={basicInfo.title}
                    onChange={(e) => {
                      setBasicInfo({...basicInfo, title: e.target.value});
                      if (errors.title) setErrors({...errors, title: ''});
                    }}
                    className={errors.title ? 'border-destructive' : ''}
                    required
                  />
                  {errors.title && (
                    <p className="text-sm text-destructive">{errors.title}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="unit" className={errors.unit ? 'text-destructive' : ''}>
                    Unidade *
                  </Label>
                  <Select 
                    value={basicInfo.unit} 
                    onValueChange={(value) => {
                      setBasicInfo({...basicInfo, unit: value});
                      if (errors.unit) setErrors({...errors, unit: ''});
                    }}
                  >
                    <SelectTrigger className={errors.unit ? 'border-destructive' : ''}>
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
                  {errors.unit && (
                    <p className="text-sm text-destructive">{errors.unit}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target_direction" className={errors.target_direction ? 'text-destructive' : ''}>
                  Direcionamento *
                </Label>
                <Select 
                  value={basicInfo.target_direction} 
                  onValueChange={(value: TargetDirection) => {
                    setBasicInfo({...basicInfo, target_direction: value});
                    if (errors.target_direction) setErrors({...errors, target_direction: ''});
                  }}
                >
                  <SelectTrigger className={errors.target_direction ? 'border-destructive' : ''}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maximize">
                      <div className="flex flex-col">
                        <span>{getDirectionLabel('maximize')}</span>
                        <span className="text-xs text-muted-foreground">{getDirectionDescription('maximize')}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="minimize">
                      <div className="flex flex-col">
                        <span>{getDirectionLabel('minimize')}</span>
                        <span className="text-xs text-muted-foreground">{getDirectionDescription('minimize')}</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.target_direction && (
                  <p className="text-sm text-destructive">{errors.target_direction}</p>
                )}
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

              <div className="space-y-2">
                <Label htmlFor="assigned_owner">Dono do KR *</Label>
              <Select 
                value={basicInfo.assigned_owner_id || 'none'} 
                onValueChange={(value) => setBasicInfo({...basicInfo, assigned_owner_id: value})}
                disabled={loadingUsers}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o dono" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum dono</SelectItem>
                    {companyUsers.map((user) => (
                      <SelectItem key={user.user_id} value={user.user_id}>
                        {user.first_name} {user.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_month">Mês de Início</Label>
                  <Input
                    id="start_month"
                    type="month"
                    value={basicInfo.start_month}
                    onChange={(e) => setBasicInfo({...basicInfo, start_month: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="end_month">Mês de Fim</Label>
                  <Input
                    id="end_month"
                    type="month"
                    value={basicInfo.end_month}
                    onChange={(e) => setBasicInfo({...basicInfo, end_month: e.target.value})}
                  />
                </div>
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
              {basicInfo.start_month && basicInfo.end_month && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">
                    📅 Vigência: {formatValidityPeriod(basicInfo.start_month, basicInfo.end_month)}
                  </p>
                </div>
              )}

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
                  <div 
                    key={month.key} 
                    className={cn(
                      "grid grid-cols-4 gap-4 items-center p-3 border rounded-lg",
                      isMonthInValidity(month.key, basicInfo.start_month, basicInfo.end_month) && 
                        "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                    )}
                  >
                    <div>
                      <Label className="text-sm font-medium">{month.name}</Label>
                    </div>
                    <div>
                      <Input
                        type="text"
                        placeholder="0,00"
                        value={editingField === month.key ? tempValue : formatBrazilianNumber(monthlyTargets[month.key])}
                        onFocus={() => {
                          setEditingField(month.key);
                          setTempValue(monthlyTargets[month.key]?.toString() || '');
                        }}
                        onChange={(e) => {
                          setTempValue(e.target.value);
                        }}
                        onBlur={() => {
                          const value = parseBrazilianNumber(tempValue);
                          setMonthlyTargets(prev => ({
                            ...prev,
                            [month.key]: value || 0
                          }));
                          setEditingField(null);
                          setTempValue('');
                        }}
                        className="text-right font-mono"
                      />
                    </div>
                    <div className="text-center text-sm font-medium">
                      {formatBrazilianNumber(calculateYearlyTarget(monthlyTargets))}
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
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar Atualizações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};