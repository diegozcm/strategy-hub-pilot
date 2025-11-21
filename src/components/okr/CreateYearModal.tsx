import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface CreateYearModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onYearCreated: (year: number, startDate: string, endDate: string) => Promise<void>;
}

export const CreateYearModal = ({ open, onOpenChange, onYearCreated }: CreateYearModalProps) => {
  const [year, setYear] = useState<number>(new Date().getFullYear() + 1);
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!year || year < 2020 || year > 2100) {
      toast({
        title: 'Erro',
        description: 'Por favor, insira um ano válido',
        variant: 'destructive',
      });
      return;
    }

    setCreating(true);
    try {
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;
      await onYearCreated(year, startDate, endDate);
      onOpenChange(false);
      setYear(new Date().getFullYear() + 1);
    } catch (error) {
      console.error('Error creating year:', error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Ano OKR</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="year">Ano</Label>
            <Input
              id="year"
              type="number"
              min="2020"
              max="2100"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              placeholder="2025"
              required
            />
            <p className="text-sm text-muted-foreground">
              Os 4 trimestres serão criados automaticamente
            </p>
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
            <Button type="submit" disabled={creating}>
              {creating ? 'Criando...' : 'Criar Ano'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
