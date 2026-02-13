import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StrategicPillar } from '@/types/strategic-map';

interface ObjectiveFormModalProps {
  open: boolean;
  onClose: () => void;
  pillarId: string;
  planId: string;
  pillars: StrategicPillar[];
  onSave: (data: any) => Promise<any>;
}

export const ObjectiveFormModal = ({ 
  open, 
  onClose, 
  pillarId, 
  planId,
  pillars,
  onSave 
}: ObjectiveFormModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    target_date: '',
    weight: 5,
    pillar_id: pillarId,
  });

  // Sync pillarId when it changes
  useEffect(() => {
    if (pillarId) {
      setForm(prev => ({ ...prev, pillar_id: pillarId }));
    }
  }, [pillarId]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setForm({
        title: '',
        description: '',
        target_date: '',
        weight: 5,
        pillar_id: pillarId,
      });
    }
  }, [open, pillarId]);

  const handleSubmit = async () => {
    if (!form.title.trim()) return;
    setIsSubmitting(true);
    
    try {
      const objectiveData = {
        title: form.title,
        description: form.description,
        target_date: form.target_date || null,
        weight: form.weight,
        pillar_id: form.pillar_id,
        plan_id: planId,
        status: 'not_started',
      };

      await onSave(objectiveData);
      onClose();
    } catch (error) {
      console.error('Error saving objective:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Objetivo Estratégico</DialogTitle>
          <DialogDescription>
            Defina um novo objetivo estratégico para sua organização.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="obj-title">Título do Objetivo</Label>
            <Input
              id="obj-title"
              value={form.title}
              onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Ex: Aumentar receita em 30%"
            />
          </div>
          <div>
            <Label htmlFor="obj-description">Descrição</Label>
            <Textarea
              id="obj-description"
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva o objetivo..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="obj-target-date">Data Meta</Label>
              <Input
                id="obj-target-date"
                type="date"
                value={form.target_date}
                onChange={(e) => setForm(prev => ({ ...prev, target_date: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="obj-weight">Peso (1-10)</Label>
              <Input
                id="obj-weight"
                type="number"
                min={1}
                max={10}
                value={form.weight}
                onChange={(e) => setForm(prev => ({ ...prev, weight: parseInt(e.target.value) || 5 }))}
                placeholder="5"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="obj-pillar">Pilar Estratégico</Label>
            <Select value={form.pillar_id} onValueChange={(value) => setForm(prev => ({ ...prev, pillar_id: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um pilar" />
              </SelectTrigger>
              <SelectContent>
                {pillars.map((pillar) => (
                  <SelectItem key={pillar.id} value={pillar.id}>
                    {pillar.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !form.title.trim()}>
            {isSubmitting ? 'Criando...' : 'Criar Objetivo'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
