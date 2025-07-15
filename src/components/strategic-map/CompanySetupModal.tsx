import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Upload } from 'lucide-react';
import { Company } from '@/types/strategic-map';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';
import { toast } from '@/hooks/use-toast';

interface CompanySetupModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (dataOrId: any, data?: any) => Promise<Company | null>;
  initialData?: Company | null;
}

export const CompanySetupModal = ({ open, onClose, onSave, initialData }: CompanySetupModalProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    mission: '',
    vision: '',
    values: [] as string[],
    logo_url: ''
  });
  const [newValue, setNewValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        mission: initialData.mission || '',
        vision: initialData.vision || '',
        values: initialData.values || [],
        logo_url: initialData.logo_url || ''
      });
    }
  }, [initialData]);

  const handleAddValue = () => {
    if (newValue.trim() && !formData.values.includes(newValue.trim())) {
      setFormData(prev => ({
        ...prev,
        values: [...prev.values, newValue.trim()]
      }));
      setNewValue('');
    }
  };

  const handleRemoveValue = (valueToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      values: prev.values.filter(value => value !== valueToRemove)
    }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `company-logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, logo_url: publicUrl }));
      toast({
        title: "Sucesso",
        description: "Logo carregado com sucesso",
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar logo",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      return;
    }

    setLoading(true);
    try {
      if (initialData) {
        await onSave(initialData.id, formData);
      } else {
        await onSave(formData);
      }
      onClose();
    } catch (error) {
      console.error('Error saving company:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      mission: '',
      vision: '',
      values: [],
      logo_url: ''
    });
    setNewValue('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar Empresa' : 'Configurar Empresa'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Empresa *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Digite o nome da sua empresa"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo">Logomarca</Label>
            <div className="flex items-center gap-4">
              {formData.logo_url && (
                <img 
                  src={formData.logo_url} 
                  alt="Logo da empresa" 
                  className="h-12 w-12 object-contain rounded border"
                />
              )}
              <div>
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploading}
                  className="hidden"
                />
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('logo')?.click()}
                  disabled={uploading}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {uploading ? 'Carregando...' : 'Selecionar Logo'}
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mission">Missão</Label>
            <Textarea
              id="mission"
              value={formData.mission}
              onChange={(e) => setFormData(prev => ({ ...prev, mission: e.target.value }))}
              placeholder="Qual é a missão da sua empresa?"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vision">Visão</Label>
            <Textarea
              id="vision"
              value={formData.vision}
              onChange={(e) => setFormData(prev => ({ ...prev, vision: e.target.value }))}
              placeholder="Qual é a visão de futuro da sua empresa?"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Valores</Label>
            <div className="flex gap-2">
              <Input
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Digite um valor"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddValue();
                  }
                }}
              />
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleAddValue}
                disabled={!newValue.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {formData.values.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.values.map((value, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {value}
                    <button
                      type="button"
                      onClick={() => handleRemoveValue(value)}
                      className="ml-1 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !formData.name.trim()}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};