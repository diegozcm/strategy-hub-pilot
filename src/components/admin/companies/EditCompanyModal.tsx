import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Save, X } from 'lucide-react';
import { Company } from '@/types/admin';

interface EditCompanyModalProps {
  company: Company;
  onSave: (company: Company) => void;
  onCancel: () => void;
}

export const EditCompanyModal: React.FC<EditCompanyModalProps> = ({
  company,
  onSave,
  onCancel
}) => {
  const [editedCompany, setEditedCompany] = useState<Company>({ ...company });
  const [newValue, setNewValue] = useState('');

  const handleAddValue = () => {
    if (newValue.trim()) {
      setEditedCompany({
        ...editedCompany,
        values: [...(editedCompany.values || []), newValue.trim()]
      });
      setNewValue('');
    }
  };

  const handleRemoveValue = (index: number) => {
    setEditedCompany({
      ...editedCompany,
      values: editedCompany.values?.filter((_, i) => i !== index)
    });
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Empresa</DialogTitle>
          <DialogDescription>
            Edite as informações da empresa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Empresa</Label>
            <Input
              id="name"
              value={editedCompany.name}
              onChange={(e) => setEditedCompany({ ...editedCompany, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={editedCompany.status}
              onValueChange={(value: 'active' | 'inactive') => 
                setEditedCompany({ ...editedCompany, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativa</SelectItem>
                <SelectItem value="inactive">Inativa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mission">Missão</Label>
            <Textarea
              id="mission"
              value={editedCompany.mission || ''}
              onChange={(e) => setEditedCompany({ ...editedCompany, mission: e.target.value })}
              placeholder="Descrição da missão da empresa"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vision">Visão</Label>
            <Textarea
              id="vision"
              value={editedCompany.vision || ''}
              onChange={(e) => setEditedCompany({ ...editedCompany, vision: e.target.value })}
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
            {editedCompany.values && editedCompany.values.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {editedCompany.values.map((value, index) => (
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
          <Button onClick={() => onSave(editedCompany)}>
            <Save className="w-4 h-4 mr-2" />
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};