import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Edit } from 'lucide-react';

interface StrategicPlan {
  id: string;
  name: string;
  status: string;
  period_start: string;
  period_end: string;
  vision?: string;
  mission?: string;
}

interface EditPlanModalProps {
  plan: StrategicPlan | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (planId: string, updates: Partial<StrategicPlan>) => Promise<void>;
}

export const EditPlanModal: React.FC<EditPlanModalProps> = ({
  plan,
  isOpen,
  onClose,
  onUpdate
}) => {
  const [formData, setFormData] = useState({
    name: '',
    vision: '',
    mission: '',
    period_start: '',
    period_end: '',
    status: 'active'
  });
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name,
        vision: plan.vision || '',
        mission: plan.mission || '',
        period_start: plan.period_start,
        period_end: plan.period_end,
        status: plan.status
      });
    }
  }, [plan]);

  const handleUpdate = async () => {
    if (!plan || !formData.name || !formData.period_start || !formData.period_end) {
      return;
    }

    setIsUpdating(true);
    try {
      await onUpdate(plan.id, formData);
      onClose();
    } finally {
      setIsUpdating(false);
    }
  };

  const resetForm = () => {
    if (plan) {
      setFormData({
        name: plan.name,
        vision: plan.vision || '',
        mission: plan.mission || '',
        period_start: plan.period_start,
        period_end: plan.period_end,
        status: plan.status
      });
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!plan) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) handleClose();
    }}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Editar Plano Estratégico
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome do Plano *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Plano Estratégico 2024-2026"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="period_start">Data de Início *</Label>
              <Input
                id="period_start"
                type="date"
                value={formData.period_start}
                onChange={(e) => setFormData(prev => ({ ...prev, period_start: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="period_end">Data de Fim *</Label>
              <Input
                id="period_end"
                type="date"
                value={formData.period_end}
                onChange={(e) => setFormData(prev => ({ ...prev, period_end: e.target.value }))}
              />
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="vision">Visão</Label>
            <Textarea
              id="vision"
              value={formData.vision}
              onChange={(e) => setFormData(prev => ({ ...prev, vision: e.target.value }))}
              placeholder="Descreva a visão da empresa para este período"
              rows={3}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="mission">Missão</Label>
            <Textarea
              id="mission"
              value={formData.mission}
              onChange={(e) => setFormData(prev => ({ ...prev, mission: e.target.value }))}
              placeholder="Descreva a missão da empresa"
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleUpdate} 
            disabled={isUpdating || !formData.name || !formData.period_start || !formData.period_end}
          >
            {isUpdating ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};