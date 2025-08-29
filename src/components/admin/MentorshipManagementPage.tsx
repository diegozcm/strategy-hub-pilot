import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search, Users, Building2, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';

interface MentorProfile {
  user_id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

interface StartupCompany {
  id: string;
  name: string;
  mission?: string;
}

interface MentorStartupRelation {
  id: string;
  mentor_id: string;
  startup_company_id: string;
  assigned_at: string;
  status: string;
  mentor_profile: MentorProfile;
  company: StartupCompany;
}

export const MentorshipManagementPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [relations, setRelations] = useState<MentorStartupRelation[]>([]);
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [startups, setStartups] = useState<StartupCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMentor, setSelectedMentor] = useState('');
  const [selectedStartup, setSelectedStartup] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch existing relations with proper joins
      const { data: relationsData } = await supabase
        .from('mentor_startup_relations')
        .select(`
          *,
          companies!startup_company_id (
            id,
            name,
            mission
          )
        `)
        .order('assigned_at', { ascending: false });

      // Fetch mentor profiles separately
      const { data: mentorProfiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email')
        .in('user_id', relationsData?.map(r => r.mentor_id) || []);

      // Fetch available mentors from startup hub profiles
      const { data: mentorsData } = await supabase
        .from('startup_hub_profiles')
        .select('user_id')
        .eq('type', 'mentor')
        .eq('status', 'active');

      // Get mentor profile details
      const mentorIds = mentorsData?.map(m => m.user_id) || [];
      const { data: mentorProfilesData } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email')
        .in('user_id', mentorIds);

      // Fetch available startups
      const { data: startupsData } = await supabase
        .from('companies')
        .select('id, name, mission')
        .eq('company_type', 'startup')
        .eq('status', 'active');

      // Combine relations with mentor profiles
      const relationsWithProfiles = relationsData?.map(relation => ({
        ...relation,
        mentor_profile: mentorProfiles?.find(p => p.user_id === relation.mentor_id) || {
          user_id: relation.mentor_id,
          first_name: 'Desconhecido',
          last_name: '',
          email: ''
        },
        company: relation.companies
      })) || [];

      setRelations(relationsWithProfiles);
      setMentors(mentorProfilesData || []);
      setStartups(startupsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createRelation = async () => {
    if (!selectedMentor || !selectedStartup || !user) return;

    try {
      const { error } = await supabase
        .from('mentor_startup_relations')
        .insert([{
          mentor_id: selectedMentor,
          startup_company_id: selectedStartup,
          assigned_by: user.id
        }]);

      if (error) {
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Mentor associado à startup com sucesso!"
      });

      setIsCreateModalOpen(false);
      setSelectedMentor('');
      setSelectedStartup('');
      fetchData();
    } catch (error) {
      console.error('Error creating relation:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao criar associação",
        variant: "destructive"
      });
    }
  };

  const deleteRelation = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja remover esta associação?')) return;

    try {
      const { error } = await supabase
        .from('mentor_startup_relations')
        .delete()
        .eq('id', id);

      if (error) {
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Associação removida com sucesso!"
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting relation:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredRelations = relations.filter(relation => {
    const mentorName = `${relation.mentor_profile?.first_name || ''} ${relation.mentor_profile?.last_name || ''}`.toLowerCase();
    const startupName = relation.company?.name?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    return mentorName.includes(search) || startupName.includes(search);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold mb-2">Gestão de Mentorias</h1>
          <p className="text-muted-foreground">
            Gerencie as associações entre mentores e startups
          </p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Associação
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Associar Mentor à Startup</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Mentor</label>
                <Select value={selectedMentor} onValueChange={setSelectedMentor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um mentor" />
                  </SelectTrigger>
                  <SelectContent>
                    {mentors.map((mentor) => (
                      <SelectItem key={mentor.user_id} value={mentor.user_id}>
                        {mentor.first_name} {mentor.last_name} ({mentor.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Startup</label>
                <Select value={selectedStartup} onValueChange={setSelectedStartup}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma startup" />
                  </SelectTrigger>
                  <SelectContent>
                    {startups.map((startup) => (
                      <SelectItem key={startup.id} value={startup.id}>
                        {startup.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={createRelation}
                  disabled={!selectedMentor || !selectedStartup}
                >
                  Criar Associação
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por mentor ou startup..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredRelations.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma associação encontrada</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm 
                ? 'Tente ajustar o termo de busca'
                : 'Comece criando associações entre mentores e startups'
              }
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar primeira associação
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredRelations.map((relation) => (
            <Card key={relation.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-primary" />
                          <span>
                            {relation.mentor_profile?.first_name} {relation.mentor_profile?.last_name}
                          </span>
                        </div>
                        <span className="text-muted-foreground">→</span>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-secondary" />
                          <span>{relation.company?.name}</span>
                        </div>
                      </div>
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {relation.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Desde {new Date(relation.assigned_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteRelation(relation.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium mb-1">Mentor</h4>
                    <p className="text-muted-foreground">
                      {relation.mentor_profile?.email}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Startup</h4>
                    <p className="text-muted-foreground line-clamp-2">
                      {relation.company?.mission || 'Sem missão definida'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};