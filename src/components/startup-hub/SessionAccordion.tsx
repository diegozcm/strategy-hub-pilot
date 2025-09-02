import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, User, MessageSquare, Target, Info } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { MentoringSession } from '@/types/mentoring';

interface SessionAccordionProps {
  sessions: MentoringSession[];
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
                {session.tips_count! > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    <MessageSquare className="h-3 w-3 mr-1" />
                    {session.tips_count} {session.tips_count === 1 ? 'dica' : 'dicas'}
                  </Badge>
                )}
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
              {session.action_items && Array.isArray(session.action_items) && session.action_items.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2 text-muted-foreground flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Itens de Ação para Você
                  </h4>
                  <div className="bg-primary/5 p-3 rounded-md">
                    <ul className="text-sm space-y-2">
                      {(session.action_items as string[]).map((item, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-primary mr-2 font-bold">•</span>
                          <span className="flex-1">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Tips from this session */}
              {session.tips && session.tips.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-3 text-muted-foreground flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Dicas desta Sessão ({session.tips.length})
                  </h4>
                  <div className="space-y-3">
                    {session.tips.map((tip) => (
                      <Card key={tip.id} className="border-l-4 border-l-primary">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h5 className="font-medium text-base">{tip.title}</h5>
                            <div className="flex items-center gap-2">
                              <Badge variant={getPriorityColor(tip.priority)} className="text-xs">
                                {tip.priority}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {tip.category}
                              </Badge>
                              {tip.is_public && (
                                <Badge variant="secondary" className="text-xs">Pública</Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{tip.content}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {format(new Date(tip.created_at), 'dd/MM/yyyy às HH:mm', { locale: ptBR })}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

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