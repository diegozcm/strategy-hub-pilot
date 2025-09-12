import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { KRMonthlyAction } from '@/types/strategic-map';

interface ActionFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (actionData: Omit<KRMonthlyAction, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => Promise<void>;
  action?: KRMonthlyAction;
  keyResultId: string;
  defaultMonth?: string;
}

export const ActionFormModal: React.FC<ActionFormModalProps> = ({
  open,
  onClose,
  onSave,
  action,
  keyResultId,
  defaultMonth,
}) => {
  const [formData, setFormData] = useState({
    action_title: '',
    action_description: '',
    month_year: defaultMonth || new Date().toISOString().slice(0, 7),
    planned_value: '',
    actual_value: '',
    completion_percentage: 0,
    status: 'planned' as 'planned' | 'in_progress' | 'completed' | 'cancelled',
    priority: 'medium' as 'low' | 'medium' | 'high',
    responsible: '',
    start_date: '',
    end_date: '',
    notes: '',
  });
  
  const [evidenceLinks, setEvidenceLinks] = useState<string[]>([]);
  const [newLink, setNewLink] = useState('');
  const [loading, setLoading] = useState(false);

  // Resetar form quando modal abrir/fechar ou action mudar
  useEffect(() => {
    if (open) {
      if (action) {
        setFormData({
          action_title: action.action_title,
          action_description: action.action_description || '',
          month_year: action.month_year,
          planned_value: action.planned_value?.toString() || '',
          actual_value: action.actual_value?.toString() || '',
          completion_percentage: action.completion_percentage,
          status: action.status,
          priority: action.priority,
          responsible: action.responsible || '',
          start_date: action.start_date || '',
          end_date: action.end_date || '',
          notes: action.notes || '',
        });
        setEvidenceLinks(action.evidence_links || []);
      } else {
        setFormData({
          action_title: '',
          action_description: '',
          month_year: defaultMonth || new Date().toISOString().slice(0, 7),
          planned_value: '',
          actual_value: '',
          completion_percentage: 0,
          status: 'planned' as 'planned' | 'in_progress' | 'completed' | 'cancelled',
          priority: 'medium' as 'low' | 'medium' | 'high',
          responsible: '',
          start_date: '',
          end_date: '',
          notes: '',
        });
        setEvidenceLinks([]);
      }
      setNewLink('');
    }
  }, [open, action, defaultMonth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.action_title.trim()) return;

    setLoading(true);
    try {
      await onSave({
        key_result_id: keyResultId,
        action_title: formData.action_title.trim(),
        action_description: formData.action_description.trim() || undefined,
        month_year: formData.month_year,
        planned_value: formData.planned_value ? parseFloat(formData.planned_value) : undefined,
        actual_value: formData.actual_value ? parseFloat(formData.actual_value) : undefined,
        completion_percentage: formData.completion_percentage,
        status: formData.status,
        priority: formData.priority,
        responsible: formData.responsible.trim() || undefined,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
        evidence_links: evidenceLinks.length > 0 ? evidenceLinks : undefined,
        notes: formData.notes.trim() || undefined,
      });
      onClose();
    } catch (error) {
      console.error('Error saving action:', error);
    } finally {
      setLoading(false);
    }
  };

  const addEvidenceLink = () => {
    if (newLink.trim() && !evidenceLinks.includes(newLink.trim())) {
      setEvidenceLinks([...evidenceLinks, newLink.trim()]);
      setNewLink('');
    }
  };

  const removeEvidenceLink = (link: string) => {
    setEvidenceLinks(evidenceLinks.filter(l => l !== link));
  };

  const generateMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    
    // Últimos 6 meses + próximos 12 meses
    for (let i = -6; i <= 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const monthYear = date.toISOString().slice(0, 7);
      const monthName = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      options.push({ value: monthYear, label: monthName });
    }
    
    return options;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {action ? 'Editar Ação' : 'Nova Ação'}
          </DialogTitle>
          <DialogDescription className="sr-only">Preencha os campos para criar ou editar a ação do KR</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="title">Título da Ação *</Label>
              <Input
                id="title"
                value={formData.action_title}
                onChange={(e) => setFormData(prev => ({ ...prev, action_title: e.target.value }))}
                placeholder="Descreva a ação a ser realizada"
                required
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.action_description}
                onChange={(e) => setFormData(prev => ({ ...prev, action_description: e.target.value }))}
                placeholder="Detalhes adicionais sobre a ação"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="month">Mês/Ano *</Label>
              <Select
                value={formData.month_year}
                onValueChange={(value) => setFormData(prev => ({ ...prev, month_year: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {generateMonthOptions().map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
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
              <Label htmlFor="planned">Valor Planejado</Label>
              <Input
                id="planned"
                type="number"
                step="0.01"
                value={formData.planned_value}
                onChange={(e) => setFormData(prev => ({ ...prev, planned_value: e.target.value }))}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="actual">Valor Real</Label>
              <Input
                id="actual"
                type="number"
                step="0.01"
                value={formData.actual_value}
                onChange={(e) => setFormData(prev => ({ ...prev, actual_value: e.target.value }))}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="start">Data Início</Label>
              <Input
                id="start"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="end">Data Fim</Label>
              <Input
                id="end"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">🎯 Planejada</SelectItem>
                  <SelectItem value="in_progress">🔄 Em Progresso</SelectItem>
                  <SelectItem value="completed">✅ Concluída</SelectItem>
                  <SelectItem value="cancelled">❌ Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Prioridade</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">🟢 Baixa</SelectItem>
                  <SelectItem value="medium">🟡 Média</SelectItem>
                  <SelectItem value="high">🔴 Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label htmlFor="completion">Progresso (%)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="completion"
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={formData.completion_percentage}
                  onChange={(e) => setFormData(prev => ({ ...prev, completion_percentage: parseInt(e.target.value) }))}
                  className="flex-1"
                />
                <span className="text-sm font-medium w-12 text-center">
                  {formData.completion_percentage}%
                </span>
              </div>
            </div>

            <div className="col-span-2">
              <Label>Links de Evidência</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newLink}
                  onChange={(e) => setNewLink(e.target.value)}
                  placeholder="https://exemplo.com/documento"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addEvidenceLink())}
                />
                <Button type="button" onClick={addEvidenceLink} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {evidenceLinks.map((link, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    <span className="truncate max-w-32">{link}</span>
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeEvidenceLink(link)} 
                    />
                  </Badge>
                ))}
              </div>
            </div>

            <div className="col-span-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Observações adicionais"
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !formData.action_title.trim()}>
              {loading ? 'Salvando...' : (action ? 'Atualizar' : 'Criar')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};