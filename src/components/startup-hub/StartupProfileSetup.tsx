
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Building, Plus, X } from 'lucide-react';
import { useStartupProfile, StartupProfileType } from '@/hooks/useStartupProfile';

export const StartupProfileSetup: React.FC = () => {
  const { profile, company, createProfile, isCreatingProfile } = useStartupProfile();
  const [website, setWebsite] = useState(profile?.website || company?.website || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [expertiseAreas, setExpertiseAreas] = useState<string[]>(profile?.areas_of_expertise || []);
  const [newExpertise, setNewExpertise] = useState('');

  const handleAddExpertise = () => {
    if (newExpertise.trim() && !expertiseAreas.includes(newExpertise.trim())) {
      setExpertiseAreas([...expertiseAreas, newExpertise.trim()]);
      setNewExpertise('');
    }
  };

  const handleRemoveExpertise = (area: string) => {
    setExpertiseAreas(expertiseAreas.filter(a => a !== area));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile) {
      console.error('Perfil não encontrado');
      return;
    }
    
    const profileData = {
      website: website || undefined,
      bio: bio || undefined,
      areas_of_expertise: expertiseAreas.length > 0 ? expertiseAreas : undefined
    };

    createProfile({ type: profile.type, data: profileData });
  };

  const isFormValid = () => {
    return bio.trim().length > 0 || expertiseAreas.length > 0;
  };

  if (!profile) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="h-5 w-5" />
              <span>Acesso Negado</span>
            </CardTitle>
            <CardDescription>
              Você precisa ter um perfil criado pelo administrador para acessar esta área.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="h-5 w-5" />
            <span>{profile ? 'Complete seu Perfil' : 'Configure seu Perfil'}</span>
          </CardTitle>
          <CardDescription>
            Complete as informações do seu perfil no Startup HUB.
            {company && (
              <div className="mt-2 p-2 bg-muted rounded-lg">
                <strong>Startup:</strong> {company.name}
                {company.mission && <div className="text-sm text-muted-foreground mt-1">{company.mission}</div>}
              </div>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Mostrar informações do tipo de perfil (apenas leitura) */}
            <div className="p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center space-x-3">
                <Building className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-medium">
                    Tipo de Perfil: {profile.type === 'startup' ? 'Startup' : 'Mentor'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {profile.type === 'startup' 
                      ? 'Você está registrado como membro de uma startup'
                      : 'Você está registrado como mentor'
                    }
                  </div>
                </div>
              </div>
              {profile.type !== 'startup' && (
                <div className="text-xs text-muted-foreground mt-2">
                  <strong>Nota:</strong> O tipo de perfil só pode ser alterado pelo administrador.
                </div>
              )}
            </div>

            {/* Website */}
            <div>
              <Label htmlFor="website">Website {profile.type === 'startup' ? 'da Startup' : 'Pessoal'}</Label>
              <Input
                id="website"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder={
                  profile.type === 'startup'
                    ? 'https://suastartup.com'
                    : 'https://seusite.com'
                }
              />
            </div>

            {/* Bio */}
            <div>
              <Label htmlFor="bio">
                {profile.type === 'startup' ? 'Sobre Você na Startup' : 'Sobre Você'} *
              </Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={
                  profile.type === 'startup'
                    ? 'Descreva brevemente seu papel na startup e sua experiência...'
                    : 'Descreva sua experiência e como pode ajudar startups...'
                }
                rows={4}
                required
              />
            </div>

            {/* Areas of Expertise */}
            <div>
              <Label>
                Áreas de {profile.type === 'startup' ? 'Atuação' : 'Expertise'} *
              </Label>
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <Input
                    value={newExpertise}
                    onChange={(e) => setNewExpertise(e.target.value)}
                    placeholder={
                      profile.type === 'startup'
                        ? 'Ex: FinTech, E-commerce, SaaS...'
                        : 'Ex: Marketing, Vendas, Tecnologia...'
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddExpertise();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddExpertise} variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {expertiseAreas.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {expertiseAreas.map((area) => (
                      <Badge key={area} variant="secondary" className="flex items-center space-x-1">
                        <span>{area}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveExpertise(area)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={!isFormValid() || isCreatingProfile}
              className="w-full"
            >
              {isCreatingProfile
                ? 'Salvando...'
                : profile
                ? 'Atualizar Perfil'
                : 'Criar Perfil'
              }
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
