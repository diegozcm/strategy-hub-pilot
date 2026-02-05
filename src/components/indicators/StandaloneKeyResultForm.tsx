import { useState } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useMultiTenant';
import { useCompanyUsers } from '@/hooks/useCompanyUsers';
import { usePlanPeriodOptions } from '@/hooks/usePlanPeriodOptions';
import { useKRPermissions } from '@/hooks/useKRPermissions';
import { KeyResult, StrategicObjective } from '@/types/strategic-map';
import { getDirectionLabel, getDirectionDescription, type TargetDirection } from '@/lib/krHelpers';
import { KRFrequency, getFrequencyBadgeColor, getFrequencyLabel } from '@/lib/krFrequencyHelpers';
import { cn } from '@/lib/utils';

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

interface StandaloneKeyResultFormProps {
  objectives: StrategicObjective[];
  onSave: (krData: Omit<KeyResult, 'id' | 'owner_id' | 'created_at' | 'updated_at'>) => Promise<any>;
  onCancel: () => void;
}

type AggregationType = 'sum' | 'average' | 'max' | 'min';

const aggregationOptions: { value: AggregationType; label: string }[] = [
  { value: 'sum', label: 'Somar todas as metas' },
  { value: 'average', label: 'Calcular a média das metas' },
  { value: 'max', label: 'Usar o maior valor entre as metas' },
  { value: 'min', label: 'Usar o menor valor entre as metas' }
];

const frequencyOptions: { value: KRFrequency; label: string; description: string }[] = [
  { value: 'monthly', label: 'Mensal', description: '12 metas por ano' },
  { value: 'bimonthly', label: 'Bimestral', description: '6 metas por ano (B1-B6)' },
  { value: 'quarterly', label: 'Trimestral', description: '4 metas por ano (Q1-Q4)' },
  { value: 'semesterly', label: 'Semestral', description: '2 metas por ano (S1-S2)' },
  { value: 'yearly', label: 'Anual', description: '1 meta por ano' }
];

