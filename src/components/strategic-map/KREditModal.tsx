import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, X } from 'lucide-react';
import { KeyResult, Frequency } from '@/types/strategic-map';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getDirectionLabel, getDirectionDescription, type TargetDirection } from '@/lib/krHelpers';
import { useAuth } from '@/hooks/useMultiTenant';
import { useCompanyUsers } from '@/hooks/useCompanyUsers';
import { usePlanPeriodOptions } from '@/hooks/usePlanPeriodOptions';
import { useKRPermissions } from '@/hooks/useKRPermissions';
import { cn } from '@/lib/utils';
import { 
  KRFrequency, 
  getPeriodsForFrequency, 
  periodTargetsToMonthly, 
  monthlyTargetsToPeriod, 
  getFrequencyLabel, 
  getFrequencyBadgeColor,
  isFrequencyPeriodBased,
  calculateYearlyFromPeriods,
  isPeriodInValidity
} from '@/lib/krFrequencyHelpers';

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

// Converte quarter + ano para start_month e end_month
const quarterToMonths = (quarter: 1 | 2 | 3 | 4, year: number): { start_month: string; end_month: string } => {
  const quarterRanges = {
    1: { start: '01', end: '03' },
    2: { start: '04', end: '06' },
    3: { start: '07', end: '09' },
    4: { start: '10', end: '12' }
  };
  const range = quarterRanges[quarter];
  return {
    start_month: `${year}-${range.start}`,
    end_month: `${year}-${range.end}`
  };
};

// Converte start_month/end_month para valor do seletor de vigência
const monthsToValidity = (startMonth: string, endMonth: string): string => {
  if (!startMonth || !endMonth) return 'none';
  
  const [startYear, startM] = startMonth.split('-');
  const [endYear, endM] = endMonth.split('-');
  
  // Verificar se é ano completo (jan-dez do mesmo ano)
  if (startM === '01' && endM === '12' && startYear === endYear) {
    return `${startYear}-YEAR`;
  }
  
  // Tentar identificar como quarter
  const monthNum = parseInt(startM);
  let quarter: 1 | 2 | 3 | 4;
  if (monthNum >= 1 && monthNum <= 3) quarter = 1;
  else if (monthNum >= 4 && monthNum <= 6) quarter = 2;
  else if (monthNum >= 7 && monthNum <= 9) quarter = 3;
  else quarter = 4;
  
  return `${startYear}-Q${quarter}`;
};

interface KREditModalProps {
  keyResult: KeyResult | null;
  open: boolean;
  onClose: () => void;
  onSave: (keyResultData: Partial<KeyResult>) => Promise<any>;
  objectives?: Array<{ id: string; title: string; }>;
  initialYear?: number;
}

