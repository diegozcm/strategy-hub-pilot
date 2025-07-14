import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KeyResult } from '@/types/strategic-map';

interface AddResultadoChaveModalProps {
  objectiveId: string;
  open: boolean;
  onClose: () => void;
  onSave: (resultadoChaveData: Omit<KeyResult, 'id' | 'owner_id' | 'created_at' | 'updated_at'>) => Promise<any>;
}

export const AddResultadoChaveModal = ({ objectiveId, open, onClose, onSave }: AddResultadoChaveModalProps) => {
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
    frequency: 'monthly'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.target_value) {
      return;
    }

    try {
      setLoading(true);
      
      const resultadoChaveData = {
        ...formData,
        objective_id: objectiveId,
        target_value: parseFloat(formData.target_value),
        status: 'not_started',
        due_date: formData.deadline || null
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
        frequency: 'monthly'
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
              <Label htmlFor="target_value">Meta *</Label>
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