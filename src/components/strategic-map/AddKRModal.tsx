import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { KeyResult } from '@/types/strategic-map';
import { toast } from '@/hooks/use-toast';

interface AddKRModalProps {
  objectiveId: string;
  open: boolean;
  onClose: () => void;
  onSave: (krData: Omit<KeyResult, 'id' | 'owner_id' | 'created_at' | 'updated_at'>) => Promise<any>;
}

export const AddKRModal = ({ objectiveId, open, onClose, onSave }: AddKRModalProps) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    metric_type: 'percentage' as const,
    target_value: 0,
    current_value: 0,
    unit: '',
    responsible: '',
    deadline: '',
    status: 'not_started' as const
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "Erro",
        description: "Nome do resultado chave é obrigatório",
        variant: "destructive",
      });
      return;
    }
    
    if (formData.target_value <= 0) {
      toast({
        title: "Erro", 
        description: "Valor meta deve ser maior que zero",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const result = await onSave({
      ...formData,
      objective_id: objectiveId,
      due_date: formData.deadline || null
    });
    setLoading(false);

    if (result) {
      setFormData({
        title: '',
        description: '',
        metric_type: 'percentage',
        target_value: 0,
        current_value: 0,
        unit: '',
        responsible: '',
        deadline: '',
        status: 'not_started'
      });
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Adicionar Resultado Chave</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Nome do KR *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Ex: Aumentar receita em 20%"
              />
            </div>
            <div>
              <Label htmlFor="responsible">Responsável</Label>
              <Input
                id="responsible"
                value={formData.responsible}
                onChange={(e) => setFormData({...formData, responsible: e.target.value})}
                placeholder="Nome do responsável"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Descreva como este resultado será medido..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="metricType">Tipo de Métrica</Label>
              <Select 
                value={formData.metric_type} 
                onValueChange={(value: any) => setFormData({...formData, metric_type: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentual</SelectItem>
                  <SelectItem value="number">Número</SelectItem>
                  <SelectItem value="currency">Moeda</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="targetValue">Valor Meta *</Label>
              <Input
                id="targetValue"
                type="number"
                step="0.01"
                value={formData.target_value}
                onChange={(e) => setFormData({...formData, target_value: Number(e.target.value)})}
                placeholder="100"
              />
            </div>
            <div>
              <Label htmlFor="currentValue">Valor Atual</Label>
              <Input
                id="currentValue"
                type="number"
                step="0.01"
                value={formData.current_value}
                onChange={(e) => setFormData({...formData, current_value: Number(e.target.value)})}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="unit">Unidade</Label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) => setFormData({...formData, unit: e.target.value})}
                placeholder="%, R$, unidades..."
              />
            </div>
            <div>
              <Label htmlFor="deadline">Prazo</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({...formData, deadline: e.target.value})}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adicionando..." : "Adicionar KR"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};