import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useMultiTenant';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Save, X } from 'lucide-react';
import { Company } from '@/types/admin';

interface CreateCompanyModalProps {
  onSave: (company: Omit<Company, 'id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
}

export const CreateCompanyModal: React.FC<CreateCompanyModalProps> = ({
  onSave,
  onCancel
}) => {
  const { user } = useAuth();
  const [newCompany, setNewCompany] = useState<Omit<Company, 'id' | 'created_at' | 'updated_at'>>({
    name: '',
    owner_id: user?.id || '',
    mission: '',
    vision: '',
    values: [],
    status: 'active'
  });
  const [newValue, setNewValue] = useState('');

  const handleAddValue = () => {
    if (newValue.trim()) {
      setNewCompany({
        ...newCompany,
        values: [...(newCompany.values || []), newValue.trim()]
      });
      setNewValue('');
    }
  };

  const handleRemoveValue = (index: number) => {
    setNewCompany({
      ...newCompany,
      values: newCompany.values?.filter((_, i) => i !== index)
    });
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Empresa</DialogTitle>
          <DialogDescription>
            Crie uma nova empresa no sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Empresa *</Label>
            <Input
              id="name"
              value={newCompany.name}
              onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
              placeholder="Digite o nome da empresa"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mission">Missão</Label>
            <Textarea
              id="mission"
              value={newCompany.mission || ''}
              onChange={(e) => setNewCompany({ ...newCompany, mission: e.target.value })}
              placeholder="Descrição da missão da empresa"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vision">Visão</Label>
            <Textarea
              id="vision"
              value={newCompany.vision || ''}
              onChange={(e) => setNewCompany({ ...newCompany, vision: e.target.value })}
              placeholder="Descrição da visão da empresa"
              rows={3}
            />
          </div>

          <div className="space-y-3">
            <Label>Valores</Label>
            <div className="flex gap-2">
              <Input
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Adicionar novo valor"
                onKeyPress={(e) => e.key === 'Enter' && handleAddValue()}
              />
              <Button onClick={handleAddValue} size="sm">
                Adicionar
              </Button>
            </div>
            {newCompany.values && newCompany.values.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {newCompany.values.map((value, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {value}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-destructive"
                      onClick={() => handleRemoveValue(index)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button 
            onClick={() => onSave(newCompany)}
            disabled={!newCompany.name.trim()}
          >
            <Save className="w-4 h-4 mr-2" />
            Criar Empresa
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};