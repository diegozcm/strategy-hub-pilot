
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type ProfileType = 'startup' | 'mentor';

interface StartupHubProfile {
  id?: string;
  user_id: string;
  type: ProfileType;
  bio?: string | null;
  areas_of_expertise?: string[] | null;
  startup_name?: string | null;
  website?: string | null;
  status?: string | null;
}

interface UserProfile {
  id: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

interface StartupHubProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfile;
  onSaved?: () => void;
}

export const StartupHubProfileDialog: React.FC<StartupHubProfileDialogProps> = ({
  open,
  onOpenChange,
  user,
  onSaved,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [existingId, setExistingId] = useState<string | undefined>(undefined);

  const [type, setType] = useState<ProfileType>('startup');
  const [bio, setBio] = useState('');
  const [areasText, setAreasText] = useState(''); // comma separated input for mentor
  const [startupName, setStartupName] = useState('');
  const [website, setWebsite] = useState('');

  // Load existing profile for this user (if any)
  useEffect(() => {
    const load = async () => {
      if (!open || !user?.user_id) return;
      const { data, error } = await supabase
        .from('startup_hub_profiles')
        .select('*')
        .eq('user_id', user.user_id)
        .maybeSingle();

      if (error) {
        console.error('Erro ao carregar perfil Startup HUB:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar o perfil do Startup HUB.',
          variant: 'destructive',
        });
        return;
      }

      if (data) {
        const p = data as StartupHubProfile;
        setExistingId(p.id);
        setType((p.type as ProfileType) || 'startup');
        setBio(p.bio || '');
        setAreasText((p.areas_of_expertise || []).join(', '));
        setStartupName(p.startup_name || '');
        setWebsite(p.website || '');
      } else {
        // reset if none
        setExistingId(undefined);
        setType('startup');
        setBio('');
        setAreasText('');
        setStartupName('');
        setWebsite('');
      }
    };

    load();
  }, [open, user?.user_id, toast]);

  const handleSave = async () => {
    if (!user?.user_id) return;
    setLoading(true);

    const payload: StartupHubProfile = {
      id: existingId,
      user_id: user.user_id,
      type,
      bio: bio || null,
      areas_of_expertise: areasText
        ? areasText.split(',').map(s => s.trim()).filter(Boolean)
        : [],
      startup_name: type === 'startup' ? (startupName || null) : null,
      website: website || null,
      status: 'active',
    };

    // Use upsert to create/update
    const { error } = await supabase
      .from('startup_hub_profiles')
      .upsert(payload as any, { onConflict: 'user_id' })
      .select()
      .maybeSingle();

    setLoading(false);

    if (error) {
      console.error('Erro ao salvar perfil Startup HUB:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o perfil. Verifique os dados e tente novamente.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Perfil salvo',
      description: `${user.first_name || ''} ${user.last_name || ''} agora está configurado como ${type === 'startup' ? 'Startup' : 'Mentor'}.`,
    });
    onSaved?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Configurar Perfil do Startup HUB</DialogTitle>
          <DialogDescription>
            Defina o perfil deste usuário como Startup ou Mentor e preencha os detalhes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Tipo de Perfil</Label>
              <Select value={type} onValueChange={(v) => setType(v as ProfileType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="startup">Startup</SelectItem>
                  <SelectItem value="mentor">Mentor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Website</Label>
              <Input
                placeholder="https://"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>
          </div>

          {type === 'startup' && (
            <div>
              <Label>Nome da Startup</Label>
              <Input
                placeholder="Ex: Minha Startup Ltda."
                value={startupName}
                onChange={(e) => setStartupName(e.target.value)}
              />
            </div>
          )}

          {type === 'mentor' && (
            <div>
              <Label>Áreas de Atuação (separe por vírgula)</Label>
              <Input
                placeholder="Finanças, Marketing, Vendas"
                value={areasText}
                onChange={(e) => setAreasText(e.target.value)}
              />
            </div>
          )}

          <div>
            <Label>Bio</Label>
            <Textarea
              placeholder="Conte um pouco sobre a startup ou experiência do mentor..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StartupHubProfileDialog;
