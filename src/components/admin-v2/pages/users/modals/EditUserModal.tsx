import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";
import { UserWithDetails, useCompaniesForSelect } from "@/hooks/admin/useUsersStats";
import { UserHeader } from "./shared/UserHeader";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EditUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserWithDetails | null;
  onSuccess: () => void;
}

interface FormData {
  firstName: string;
  lastName: string;
  status: string;
  companyId: string;
}

export function EditUserModal({ open, onOpenChange, user, onSuccess }: EditUserModalProps) {
  const { toast } = useToast();
  const { data: companies } = useCompaniesForSelect();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    status: 'active',
    companyId: ''
  });

  useEffect(() => {
    if (user && open) {
      setFormData({
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        status: user.status || 'active',
        companyId: user.company_id || ''
      });
    }
  }, [user, open]);

  const handleSave = async () => {
    if (!user) return;

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Nome e sobrenome são obrigatórios.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          status: formData.status,
          company_id: formData.companyId || null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.user_id);

      if (profileError) throw profileError;

      // Update user_company_relations if company changed
      if (formData.companyId && formData.companyId !== user.company_id) {
        // Check if relation already exists
        const { data: existingRelation } = await supabase
          .from('user_company_relations')
          .select('id')
          .eq('user_id', user.user_id)
          .eq('company_id', formData.companyId)
          .single();

        if (!existingRelation) {
          const { error: relationError } = await supabase
            .from('user_company_relations')
            .insert({
              user_id: user.user_id,
              company_id: formData.companyId
            });

          if (relationError && !relationError.message.includes('duplicate')) {
            console.warn('Relation insert warning:', relationError);
          }
        }
      }

      toast({
        title: 'Sucesso',
        description: 'Usuário atualizado com sucesso.'
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar usuário.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
          <DialogDescription>
            Atualize as informações do usuário.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <UserHeader user={user} size="sm" showStatus={false} showAdmin={false} />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nome *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                placeholder="Nome"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Sobrenome *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                placeholder="Sobrenome"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Empresa</Label>
            <Select
              value={formData.companyId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, companyId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sem empresa</SelectItem>
                {companies?.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}