import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KeyResult } from '@/types/strategic-map';
import { useAuth } from '@/hooks/useMultiTenant';
import { useCompanyUsers } from '@/hooks/useCompanyUsers';
import { usePlanPeriodOptions } from '@/hooks/usePlanPeriodOptions';
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

interface AddResultadoChaveModalProps {
  objectiveId: string;
  open: boolean;
  onClose: () => void;
  onSave: (resultadoChaveData: Omit<KeyResult, 'id' | 'owner_id' | 'created_at' | 'updated_at'>) => Promise<any>;
}

export const AddResultadoChaveModal = ({ objectiveId, open, onClose, onSave }: AddResultadoChaveModalProps) => {
  const { company } = useAuth();
  const { users: companyUsers, loading: loadingUsers } = useCompanyUsers(company?.id);
  const { quarterOptions, yearOptions } = usePlanPeriodOptions();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    metric_type: 'percentage',
    target_value: '',
    current_value: 0,
    unit: '%',
    responsible: '',
    deadline: '',
    category: '',
    priority: 'medium',
    frequency: 'monthly',
    start_month: '',
    end_month: '',
    assigned_owner_id: ''
  });

  const [monthlyTargets, setMonthlyTargets] = useState<Record<string, number>>({});
  const [aggregationType, setAggregationType] = useState<'sum' | 'average' | 'max' | 'min'>('sum');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.target_value) {
      return;
    }

    try {
      setLoading(true);
      
      // Calcular meta anual a partir das metas mensais usando o tipo de agregação
      const monthlyTotal = calculateYearlyTarget(monthlyTargets);
      const yearlyTarget = monthlyTotal > 0 ? monthlyTotal : parseFloat(formData.target_value);

      const resultadoChaveData = {
        ...formData,
        objective_id: objectiveId,
        target_value: parseFloat(formData.target_value),
        yearly_target: yearlyTarget,
        monthly_targets: monthlyTargets,
        monthly_actual: {},
        aggregation_type: aggregationType,
        status: 'not_started',
        due_date: formData.deadline || null,
        start_month: formData.start_month || null,
        end_month: formData.end_month || null,
        assigned_owner_id: formData.assigned_owner_id === 'none' ? null : formData.assigned_owner_id
      };

      await onSave(resultadoChaveData);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        metric_type: 'percentage',
        target_value: '',
        current_value: 0,
        unit: '%',
        responsible: '',
        deadline: '',
        category: '',
        priority: 'medium',
        frequency: 'monthly',
        start_month: '',
        end_month: '',
        assigned_owner_id: ''
      });
      
      onClose();
    } catch (error) {
      console.error('Error creating resultado-chave:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Resultado-Chave</DialogTitle>
          <DialogDescription>
            Crie um novo resultado-chave para este objetivo estratégico
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="general">Dados Gerais</TabsTrigger>
              <TabsTrigger value="monthly">Metas Mensais</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Nome do Resultado-Chave *</Label>
                <Input
                  id="title"
                  placeholder="Ex: Aumentar vendas em 20%"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assigned_owner">Dono do KR *</Label>
            <Select 
              value={formData.assigned_owner_id || 'none'} 
              onValueChange={(value) => setFormData({...formData, assigned_owner_id: value})}
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

              <div className="space-y-2">
                <Label>Vigência</Label>
                <Select 
                  value={selectedValidityQuarter}
                  onValueChange={(value) => {
                    setSelectedValidityQuarter(value);
                    if (value === 'none') {
                      setFormData(prev => ({ ...prev, start_month: '', end_month: '' }));
                      return;
                    }
                    // Extrair quarter e ano do value "2025-Q1"
                    const [year, q] = value.split('-Q');
                    const quarter = parseInt(q) as 1 | 2 | 3 | 4;
                    const { start_month, end_month } = quarterToMonths(quarter, parseInt(year));
                    setFormData(prev => ({ ...prev, start_month, end_month }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a vigência" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem vigência definida</SelectItem>
                    {quarterOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Selecione o quarter da vigência deste resultado-chave
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva o resultado-chave..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="financial">💰 Financeiro</SelectItem>
                      <SelectItem value="operational">⚙️ Operacional</SelectItem>
                      <SelectItem value="customer">👥 Cliente</SelectItem>
                      <SelectItem value="people">👨‍💼 Pessoas</SelectItem>
                      <SelectItem value="quality">⭐ Qualidade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Prioridade</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a prioridade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="low">Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="target_value">Meta Anual *</Label>
                  <Input
                    id="target_value"
                    type="number"
                    step="0.01"
                    placeholder="100"
                    value={formData.target_value}
                    onChange={(e) => setFormData({...formData, target_value: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit">Unidade</Label>
                  <Select value={formData.unit} onValueChange={(value) => setFormData({...formData, unit: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Unidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="%">% (Percentual)</SelectItem>
                      <SelectItem value="R$">R$ (Real)</SelectItem>
                      <SelectItem value="number">Número</SelectItem>
                      <SelectItem value="dias">Dias</SelectItem>
                      <SelectItem value="score">Score</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequência</Label>
                  <Select value={formData.frequency} onValueChange={(value) => setFormData({...formData, frequency: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Frequência" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Diário</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="quarterly">Trimestral</SelectItem>
                      <SelectItem value="yearly">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="responsible">Responsável</Label>
                  <Input
                    id="responsible"
                    placeholder="Nome do responsável"
                    value={formData.responsible}
                    onChange={(e) => setFormData({...formData, responsible: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deadline">Prazo</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="monthly" className="space-y-4 mt-4">
              {formData.start_month && formData.end_month && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">
                    📅 Vigência: {formatValidityPeriod(formData.start_month, formData.end_month)}
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex justify-between items-start gap-6">
                  <div className="space-y-2 flex-1">
                    <Label>Metas Mensais ({selectedYear})</Label>
                    <p className="text-sm text-muted-foreground">
                      Configure as metas específicas para cada mês e como calcular a meta anual.
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

                <div className="p-4 border rounded-lg bg-muted/50">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Como calcular a meta anual?</Label>
                    <Select value={aggregationType} onValueChange={(value: 'sum' | 'average' | 'max' | 'min') => setAggregationType(value)}>
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
                    <p className="text-xs text-muted-foreground">
                      {aggregationType === 'sum' && 'A meta anual será a soma de todas as metas mensais'}
                      {aggregationType === 'average' && 'A meta anual será a média de todas as metas mensais'}
                      {aggregationType === 'max' && 'A meta anual será o maior valor entre as metas mensais'}
                      {aggregationType === 'min' && 'A meta anual será o menor valor entre as metas mensais'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {months.map((month) => (
                  <div 
                    key={month.key} 
                    className={cn(
                      "space-y-2 p-2 rounded-lg border",
                      isMonthInValidity(month.key, formData.start_month, formData.end_month) 
                        ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                        : "border-transparent"
                    )}
                  >
                    <Label htmlFor={month.key} className="text-sm font-medium">
                      {month.short}
                    </Label>
                    <Input
                      id={month.key}
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
                ))}
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total das Metas Mensais:</span>
                  <span className="text-lg font-bold">
                    {calculateYearlyTarget(monthlyTargets).toFixed(2)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Este valor será usado como meta anual se diferente da meta anual informada
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              Adicionar Resultado-Chave
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};