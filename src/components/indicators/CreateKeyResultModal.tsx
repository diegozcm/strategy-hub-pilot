import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { KeyResult, StrategicObjective } from '@/types/strategic-map';

interface CreateKeyResultModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (keyResult: Partial<KeyResult>) => Promise<void>;
  objectives: StrategicObjective[];
}

export function CreateKeyResultModal({ open, onClose, onSave }: CreateKeyResultModalProps) {
  const [loading, setLoading] = useState(false);
  const [dueDate, setDueDate] = useState<Date>();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    objective_id: '',
    target_value: '',
    unit: 'number',
    metric_type: 'percentage',
    frequency: 'monthly',
    responsible: '',
    category: '',
    priority: 'medium'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.objective_id || !formData.target_value) return;

    try {
      setLoading(true);
      
      const keyResultData: Partial<KeyResult> = {
        title: formData.title,
        description: formData.description || undefined,
        objective_id: formData.objective_id,
        target_value: parseFloat(formData.target_value),
        current_value: 0,
        unit: formData.unit,
        metric_type: formData.metric_type,
        frequency: formData.frequency,
        responsible: formData.responsible || undefined,
        category: formData.category || undefined,
        priority: formData.priority,
        due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : undefined,
        status: 'not_started',
        yearly_target: parseFloat(formData.target_value),
        yearly_actual: 0,
        monthly_targets: {},
        monthly_actual: {}
      };

      await onSave(keyResultData);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        objective_id: '',
        target_value: '',
        unit: 'number',
        metric_type: 'percentage',
        frequency: 'monthly',
        responsible: '',
        category: '',
        priority: 'medium'
      });
      setDueDate(undefined);
      onClose();
    } catch (error) {
      console.error('Error creating key result:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Criar Novo Resultado-Chave</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Aumentar receita mensal recorrente"
                required
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva o resultado-chave em detalhes"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="target_value">Meta Anual *</Label>
              <Input
                id="target_value"
                type="number"
                step="0.01"
                value={formData.target_value}
                onChange={(e) => setFormData(prev => ({ ...prev, target_value: e.target.value }))}
                placeholder="100"
                required
              />
            </div>

            <div>
              <Label htmlFor="unit">Unidade</Label>
              <Select value={formData.unit} onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="number">Número</SelectItem>
                  <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                  <SelectItem value="currency">Moeda (R$)</SelectItem>
                  <SelectItem value="time">Tempo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="metric_type">Tipo de Métrica</Label>
              <Select value={formData.metric_type} onValueChange={(value) => setFormData(prev => ({ ...prev, metric_type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Porcentagem</SelectItem>
                  <SelectItem value="number">Número</SelectItem>
                  <SelectItem value="currency">Moeda</SelectItem>
                  <SelectItem value="time">Tempo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="frequency">Frequência</Label>
              <Select value={formData.frequency} onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="quarterly">Trimestral</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="responsible">Responsável</Label>
              <Input
                id="responsible"
                value={formData.responsible}
                onChange={(e) => setFormData(prev => ({ ...prev, responsible: e.target.value }))}
                placeholder="Nome do responsável"
              />
            </div>

            <div>
              <Label htmlFor="category">Categoria</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                placeholder="Ex: Financeiro, Marketing"
              />
            </div>

            <div>
              <Label htmlFor="priority">Prioridade</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="critical">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Prazo</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar e Configurar Metas'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}