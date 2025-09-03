import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Users, Calendar, MessageSquare, ExternalLink } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface MentorData {
  mentor_id: string;
  mentor_name: string;
  mentor_avatar?: string;
  assigned_at: string;
  status: string;
}

export const MentorInfo = () => {
  const { user } = useAuth();
  const [mentor, setMentor] = useState<MentorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMentorInfo = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Get user's startup company
      const { data: company, error: companyError } = await supabase.rpc('get_user_startup_company', {
        _user_id: user.id
      });

      if (companyError || !company?.[0]) {
        setError('Não foi possível encontrar sua startup');
        return;
      }

      const companyId = company[0].id;

      // Get mentor relation
      const { data: mentorRelation, error: mentorError } = await supabase
        .from('mentor_startup_relations')
        .select(`
          mentor_id,
          assigned_at,
          status,
          profiles!inner (
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('startup_company_id', companyId)
        .eq('status', 'active')
        .single();

      if (mentorError) {
        if (mentorError.code === 'PGRST116') {
          // No mentor assigned
          setMentor(null);
        } else {
          console.error('Error fetching mentor:', mentorError);
          setError('Erro ao buscar informações do mentor');
        }
        return;
      }

      if (mentorRelation) {
        const profile = mentorRelation.profiles as any;
        setMentor({
          mentor_id: mentorRelation.mentor_id,
          mentor_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
          mentor_avatar: profile.avatar_url,
          assigned_at: mentorRelation.assigned_at,
          status: mentorRelation.status
        });
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMentorInfo();
  }, [user]);

  if (loading) {
    return (
      <Card className="mb-6">
        <CardContent className="flex items-center justify-center p-8">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mb-6 border-destructive/20">
        <CardContent className="p-6">
          <p className="text-destructive text-sm">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!mentor) {
    return (
      <Card className="mb-6 border-muted">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Mentor</CardTitle>
          </div>
          <CardDescription>
            Nenhum mentor atribuído à sua startup no momento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Para solicitar um mentor, entre em contato com a equipe de administração do programa.
          </p>
          <Button variant="outline" size="sm">
            <MessageSquare className="h-4 w-4 mr-2" />
            Solicitar Mentor
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">Seu Mentor</CardTitle>
          <Badge variant="secondary" className="ml-auto">
            {mentor.status === 'active' ? 'Ativo' : mentor.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={mentor.mentor_avatar} />
            <AvatarFallback>
              {mentor.mentor_name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{mentor.mentor_name}</p>
            <p className="text-sm text-muted-foreground">
              Atribuído em {new Date(mentor.assigned_at).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Agendar Sessão
          </Button>
          <Button variant="outline" size="sm">
            <MessageSquare className="h-4 w-4 mr-2" />
            Contatar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};