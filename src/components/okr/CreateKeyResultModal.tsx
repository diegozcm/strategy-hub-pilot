import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreateOKRKeyResultData } from '@/types/okr';

interface CreateKeyResultModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  objectiveId: string;
  onKeyResultCreated: (data: CreateOKRKeyResultData) => Promise<any>;
}

export const CreateKeyResultModal = ({
  open,
  onOpenChange,
  objectiveId,
  onKeyResultCreated,
}: CreateKeyResultModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetValue, setTargetValue] = useState<number>(100);
  const [unit, setUnit] = useState('percentage');
  const [targetDirection, setTargetDirection] = useState<'maximize' | 'minimize'>('maximize');
  const [responsible, setResponsible] = useState('');
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !targetValue) return;

    setCreating(true);
    try {
      await onKeyResultCreated({
        okr_objective_id: objectiveId,
        title: title.trim(),
        description: description.trim() || undefined,
        target_value: targetValue,
        unit,
        target_direction: targetDirection,
        responsible: responsible.trim() || undefined,
      });

      setTitle('');
      setDescription('');
      setTargetValue(100);
      setUnit('percentage');
      setTargetDirection('maximize');
      setResponsible('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating key result:', error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Criar Key Result</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título do Key Result *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Taxa de satisfação NPS"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva como será medido..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetValue">Meta *</Label>
              <Input
                id="targetValue"
                type="number"
                value={targetValue}
                onChange={(e) => setTargetValue(parseFloat(e.target.value))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unidade</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                  <SelectItem value="number">Número</SelectItem>
                  <SelectItem value="currency">Moeda (R$)</SelectItem>
                  <SelectItem value="days">Dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetDirection">Direção da Meta</Label>
            <Select value={targetDirection} onValueChange={(v) => setTargetDirection(v as 'maximize' | 'minimize')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="maximize">Maximizar (aumentar)</SelectItem>
                <SelectItem value="minimize">Minimizar (reduzir)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="responsible">Responsável</Label>
            <Input
              id="responsible"
              value={responsible}
              onChange={(e) => setResponsible(e.target.value)}
              placeholder="Nome do responsável"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={creating}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={creating || !title.trim()}>
              {creating ? 'Criando...' : 'Criar Key Result'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
