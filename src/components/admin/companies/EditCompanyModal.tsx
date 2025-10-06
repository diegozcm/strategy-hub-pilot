import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Save, X } from 'lucide-react';
import { Company } from '@/types/admin';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { ImageCropUpload } from '@/components/ui/ImageCropUpload';

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
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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

  const handleSave = async () => {
    if (!editedCompany.name.trim()) {
      toast({
        title: "Erro",
        description: "O nome da empresa é obrigatório",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          name: editedCompany.name.trim(),
          mission: editedCompany.mission || null,
          vision: editedCompany.vision || null,
          values: editedCompany.values || null,
          logo_url: editedCompany.logo_url || null,
          status: editedCompany.status,
          ai_enabled: editedCompany.ai_enabled || false,
          updated_at: new Date().toISOString()
        })
        .eq('id', editedCompany.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Sucesso",
        description: "Empresa atualizada com sucesso"
      });

      onSave(editedCompany);
    } catch (error) {
      console.error('Erro ao atualizar empresa:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar empresa. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
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

          <ImageCropUpload
            currentImageUrl={editedCompany.logo_url}
            onImageUploaded={(url) => setEditedCompany({ ...editedCompany, logo_url: url })}
            disabled={isLoading}
            aspectRatio={1}
          />

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
            <div className="flex items-center justify-between">
              <Label htmlFor="ai-enabled">Acesso à IA</Label>
              <Switch
                id="ai-enabled"
                checked={editedCompany.ai_enabled || false}
                onCheckedChange={(checked) => 
                  setEditedCompany({ ...editedCompany, ai_enabled: checked })
                }
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Habilita o Copilot AI e o botão flutuante de chat para usuários desta empresa
            </p>
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
          <Button onClick={handleSave} disabled={isLoading}>
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};