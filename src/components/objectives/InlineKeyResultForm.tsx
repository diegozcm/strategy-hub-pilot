import { useState, useEffect } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useMultiTenant';
import { useCompanyUsers } from '@/hooks/useCompanyUsers';
import { usePlanPeriodOptions } from '@/hooks/usePlanPeriodOptions';
import { useKRPermissions } from '@/hooks/useKRPermissions';
import { KeyResult } from '@/types/strategic-map';

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

interface InlineKeyResultFormProps {
  objectiveId: string;
  objectiveTitle: string;
  onSave: (krData: Omit<KeyResult, 'id' | 'owner_id' | 'created_at' | 'updated_at'>) => Promise<any>;
  onCancel: () => void;
}

export const InlineKeyResultForm = ({ 
  objectiveId, 
  objectiveTitle, 
  onSave, 
  onCancel 
}: InlineKeyResultFormProps) => {
  const { company } = useAuth();
  const { users: companyUsers, loading: loadingUsers } = useCompanyUsers(company?.id);
  const { quarterOptions, yearValidityOptions } = usePlanPeriodOptions();
  const { canSelectOwner, isMemberOnly, currentUserId } = useKRPermissions();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_value: '',
    unit: '%',
    frequency: 'monthly',
    start_month: '',
    end_month: '',
    assigned_owner_id: '',
    weight: 1
  });

  // Estado unificado para vigência
  const [selectedValidityQuarter, setSelectedValidityQuarter] = useState<string>('none');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.target_value) {
      return;
    }

    try {
      setLoading(true);
      
      const resultadoChaveData = {
        title: formData.title,
        description: formData.description,
        objective_id: objectiveId,
        target_value: parseFloat(formData.target_value),
        current_value: 0,
        unit: formData.unit,
        frequency: formData.frequency as 'monthly' | 'bimonthly' | 'quarterly' | 'semesterly' | 'yearly',
        start_month: formData.start_month || null,
        end_month: formData.end_month || null,
        weight: formData.weight || 1,
        monthly_targets: {},
        monthly_actual: {},
        yearly_target: parseFloat(formData.target_value),
        aggregation_type: 'sum' as const,
        comparison_type: 'cumulative' as const,
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
    <div className="space-y-6">
      <DialogHeader>
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onCancel}
            className="p-1 h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <DialogTitle className="text-xl">Novo Resultado-Chave</DialogTitle>
            <DialogDescription className="flex items-center gap-2 mt-1">
              Vinculado ao objetivo:
              <Badge variant="secondary" className="font-normal">
                {objectiveTitle}
              </Badge>
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nome do KR */}
        <div className="space-y-2">
          <Label htmlFor="kr-title">Nome do Resultado-Chave *</Label>
          <Input
            id="kr-title"
            placeholder="Ex: Aumentar vendas em 20%"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            required
            autoFocus
          />
        </div>

        {/* Dono do KR */}
        <div className="space-y-2">
          <Label htmlFor="kr-owner">Dono do KR</Label>
          <Select 
            value={isMemberOnly ? (currentUserId || 'none') : (formData.assigned_owner_id || 'none')} 
            onValueChange={(value) => setFormData({...formData, assigned_owner_id: value})}
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
              {companyUsers.map((user) => (
                <SelectItem key={user.user_id} value={user.user_id}>
                  {user.first_name} {user.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Vigência */}
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
              // Verificar se é ano inteiro (ex: "2026-YEAR")
              if (value.endsWith('-YEAR')) {
                const year = parseInt(value.replace('-YEAR', ''));
                setFormData(prev => ({ 
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
              setFormData(prev => ({ ...prev, start_month, end_month }));
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
        </div>

        {/* Descrição */}
        <div className="space-y-2">
          <Label htmlFor="kr-description">Descrição</Label>
          <Textarea
            id="kr-description"
            placeholder="Descreva o resultado-chave..."
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            rows={2}
          />
        </div>

        {/* Meta e Unidade */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="kr-target">Meta Anual *</Label>
            <Input
              id="kr-target"
              type="number"
              step="0.01"
              placeholder="100"
              value={formData.target_value}
              onChange={(e) => setFormData({...formData, target_value: e.target.value})}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="kr-unit">Unidade</Label>
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
        </div>

        {/* Frequência e Peso */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="kr-frequency">Frequência</Label>
            <Select value={formData.frequency} onValueChange={(value) => setFormData({...formData, frequency: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Mensal</SelectItem>
                <SelectItem value="bimonthly">Bimestral</SelectItem>
                <SelectItem value="quarterly">Trimestral</SelectItem>
                <SelectItem value="semesterly">Semestral</SelectItem>
                <SelectItem value="yearly">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="kr-weight">Peso (1-10)</Label>
            <Input
              id="kr-weight"
              type="number"
              min={1}
              max={10}
              value={formData.weight}
              onChange={(e) => setFormData({...formData, weight: parseInt(e.target.value) || 1})}
            />
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading || !formData.title || !formData.target_value}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Salvando...' : 'Criar Resultado-Chave'}
          </Button>
        </div>
      </form>
    </div>
  );
};
