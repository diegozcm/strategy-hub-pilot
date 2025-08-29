import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Globe, Lock, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MentoringTip {
  id: string;
  mentor_id: string;
  startup_company_id?: string;
  title: string;
  content: string;
  category: string;
  priority: string;
  is_public: boolean;
  status: string;
  created_at: string;
  updated_at: string;
  mentor_profile?: {
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
}

interface TipCardProps {
  tip: MentoringTip;
}

export const TipCard: React.FC<TipCardProps> = ({ tip }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta': return 'destructive';
      case 'media': return 'default';
      case 'baixa': return 'secondary';
      default: return 'default';
    }
  };

  const getMentorName = () => {
    const profile = tip.mentor_profile;
    if (profile?.first_name || profile?.last_name) {
      return `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    }
    return 'Mentor Anônimo';
  };

  const getMentorInitials = () => {
    const profile = tip.mentor_profile;
    const firstName = profile?.first_name || 'M';
    const lastName = profile?.last_name || 'A';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="space-y-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <CardTitle className="text-lg">{tip.title}</CardTitle>
              <Badge variant={getPriorityColor(tip.priority)}>
                {tip.priority}
              </Badge>
              <Badge variant="outline">
                {tip.category}
              </Badge>
              {tip.is_public ? (
                <Badge variant="secondary">
                  <Globe className="h-3 w-3 mr-1" />
                  Pública
                </Badge>
              ) : (
                <Badge variant="outline">
                  <Lock className="h-3 w-3 mr-1" />
                  Direcionada
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage 
                src={tip.mentor_profile?.avatar_url} 
                alt={getMentorName()}
              />
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{getMentorName()}</p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(tip.created_at), 'dd/MM/yyyy \'às\' HH:mm', { locale: ptBR })}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="prose prose-sm max-w-none">
          <p className="text-sm whitespace-pre-wrap">{tip.content}</p>
        </div>
      </CardContent>
    </Card>
  );
};