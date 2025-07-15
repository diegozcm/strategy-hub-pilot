import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useMultiTenant';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Camera, Save, User, Mail, Phone, MapPin, Calendar, Briefcase, FileText, Plus, X } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface Profile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  department: string | null;
  position: string | null;
  bio: string | null;
  avatar_url: string | null;
  hire_date: string | null;
  skills: string[] | null;
  status: string | null;
}

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile(data);
      } else {
        // Create initial profile if doesn't exist
        const newProfile = {
          user_id: user!.id,
          email: user!.email,
          first_name: '',
          last_name: '',
          phone: '',
          department: '',
          position: '',
          bio: '',
          skills: [],
          status: 'active'
        };

        const { data: created, error: createError } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select()
          .single();

        if (createError) throw createError;
        setProfile(created);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar perfil.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof Profile, value: string) => {
    if (profile) {
      setProfile({
        ...profile,
        [field]: value
      });
    }
  };

  const handleSkillAdd = () => {
    if (newSkill.trim() && profile) {
      const updatedSkills = [...(profile.skills || []), newSkill.trim()];
      setProfile({
        ...profile,
        skills: updatedSkills
      });
      setNewSkill('');
    }
  };

  const handleSkillRemove = (index: number) => {
    if (profile) {
      const updatedSkills = profile.skills?.filter((_, i) => i !== index) || [];
      setProfile({
        ...profile,
        skills: updatedSkills
      });
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !profile) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Delete old avatar if exists
      if (profile.avatar_url) {
        const oldPath = profile.avatar_url.split('/').pop();
        if (oldPath) {
          await supabase.storage.from('avatars').remove([`${user.id}/${oldPath}`]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setProfile({
        ...profile,
        avatar_url: publicUrl
      });

      toast({
        title: "Sucesso",
        description: "Foto de perfil atualizada!",
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Erro",
        description: "Erro ao fazer upload da foto.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
          department: profile.department,
          position: profile.position,
          bio: profile.bio,
          avatar_url: profile.avatar_url,
          hire_date: profile.hire_date,
          skills: profile.skills,
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Perfil atualizado com sucesso!",
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar perfil.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Perfil não encontrado</h2>
          <p className="text-gray-600">Não foi possível carregar o perfil.</p>
        </div>
      </div>
    );
  }

  const getInitials = () => {
    const first = profile.first_name || '';
    const last = profile.last_name || '';
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || 'U';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Meu Perfil</h1>
          <p className="text-gray-600">Gerencie suas informações pessoais e profissionais</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <LoadingSpinner size="sm" className="mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Salvar Alterações
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Foto e Info Básica */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Foto de Perfil
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="relative inline-block">
              <Avatar className="h-32 w-32">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-2xl">{getInitials()}</AvatarFallback>
              </Avatar>
              <label className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-primary/90">
                <Camera className="h-4 w-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
              {uploading && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <LoadingSpinner size="sm" />
                </div>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-lg">
                {profile.first_name || profile.last_name 
                  ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
                  : 'Usuário'
                }
              </h3>
              <p className="text-gray-600">{profile.position || 'Cargo não informado'}</p>
              <Badge variant={profile.status === 'active' ? 'default' : 'secondary'} className="mt-2">
                {profile.status === 'active' ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Informações Pessoais */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações Pessoais
            </CardTitle>
            <CardDescription>
              Suas informações básicas e de contato
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">Nome</Label>
                <Input
                  id="first_name"
                  value={profile.first_name || ''}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  placeholder="Seu nome"
                />
              </div>
              <div>
                <Label htmlFor="last_name">Sobrenome</Label>
                <Input
                  id="last_name"
                  value={profile.last_name || ''}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  placeholder="Seu sobrenome"
                />
              </div>
              <div>
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email || ''}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div>
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Telefone
                </Label>
                <Input
                  id="phone"
                  value={profile.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informações Profissionais */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Informações Profissionais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="department" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Departamento
                </Label>
                <Input
                  id="department"
                  value={profile.department || ''}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  placeholder="Ex: Tecnologia"
                />
              </div>
              <div>
                <Label htmlFor="position">Cargo</Label>
                <Input
                  id="position"
                  value={profile.position || ''}
                  onChange={(e) => handleInputChange('position', e.target.value)}
                  placeholder="Ex: Desenvolvedor"
                />
              </div>
              <div>
                <Label htmlFor="hire_date" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Data de Contratação
                </Label>
                <Input
                  id="hire_date"
                  type="date"
                  value={profile.hire_date || ''}
                  onChange={(e) => handleInputChange('hire_date', e.target.value)}
                />
              </div>
            </div>

            <Separator />

            <div>
              <Label htmlFor="bio" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Biografia
              </Label>
              <Textarea
                id="bio"
                value={profile.bio || ''}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Conte um pouco sobre você, sua experiência e interesses..."
                rows={4}
              />
            </div>

            <Separator />

            <div>
              <Label className="flex items-center gap-2 mb-3">
                <Plus className="h-4 w-4" />
                Habilidades
              </Label>
              
              <div className="flex gap-2 mb-3">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Adicionar habilidade"
                  onKeyPress={(e) => e.key === 'Enter' && handleSkillAdd()}
                />
                <Button type="button" onClick={handleSkillAdd} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {profile.skills?.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {skill}
                    <button
                      onClick={() => handleSkillRemove(index)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};