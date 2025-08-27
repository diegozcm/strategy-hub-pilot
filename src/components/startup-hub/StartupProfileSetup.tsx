
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Building, Users, Plus, X } from 'lucide-react';
import { useStartupProfile, StartupProfileType } from '@/hooks/useStartupProfile';

export const StartupProfileSetup: React.FC = () => {
  const { profile, createProfile, isCreatingProfile } = useStartupProfile();
  const [profileType, setProfileType] = useState<StartupProfileType>(profile?.type || 'startup');
  const [website, setWebsite] = useState(profile?.website || '');
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
    
    const profileData = {
      website: website || undefined,
      bio: bio || undefined,
      areas_of_expertise: expertiseAreas.length > 0 ? expertiseAreas : undefined
    };

    createProfile({ type: profileType, data: profileData });
  };

  const isFormValid = () => {
    return bio.trim().length > 0 || expertiseAreas.length > 0;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>{profile ? 'Editar Perfil' : 'Configure seu Perfil'}</span>
          </CardTitle>
          <CardDescription>
            {profile ? 'Atualize suas informações do Startup HUB' : 'Complete as informações do seu perfil. As startups são criadas e gerenciadas pelo administrador.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Type Selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Tipo de Perfil</Label>
              <RadioGroup value={profileType} onValueChange={(value: StartupProfileType) => setProfileType(value)}>
                <div className="flex items-center space-x-2 p-4 border rounded-lg">
                  <RadioGroupItem value="startup" id="startup" />
                  <Label htmlFor="startup" className="flex items-center space-x-3 cursor-pointer flex-1">
                    <Building className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium">Startup</div>
                      <div className="text-sm text-muted-foreground">
                        Sou fundador(a) ou membro de uma startup
                      </div>
                    </div>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2 p-4 border rounded-lg">
                  <RadioGroupItem value="mentor" id="mentor" />
                  <Label htmlFor="mentor" className="flex items-center space-x-3 cursor-pointer flex-1">
                    <Users className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium">Mentor</div>
                      <div className="text-sm text-muted-foreground">
                        Quero apoiar e mentorar startups
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Startup-specific fields */}
            {profileType === 'startup' && (
              <div className="space-y-4 p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">
                  <strong>Nota:</strong> Startups são criadas e gerenciadas pelo administrador do sistema. 
                  Entre em contato com o administrador para ser associado à sua startup.
                </div>
              </div>
            )}

            {/* Bio */}
            <div>
              <Label htmlFor="bio">
                {profileType === 'startup' ? 'Sobre Você' : 'Sobre Você'} *
              </Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={
                  profileType === 'startup'
                    ? 'Descreva brevemente seu papel na startup e sua experiência...'
                    : 'Descreva sua experiência e como pode ajudar startups...'
                }
                rows={4}
                required
              />
            </div>

            {/* Areas of Expertise (especially for mentors) */}
            <div>
              <Label>
                Áreas de {profileType === 'startup' ? 'Atuação' : 'Expertise'} *
              </Label>
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <Input
                    value={newExpertise}
                    onChange={(e) => setNewExpertise(e.target.value)}
                    placeholder={
                      profileType === 'startup'
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
