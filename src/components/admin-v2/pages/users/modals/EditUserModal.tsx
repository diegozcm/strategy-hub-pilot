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
import { AvatarCropUploadLocal } from "@/components/ui/AvatarCropUploadLocal";
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
    companyId: 'none'
  });

  // Estado para avatar
  const [avatarDataUrl, setAvatarDataUrl] = useState<string>('');
  const [avatarRemoved, setAvatarRemoved] = useState(false);

  useEffect(() => {
    if (user && open) {
      setFormData({
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        status: user.status || 'active',
        companyId: user.company_id || 'none'
      });
      setAvatarDataUrl(user.avatar_url || '');
      setAvatarRemoved(false);
    }
  }, [user, open]);

  const handleAvatarChange = (dataUrl: string) => {
    setAvatarDataUrl(dataUrl);
    setAvatarRemoved(false);
  };

  const handleAvatarRemove = () => {
    setAvatarDataUrl('');
    setAvatarRemoved(true);
  };

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
      let newAvatarUrl: string | null = user.avatar_url || null;

      // Upload novo avatar se alterado (é um novo data URL)
      if (avatarDataUrl && avatarDataUrl.startsWith('data:')) {
        const response = await fetch(avatarDataUrl);
        const blob = await response.blob();
        const fileName = `${user.user_id}/avatar.webp`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, blob, { upsert: true });

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);
          newAvatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
          console.log('Avatar uploaded:', newAvatarUrl);
        } else {
          console.error('Upload error:', uploadError);
          toast({
            title: 'Aviso',
            description: 'Não foi possível atualizar a foto de perfil.',
          });
        }
      }

      // Remover avatar se solicitado
      if (avatarRemoved && user.avatar_url) {
        const fileName = `${user.user_id}/avatar.webp`;
        await supabase.storage.from('avatars').remove([fileName]);
        // Também tenta remover o antigo .jpg se existir
        await supabase.storage.from('avatars').remove([`${user.user_id}/avatar.jpg`]);
        newAvatarUrl = null;
      }

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          status: formData.status,
          company_id: formData.companyId === 'none' ? null : (formData.companyId || null),
          avatar_url: newAvatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.user_id);

      if (profileError) throw profileError;

      // Update user_company_relations if company changed
      if (formData.companyId && formData.companyId !== 'none' && formData.companyId !== user.company_id) {
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

  const userInitials = `${formData.firstName.charAt(0)}${formData.lastName.charAt(0)}`.toUpperCase() || 'U';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
          <DialogDescription>
            Atualize as informações e foto de perfil do usuário.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-2 pb-4 border-b">
            <AvatarCropUploadLocal
              currentImageUrl={avatarDataUrl || undefined}
              onImageCropped={handleAvatarChange}
              onImageRemoved={handleAvatarRemove}
              userInitials={userInitials}
              size="lg"
            />
            <p className="text-xs text-muted-foreground">Clique para alterar a foto</p>
          </div>

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
                <SelectItem value="none">Sem empresa</SelectItem>
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
