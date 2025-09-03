import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, User, MessageSquare, Info } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MentoringSessionWithMentor } from '@/hooks/useStartupSessions';
import { ActionItemsManager } from './ActionItemsManager';

interface SessionAccordionProps {
  sessions: MentoringSessionWithMentor[];
}

const sessionTypes = [
  { value: 'general', label: 'Geral' },
  { value: 'strategy', label: 'Estratégia' },
  { value: 'product', label: 'Produto' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'finance', label: 'Financeiro' },
  { value: 'team', label: 'Equipe' },
  { value: 'pitch', label: 'Pitch' }
];

const getPriorityColor = (priority: string): 'destructive' | 'default' | 'secondary' => {
  switch (priority.toLowerCase()) {
    case 'alta':
      return 'destructive';
    case 'media':
      return 'default';
    case 'baixa':
      return 'secondary';
    default:
      return 'default';
  }
};

export const SessionAccordion: React.FC<SessionAccordionProps> = ({ sessions }) => {
  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhuma sessão registrada</h3>
          <p className="text-muted-foreground">
            Suas sessões de mentoria aparecerão aqui quando forem registradas pelo mentor
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Accordion type="single" collapsible className="space-y-4">
      {sessions.map((session) => (
        <AccordionItem 
          key={session.id} 
          value={session.id}
          className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
        >
          <AccordionTrigger className="px-6 py-4 hover:no-underline">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <span className="font-medium">{session.mentor_name}</span>
                </div>
                <Badge variant="outline">
                  {sessionTypes.find(t => t.value === session.session_type)?.label || session.session_type}
                </Badge>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(session.session_date), 'dd/MM/yyyy', { locale: ptBR })}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {session.duration}min
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Removed tips count display */}
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-4">
            <div className="space-y-4">
              {/* Session Notes */}
              {session.notes && (
                <div>
                  <h4 className="font-medium text-sm mb-2 text-muted-foreground flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Notas da Sessão
                  </h4>
                  <p className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-md">{session.notes}</p>
                </div>
              )}

              {/* Action Items */}
              <div>
                <ActionItemsManager sessionId={session.id} canEdit={false} />
              </div>

              {/* Tips removed - no longer showing tips */}

              {/* Follow-up */}
              {session.follow_up_date && (
                <div className="text-sm">
                  <Badge variant="secondary" className="text-xs">
                    <Calendar className="h-3 w-3 mr-1" />
                    Follow-up: {format(new Date(session.follow_up_date), 'dd/MM/yyyy', { locale: ptBR })}
                  </Badge>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};