export const StandaloneKeyResultForm = ({ 
  objectives,
  onSave, 
  onCancel 
}: StandaloneKeyResultFormProps) => {
  const { company } = useAuth();
  const { users: companyUsers, loading: loadingUsers } = useCompanyUsers(company?.id);
  const { quarterOptions, yearValidityOptions } = usePlanPeriodOptions();
  const { canSelectOwner, isMemberOnly, currentUserId } = useKRPermissions();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    unit: '%',
    frequency: 'monthly' as KRFrequency,
    start_month: '',
    end_month: '',
    assigned_owner_id: '',
    objective_id: '',
    weight: 1,
    target_direction: 'maximize' as TargetDirection,
    aggregation_type: 'sum' as AggregationType
  });

  // Estado unificado para vigência
  const [selectedValidityQuarter, setSelectedValidityQuarter] = useState<string>('none');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.objective_id || formData.objective_id === 'none') {
      return;
    }

    try {
      setLoading(true);
      
      const resultadoChaveData = {
        title: formData.title,
        description: formData.description,
        objective_id: formData.objective_id,
        target_value: 0,
        current_value: 0,
        unit: formData.unit,
        frequency: formData.frequency,
        start_month: formData.start_month || null,
        end_month: formData.end_month || null,
        weight: formData.weight || 1,
        monthly_targets: {},
        monthly_actual: {},
        yearly_target: 0,
        aggregation_type: formData.aggregation_type,
        comparison_type: 'cumulative' as const,
        target_direction: formData.target_direction,
        assigned_owner_id: isMemberOnly 
          ? currentUserId || null
          : (formData.assigned_owner_id === 'none' ? null : formData.assigned_owner_id)
      };

      await onSave(resultadoChaveData as Omit<KeyResult, 'id' | 'owner_id' | 'created_at' | 'updated_at'>);
      
    } catch (error) {
      console.error('Error creating resultado-chave:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>Novo Resultado-Chave</DialogTitle>
        <DialogDescription>
          Crie um novo resultado-chave para acompanhar o progresso de suas metas.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Nome do KR - full width */}
        <div className="space-y-1">
          <Label htmlFor="kr-title" className="text-sm">Nome do Resultado-Chave *</Label>
          <Input
            id="kr-title"
            placeholder="Ex: Aumentar vendas em 20%"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            required
            autoFocus
            className="h-9"
          />
        </div>

        {/* Objetivo Estratégico - full width */}
        <div className="space-y-1">
          <Label htmlFor="kr-objective" className="text-sm">Objetivo Estratégico *</Label>
          <Select 
            value={formData.objective_id || 'none'} 
            onValueChange={(value) => setFormData({...formData, objective_id: value})}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Selecione um objetivo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Selecione um objetivo</SelectItem>
              {objectives.map((objective) => (
                <SelectItem key={objective.id} value={objective.id}>
                  {objective.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Dono + Vigência - 2 cols */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="kr-owner" className="text-sm">Dono do KR</Label>
            <Select 
              value={isMemberOnly ? (currentUserId || 'none') : (formData.assigned_owner_id || 'none')} 
              onValueChange={(value) => setFormData({...formData, assigned_owner_id: value})}
              disabled={!canSelectOwner || loadingUsers || !company}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder={
                  !company ? "Carregando empresa..." :
                  loadingUsers ? "Carregando usuários..." : 
                  "Selecione o dono"
                } />
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

          <div className="space-y-1">
            <Label className="text-sm">Vigência</Label>
            <Select 
              value={selectedValidityQuarter}
              onValueChange={(value) => {
                setSelectedValidityQuarter(value);
                if (value === 'none') {
                  setFormData(prev => ({ ...prev, start_month: '', end_month: '' }));
                  return;
                }
                if (value.endsWith('-YEAR')) {
                  const year = parseInt(value.replace('-YEAR', ''));
                  setFormData(prev => ({ 
                    ...prev, 
                    start_month: `${year}-01`, 
                    end_month: `${year}-12` 
                  }));
                  return;
                }
                const [year, q] = value.split('-Q');
                const quarter = parseInt(q) as 1 | 2 | 3 | 4;
                const { start_month, end_month } = quarterToMonths(quarter, parseInt(year));
                setFormData(prev => ({ ...prev, start_month, end_month }));
              }}
            >
              <SelectTrigger className="h-9">
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
          </div>
        </div>

        {/* Direcionamento + Frequência - 2 cols */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-sm">Direcionamento *</Label>
            <Select 
              value={formData.target_direction} 
              onValueChange={(value: TargetDirection) => setFormData({...formData, target_direction: value})}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="maximize">
                  <div className="flex flex-col py-1">
                    <span className="font-medium">{getDirectionLabel('maximize')}</span>
                    <span className="text-xs text-muted-foreground">{getDirectionDescription('maximize')}</span>
                  </div>
                </SelectItem>
                <SelectItem value="minimize">
                  <div className="flex flex-col py-1">
                    <span className="font-medium">{getDirectionLabel('minimize')}</span>
                    <span className="text-xs text-muted-foreground">{getDirectionDescription('minimize')}</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-sm">Frequência das Metas</Label>
            <Select 
              value={formData.frequency} 
              onValueChange={(value: KRFrequency) => setFormData({...formData, frequency: value})}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {frequencyOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <span className={cn("px-2 py-0.5 rounded text-xs font-medium", getFrequencyBadgeColor(option.value))}>
                        {option.label}
                      </span>
                      <span className="text-muted-foreground text-xs">{option.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Unidade + Peso - 2 cols */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="kr-unit" className="text-sm">Unidade</Label>
            <Select value={formData.unit} onValueChange={(value) => setFormData({...formData, unit: value})}>
              <SelectTrigger className="h-9">
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

          <div className="space-y-1">
            <Label htmlFor="kr-weight" className="text-sm">Peso (1-10)</Label>
            <Input
              id="kr-weight"
              type="number"
              min={1}
              max={10}
              value={formData.weight}
              onChange={(e) => setFormData({...formData, weight: parseInt(e.target.value) || 1})}
              className="h-9"
            />
          </div>
        </div>

        {/* Como calcular - full width */}
        <div className="space-y-1">
          <Label className="text-sm">Como calcular a meta?</Label>
          <Select 
            value={formData.aggregation_type} 
            onValueChange={(value: AggregationType) => setFormData({...formData, aggregation_type: value})}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {aggregationOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Descrição - full width (compacta) */}
        <div className="space-y-1">
          <Label htmlFor="kr-description" className="text-sm">Descrição (opcional)</Label>
          <Textarea
            id="kr-description"
            placeholder="Descreva o resultado-chave..."
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            rows={2}
            className="min-h-[60px]"
          />
        </div>

        {/* Botões de ação */}
        <DialogFooter className="pt-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading} size="sm">
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={loading || !formData.title || !formData.objective_id || formData.objective_id === 'none'} 
            size="sm"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Salvando...' : 'Criar Resultado-Chave'}
          </Button>
        </DialogFooter>
      </form>
    </div>
  );
};
