import React, { useState } from 'react';
import { Building2, Plus, Save } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useMultiTenant';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface CreateCompanyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompanyCreated: () => void;
}

export const CreateCompanyModal: React.FC<CreateCompanyModalProps> = ({ 
  open, 
  onOpenChange, 
  onCompanyCreated 
}) => {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [newValue, setNewValue] = useState('');
  
  const [company, setCompany] = useState({
    name: '',
    mission: '',
    vision: '',
    values: [] as string[],
    status: 'active' as 'active' | 'inactive',
    company_type: 'regular' as 'regular' | 'startup'
  });

  const handleAddValue = () => {
    if (newValue.trim()) {
      setCompany({
        ...company,
        values: [...company.values, newValue.trim()]
      });
      setNewValue('');
    }
  };

  const handleRemoveValue = (index: number) => {
    setCompany({
      ...company,
      values: company.values.filter((_, i) => i !== index)
    });
  };

  const handleCreateCompany = async () => {
    if (!currentUser) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive"
      });
      return;
    }

    if (!company.name.trim()) {
      toast({
        title: "Erro",
        description: "O nome da empresa é obrigatório",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      if (company.company_type === 'startup') {
        // Use the new improved function with better error handling and rollback
        const { data, error } = await supabase
          .rpc('create_startup_company_v2', {
            _name: company.name.trim(),
            _mission: company.mission || null,
            _vision: company.vision || null,
            _values: company.values.length > 0 ? company.values : null,
            _logo_url: null,
            _owner_id: currentUser.id
          });

        if (error) {
          console.error('Erro ao criar startup:', error);
          console.error('Detalhes do erro:', error.details, error.hint, error.code);
          throw error;
        }

        const result = data && data.length > 0 ? data[0] : null;
        console.log('Log detalhado da criação de startup:', result?.step_log);
        
        if (!result?.success) {
          console.error('Falha na criação:', result?.message, result?.step_log);
          throw new Error(result?.message || 'Erro ao criar startup');
        }

        toast({
          title: 'Sucesso',
          description: 'Startup criada e configurada com sucesso! Perfil Startup HUB automaticamente criado.'
        });
      } else {
        // Processo normal para empresas regulares
        const { data, error } = await supabase
          .from('companies')
          .insert({
            name: company.name.trim(),
            mission: company.mission || null,
            vision: company.vision || null,
            values: company.values.length > 0 ? company.values : null,
            status: company.status,
            company_type: company.company_type,
            owner_id: currentUser.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select();

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: 'Empresa criada com sucesso'
        });
      }

      // Reset form
      setCompany({
        name: '',
        mission: '',
        vision: '',
        values: [],
        status: 'active',
        company_type: 'regular'
      });

      onCompanyCreated();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao criar empresa:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao criar empresa',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-card border-border text-card-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Nova Empresa
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Crie uma nova empresa no sistema
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Empresa *</Label>
            <Input
              id="name"
              value={company.name}
              onChange={(e) => setCompany({ ...company, name: e.target.value })}
              placeholder="Digite o nome da empresa"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_type">Tipo de Empresa</Label>
            <Select
              value={company.company_type}
              onValueChange={(value: 'regular' | 'startup') => 
                setCompany({ ...company, company_type: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">Empresa Regular</SelectItem>
                <SelectItem value="startup">Startup</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={company.status}
              onValueChange={(value: 'active' | 'inactive') => 
                setCompany({ ...company, status: value })
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
              value={company.mission}
              onChange={(e) => setCompany({ ...company, mission: e.target.value })}
              placeholder="Descrição da missão da empresa"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vision">Visão</Label>
            <Textarea
              id="vision"
              value={company.vision}
              onChange={(e) => setCompany({ ...company, vision: e.target.value })}
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
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {company.values.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {company.values.map((value, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {value}
                    <button
                      type="button"
                      className="ml-1 hover:text-destructive"
                      onClick={() => handleRemoveValue(index)}
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCreateCompany} disabled={isLoading}>
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Criando...' : 'Criar Empresa'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};