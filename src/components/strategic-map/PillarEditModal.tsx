import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { StrategicPillar } from '@/types/strategic-map';
import { toast } from '@/hooks/use-toast';

interface PillarEditModalProps {
  pillar: StrategicPillar;
  open: boolean;
  onClose: () => void;
  onSave: (id: string, data: Partial<StrategicPillar>) => Promise<any>;
}

export const PillarEditModal = ({ pillar, open, onClose, onSave }: PillarEditModalProps) => {
  const [formData, setFormData] = useState({
    name: pillar.name,
    description: pillar.description || '',
    color: pillar.color
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome do pilar é obrigatório",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const result = await onSave(pillar.id, formData);
    setLoading(false);

    if (result) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Pilar Estratégico</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nome do Pilar *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Ex: Econômico & Financeiro"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Descreva o foco deste pilar estratégico..."
              rows={3}
            />
          </div>
          
          <div>
            <Label htmlFor="color">Cor</Label>
            <div className="flex items-center gap-3">
              <Input
                id="color"
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({...formData, color: e.target.value})}
                className="w-16 h-10 p-1"
              />
              <Input
                value={formData.color}
                onChange={(e) => setFormData({...formData, color: e.target.value})}
                placeholder="#3B82F6"
                className="flex-1"
              />
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};