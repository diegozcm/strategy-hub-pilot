import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CreateOKRObjectiveData } from '@/types/okr';

interface CreateObjectiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  periodId: string;
  onObjectiveCreated: (data: CreateOKRObjectiveData) => Promise<any>;
}

export const CreateObjectiveModal = ({
  open,
  onOpenChange,
  periodId,
  onObjectiveCreated,
}: CreateObjectiveModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [responsible, setResponsible] = useState('');
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) return;

    setCreating(true);
    try {
      await onObjectiveCreated({
        okr_period_id: periodId,
        title: title.trim(),
        description: description.trim() || undefined,
        responsible: responsible.trim() || undefined,
      });

      setTitle('');
      setDescription('');
      setResponsible('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating objective:', error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Objetivo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título do Objetivo *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Aumentar satisfação dos clientes"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o objetivo em mais detalhes..."
              rows={3}
            />
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
              {creating ? 'Criando...' : 'Criar Objetivo'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