export const KREditModal = ({ keyResult, open, onClose, onSave, objectives = [], initialYear }: KREditModalProps) => {
  const { toast } = useToast();
  const { company } = useAuth();
  const { users: companyUsers, loading: loadingUsers } = useCompanyUsers(company?.id);
  const { quarterOptions, yearOptions, yearValidityOptions } = usePlanPeriodOptions();
  const { canSelectOwner } = useKRPermissions();
  const [savingAggregationType, setSavingAggregationType] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Form states
  const [basicInfo, setBasicInfo] = useState({
    title: '',
    description: '',
    unit: '',
    objective_id: '',
    target_direction: 'maximize' as TargetDirection,
    start_month: '',
    end_month: '',
    assigned_owner_id: '',
    weight: 1,
    frequency: 'monthly' as KRFrequency
  });
  
  const [monthlyTargets, setMonthlyTargets] = useState<Record<string, number>>({});
  const [selectedYear, setSelectedYear] = useState<number>(initialYear || new Date().getFullYear());
  const [aggregationType, setAggregationType] = useState<'sum' | 'average' | 'max' | 'min' | 'last'>('sum');
  const [editMode, setEditMode] = useState<boolean>(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>('');
  const [periodTargets, setPeriodTargets] = useState<Record<string, number>>({});
  
  // Ref para rastrear o último initialYear processado (evita travamento do select)
  const lastInitialYearRef = useRef<number | undefined>(undefined);

  // Reset do ref quando o modal fecha
  useEffect(() => {
    if (!open) {
      lastInitialYearRef.current = undefined;
    }
  }, [open]);

  // Sincronizar selectedYear com yearOptions e initialYear (apenas quando initialYear muda)
  useEffect(() => {
    if (yearOptions.length === 0) return;
    
    // Apenas sincronizar quando initialYear MUDAR (modal reabriu com novo ano)
    if (initialYear && initialYear !== lastInitialYearRef.current) {
      if (yearOptions.some(opt => opt.value === initialYear)) {
        setSelectedYear(initialYear);
        lastInitialYearRef.current = initialYear;
        return;
      }
    }
    
    // Marcar inicialização como feita
    if (!lastInitialYearRef.current && initialYear) {
      lastInitialYearRef.current = initialYear;
    }
    
    // Apenas validar se o ano selecionado é válido nas opções
    const isYearValid = yearOptions.some(opt => opt.value === selectedYear);
    if (!isYearValid) {
      const currentYr = new Date().getFullYear();
      const hasCurrentYear = yearOptions.some(opt => opt.value === currentYr);
      const closestYear = yearOptions.reduce((closest, opt) => {
        return Math.abs(opt.value - currentYr) < Math.abs(closest - currentYr) 
          ? opt.value 
          : closest;
      }, yearOptions[0].value);
      
      const validYear = yearOptions.length === 1 
        ? yearOptions[0].value 
        : (hasCurrentYear ? currentYr : closestYear);
      
      setSelectedYear(validYear);
    }
  }, [yearOptions, initialYear]);
  
  // Estado unificado para vigência (formato: "2025-Q1" ou "none")
  const [selectedValidityQuarter, setSelectedValidityQuarter] = useState<string>('none');

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
  const saveAggregationType = async (newType: 'sum' | 'average' | 'max' | 'min' | 'last') => {
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

  // Initialize form when modal opens
  useEffect(() => {
    // Só reinicializar quando o modal for aberto E tiver keyResult
    if (open && keyResult) {
      console.log('[KREditModal] Inicializando formulário', {
        open,
        keyResultId: keyResult?.id,
        start_month: keyResult?.start_month,
        end_month: keyResult?.end_month
      });
      
      const krFrequency = (keyResult.frequency as KRFrequency) || 'monthly';
      
      setBasicInfo({
        title: keyResult.title,
        description: keyResult.description || '',
        unit: keyResult.unit || '',
        objective_id: keyResult.objective_id || 'none',
        target_direction: (keyResult.target_direction as TargetDirection) || 'maximize',
        start_month: keyResult.start_month || '',
        end_month: keyResult.end_month || '',
        assigned_owner_id: keyResult.assigned_owner_id || '',
        weight: keyResult.weight || 1,
        frequency: krFrequency
      });
      
      setAggregationType(keyResult.aggregation_type || 'sum');
      
      // Inicializar selectedValidityQuarter a partir do start_month/end_month
      setSelectedValidityQuarter(monthsToValidity(keyResult.start_month || '', keyResult.end_month || ''));
      
      // Initialize period targets if frequency is not monthly
      if (isFrequencyPeriodBased(krFrequency)) {
        const existingTargets = (keyResult.monthly_targets as Record<string, number>) || {};
        setPeriodTargets(monthlyTargetsToPeriod(existingTargets, krFrequency, selectedYear));
      }
      
      setErrors({}); // Clear errors when opening modal
    }
  }, [open, keyResult]);

  // Filtrar dados do ano selecionado quando o ano mudar
  useEffect(() => {
    if (open && keyResult) {
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
  }, [open, selectedYear, keyResult]);

  // Update period targets when frequency or year changes
  useEffect(() => {
    if (open && keyResult && isFrequencyPeriodBased(basicInfo.frequency)) {
      const existingTargets = (keyResult.monthly_targets as Record<string, number>) || {};
      setPeriodTargets(monthlyTargetsToPeriod(existingTargets, basicInfo.frequency, selectedYear));
    }
  }, [open, selectedYear, basicInfo.frequency, keyResult]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyResult || isSaving) return;
    
    console.log('[KREditModal] Salvando', {
      basicInfo_start_month: basicInfo.start_month,
      basicInfo_end_month: basicInfo.end_month,
      frequency: basicInfo.frequency,
      keyResultId: keyResult.id
    });
    
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
      
      let finalMonthlyTargets: Record<string, number>;
      let yearlyTarget: number;
      
      if (isFrequencyPeriodBased(basicInfo.frequency)) {
        // Convert period targets to monthly format (stored in first month of each period)
        const currentYearMonthlyFromPeriods = periodTargetsToMonthly(periodTargets, basicInfo.frequency, selectedYear);
        
        // Merge with existing (preserving other years)
        finalMonthlyTargets = { ...existingMonthlyTargets };
        Object.keys(finalMonthlyTargets).forEach(key => {
          if (key.startsWith(`${selectedYear}-`)) {
            delete finalMonthlyTargets[key];
          }
        });
        Object.assign(finalMonthlyTargets, currentYearMonthlyFromPeriods);
        
        yearlyTarget = calculateYearlyFromPeriods(periodTargets, aggregationType);
      } else {
        // Monthly frequency - use original logic
        const cleanCurrentYearTargets = Object.fromEntries(
          Object.entries(monthlyTargets)
            .filter(([_, value]) => typeof value === 'number' && !isNaN(value))
        );
        
        finalMonthlyTargets = { ...existingMonthlyTargets };
        Object.keys(finalMonthlyTargets).forEach(key => {
          if (key.startsWith(`${selectedYear}-`)) {
            delete finalMonthlyTargets[key];
          }
        });
        Object.assign(finalMonthlyTargets, cleanCurrentYearTargets);
        
        yearlyTarget = calculateYearlyTarget(cleanCurrentYearTargets);
      }

      await onSave({
        id: keyResult.id,
        title: basicInfo.title,
        description: basicInfo.description,
        unit: basicInfo.unit,
        objective_id: basicInfo.objective_id === '' || basicInfo.objective_id === 'none' ? null : basicInfo.objective_id,
        monthly_targets: finalMonthlyTargets,
        yearly_target: yearlyTarget,
        target_value: yearlyTarget,
        aggregation_type: aggregationType,
        target_direction: basicInfo.target_direction,
        start_month: basicInfo.start_month || null,
        end_month: basicInfo.end_month || null,
        assigned_owner_id: basicInfo.assigned_owner_id === 'none' || basicInfo.assigned_owner_id === '' ? null : basicInfo.assigned_owner_id,
        weight: basicInfo.weight || 1,
        frequency: basicInfo.frequency
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
              <TabsTrigger value="monthly-targets">Metas</TabsTrigger>
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
                <Label htmlFor="frequency">Frequência das Metas</Label>
                <Select 
                  value={basicInfo.frequency} 
                  onValueChange={(value: KRFrequency) => setBasicInfo({...basicInfo, frequency: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">
                      <div className="flex items-center gap-2">
                        <span className={cn("px-2 py-0.5 rounded text-xs font-medium", getFrequencyBadgeColor('monthly'))}>
                          Mensal
                        </span>
                        <span className="text-muted-foreground text-xs">12 metas por ano</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="bimonthly">
                      <div className="flex items-center gap-2">
                        <span className={cn("px-2 py-0.5 rounded text-xs font-medium", getFrequencyBadgeColor('bimonthly'))}>
                          Bimestral
                        </span>
                        <span className="text-muted-foreground text-xs">6 metas por ano (B1-B6)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="quarterly">
                      <div className="flex items-center gap-2">
                        <span className={cn("px-2 py-0.5 rounded text-xs font-medium", getFrequencyBadgeColor('quarterly'))}>
                          Trimestral
                        </span>
                        <span className="text-muted-foreground text-xs">4 metas por ano (Q1-Q4)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="semesterly">
                      <div className="flex items-center gap-2">
                        <span className={cn("px-2 py-0.5 rounded text-xs font-medium", getFrequencyBadgeColor('semesterly'))}>
                          Semestral
                        </span>
                        <span className="text-muted-foreground text-xs">2 metas por ano (S1-S2)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="yearly">
                      <div className="flex items-center gap-2">
                        <span className={cn("px-2 py-0.5 rounded text-xs font-medium", getFrequencyBadgeColor('yearly'))}>
                          Anual
                        </span>
                        <span className="text-muted-foreground text-xs">1 meta por ano</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Define a frequência de acompanhamento das metas deste KR
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Label htmlFor="weight">Peso (1-10)</Label>
                  <Input
                    id="weight"
                    type="number"
                    min={1}
                    max={10}
                    placeholder="1"
                    value={basicInfo.weight}
                    onChange={(e) => setBasicInfo({...basicInfo, weight: parseInt(e.target.value) || 1})}
                  />
                  <p className="text-xs text-muted-foreground">
                    Peso do KR para cálculo da média ponderada do objetivo
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assigned_owner">Dono do KR *</Label>
                <Select 
                  value={basicInfo.assigned_owner_id || 'none'} 
                  onValueChange={(value) => setBasicInfo({...basicInfo, assigned_owner_id: value})}
                  disabled={!canSelectOwner || loadingUsers || !company}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      !company ? "Carregando empresa..." :
                      loadingUsers ? "Carregando usuários..." : 
                      "Selecione o dono"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum dono</SelectItem>
                    {companyUsers.length === 0 && !loadingUsers && (
                      <SelectItem value="empty" disabled>Nenhum usuário encontrado</SelectItem>
                    )}
                    {companyUsers.map((user) => (
                      <SelectItem key={user.user_id} value={user.user_id}>
                        {user.first_name} {user.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Vigência</Label>
                <Select 
                  value={selectedValidityQuarter}
                  onValueChange={(value) => {
                    setSelectedValidityQuarter(value);
                    if (value === 'none') {
                      setBasicInfo(prev => ({ ...prev, start_month: '', end_month: '' }));
                      return;
                    }
                    // Verificar se é ano inteiro (ex: "2026-YEAR")
                    if (value.endsWith('-YEAR')) {
                      const year = parseInt(value.replace('-YEAR', ''));
                      setBasicInfo(prev => ({ 
                        ...prev, 
                        start_month: `${year}-01`, 
                        end_month: `${year}-12` 
                      }));
                      return;
                    }
                    // Extrair quarter e ano do value "2025-Q1"
                    const [year, q] = value.split('-Q');
                    const quarter = parseInt(q) as 1 | 2 | 3 | 4;
                    const { start_month, end_month } = quarterToMonths(quarter, parseInt(year));
                    setBasicInfo(prev => ({ ...prev, start_month, end_month }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a vigência" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem vigência definida</SelectItem>
                    {yearValidityOptions.length > 0 && (
                      <>
                        <SelectItem value="_header_years" disabled className="text-xs text-muted-foreground font-semibold bg-muted">
                          — Anos completos —
                        </SelectItem>
                        {yearValidityOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </>
                    )}
                    {quarterOptions.length > 0 && (
                      <>
                        <SelectItem value="_header_quarters" disabled className="text-xs text-muted-foreground font-semibold bg-muted">
                          — Quarters —
                        </SelectItem>
                        {quarterOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Selecione um ano completo ou quarter específico
                </p>
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
            </TabsContent>

            {/* Targets Tab - Dynamic based on frequency */}
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
                  <div className="flex items-center gap-2">
                    <Label>Metas {getFrequencyLabel(basicInfo.frequency)}s ({selectedYear})</Label>
                    <span className={cn("px-2 py-0.5 rounded text-xs font-medium", getFrequencyBadgeColor(basicInfo.frequency))}>
                      {getFrequencyLabel(basicInfo.frequency)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {basicInfo.frequency === 'monthly' && 'Defina as metas para cada mês do ano selecionado.'}
                    {basicInfo.frequency === 'quarterly' && 'Defina as metas para cada trimestre (Q1-Q4).'}
                    {basicInfo.frequency === 'semesterly' && 'Defina as metas para cada semestre (S1-S2).'}
                    {basicInfo.frequency === 'yearly' && 'Defina a meta anual única.'}
                  </p>
                </div>
                
                <div className="w-32">
                  <Label className="text-sm font-medium">Ano</Label>
                  <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                      <SelectContent>
                        {yearOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value.toString()}>
                            {option.label}
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
                        setAggregationType(value as 'sum' | 'average' | 'max' | 'min' | 'last');
                        saveAggregationType(value as 'sum' | 'average' | 'max' | 'min' | 'last');
                      }}
                      disabled={savingAggregationType}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sum">Somar todas as metas</SelectItem>
                        <SelectItem value="average">Calcular a média das metas</SelectItem>
                        <SelectItem value="max">Usar o maior valor entre as metas</SelectItem>
                        <SelectItem value="min">Usar o menor valor entre as metas</SelectItem>
                        <SelectItem value="last">Usar o último valor registrado</SelectItem>
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

              {/* Dynamic grid based on frequency */}
              <div className="space-y-3">
                <div className="grid grid-cols-[150px_1fr_180px_80px] gap-4 p-3 bg-muted/30 rounded-lg font-medium text-sm">
                  <div>Período</div>
                  <div className="text-center">Meta</div>
                  <div className="text-center">Meta Anual Calculada</div>
                  <div className="text-center">Unidade</div>
                </div>
                
                {isFrequencyPeriodBased(basicInfo.frequency) ? (
                  // Period-based frequencies (quarterly, semesterly, yearly)
                  getPeriodsForFrequency(basicInfo.frequency, selectedYear).map((period) => (
                    <div 
                      key={period.key} 
                      className={cn(
                        "grid grid-cols-[150px_1fr_180px_80px] gap-4 items-center p-3 border rounded-lg",
                        isPeriodInValidity(period.key, basicInfo.start_month, basicInfo.end_month) && 
                          "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                      )}
                    >
                      <div>
                        <Label className="text-sm font-medium">{period.label}</Label>
                      </div>
                      <div className="flex gap-1 items-center">
                        <Input
                          type="text"
                          placeholder="0,00"
                          value={editingField === period.key ? tempValue : formatBrazilianNumber(periodTargets[period.key])}
                          onFocus={() => {
                            setEditingField(period.key);
                            setTempValue(periodTargets[period.key]?.toString() || '');
                          }}
                          onChange={(e) => {
                            setTempValue(e.target.value);
                          }}
                          onBlur={() => {
                            const value = parseBrazilianNumber(tempValue);
                            setPeriodTargets(prev => ({
                              ...prev,
                              [period.key]: value || 0
                            }));
                            setEditingField(null);
                            setTempValue('');
                          }}
                          className="flex-1 text-right font-mono"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 shrink-0"
                          tabIndex={-1}
                          onClick={() => {
                            setPeriodTargets(prev => {
                              const newTargets = { ...prev };
                              delete newTargets[period.key];
                              return newTargets;
                            });
                          }}
                          title="Limpar meta"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="text-center text-sm font-medium">
                        {formatBrazilianNumber(calculateYearlyFromPeriods(periodTargets, aggregationType))}
                      </div>
                      <div className="text-center text-sm text-muted-foreground">
                        {basicInfo.unit}
                      </div>
                    </div>
                  ))
                ) : (
                  // Monthly frequency
                  months.map((month) => (
                    <div 
                      key={month.key} 
                      className={cn(
                        "grid grid-cols-[150px_1fr_180px_80px] gap-4 items-center p-3 border rounded-lg",
                        isMonthInValidity(month.key, basicInfo.start_month, basicInfo.end_month) && 
                          "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                      )}
                    >
                      <div>
                        <Label className="text-sm font-medium">{month.name}</Label>
                      </div>
                      <div className="flex gap-1 items-center">
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
                          className="flex-1 text-right font-mono"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 shrink-0"
                          tabIndex={-1}
                          onClick={() => {
                            setMonthlyTargets(prev => {
                              const newTargets = { ...prev };
                              delete newTargets[month.key];
                              return newTargets;
                            });
                          }}
                          title="Limpar meta"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="text-center text-sm font-medium">
                        {formatBrazilianNumber(calculateYearlyTarget(monthlyTargets))}
                      </div>
                      <div className="text-center text-sm text-muted-foreground">
                        {basicInfo.unit}
                      </div>
                    </div>
                  ))
                )}
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