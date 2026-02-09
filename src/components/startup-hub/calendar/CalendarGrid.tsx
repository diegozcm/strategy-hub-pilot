import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ChevronLeft, ChevronRight, MoreVertical, Plus, Eye, Edit, Calendar, Clock, ArrowLeft } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MentoringSession } from '@/hooks/useMentorSessions';
import { ActionItemsManager } from '@/components/startup-hub/ActionItemsManager';
import { cn } from '@/lib/utils';

interface CalendarGridProps {
  sessions: MentoringSession[];
  isMentor: boolean;
  onCreateSession?: (date: Date) => void;
  onEditSession?: (session: MentoringSession) => void;
  selectedMonth: Date;
  onMonthChange: (date: Date) => void;
}

const getMentorInitials = (name?: string) => {
  if (!name) return 'M';
  return name.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
};

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  sessions,
  isMentor,
  onCreateSession,
  onEditSession,
  selectedMonth,
  onMonthChange
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<MentoringSession | null>(null);
  const [isSessionDetailOpen, setIsSessionDetailOpen] = useState(false);

  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getSessionsForDay = (date: Date) => {
    return sessions.filter(session => 
      isSameDay(parseISO(session.session_date), date)
    );
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setIsDayModalOpen(true);
  };

  const handleSessionClick = (session: MentoringSession) => {
    setSelectedSession(session);
    setIsSessionDetailOpen(true);
    setIsDayModalOpen(false);
  };

  const getSessionTypeLabel = (type: string) => {
    const sessionTypes = [
      { value: 'general', label: 'Geral' },
      { value: 'strategy', label: 'Estratégia' },
      { value: 'technical', label: 'Técnica' },
      { value: 'pitch', label: 'Pitch' },
      { value: 'financial', label: 'Financeiro' },
      { value: 'legal', label: 'Jurídico' },
      { value: 'marketing', label: 'Marketing' },
      { value: 'follow_up', label: 'Follow-up' }
    ];
    return sessionTypes.find(t => t.value === type)?.label || type;
  };

  const goToPreviousMonth = () => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    onMonthChange(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    onMonthChange(newDate);
  };

  const selectedDateSessions = selectedDate ? getSessionsForDay(selectedDate) : [];

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}
        </h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-7 border-b">
            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day) => (
              <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground border-r last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {calendarDays.map((date) => {
              const daySessions = getSessionsForDay(date);
              const isCurrentDay = isToday(date);
              const isCurrentMonth = date.getMonth() === selectedMonth.getMonth();
              
              return (
                <div
                  key={date.toISOString()}
                  className={cn(
                    "min-h-[100px] border-r border-b last:border-r-0 p-2 hover:bg-muted/50 cursor-pointer group",
                    !isCurrentMonth && "text-muted-foreground bg-muted/20"
                  )}
                  onClick={() => handleDayClick(date)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn(
                      "text-sm font-medium",
                      isCurrentDay && "text-primary font-bold",
                      !isCurrentMonth && "text-muted-foreground"
                    )}>
                      {format(date, 'd')}
                    </span>
                    {isMentor && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:opacity-100">
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            onCreateSession?.(date);
                          }}>
                            <Plus className="h-4 w-4 mr-2" />
                            Nova Sessão
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            handleDayClick(date);
                          }}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Sessões
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    {daySessions.slice(0, 2).map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all hover:scale-[1.02] hover:shadow-sm"
                        style={{
                          backgroundColor: session.is_own_session ? '#CDD966' : '#0E263D',
                          color: session.is_own_session ? '#10283F' : '#ffffff',
                          borderLeft: `3px solid ${session.is_own_session ? '#10283F' : '#CDD966'}`,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSessionClick(session);
                        }}
                      >
                        <Avatar className="h-4 w-4 shrink-0">
                          <AvatarImage src={session.mentor_avatar_url || undefined} />
                          <AvatarFallback
                            className="text-[8px] font-bold"
                            style={{
                              backgroundColor: session.is_own_session ? '#10283F' : '#CDD966',
                              color: session.is_own_session ? '#CDD966' : '#10283F',
                            }}
                          >
                            {getMentorInitials(session.mentor_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate leading-tight">
                          {session.startup_name}
                        </span>
                      </div>
                    ))}
                    {daySessions.length > 2 && (
                      <div className="text-[10px] font-medium text-muted-foreground pl-1">
                        +{daySessions.length - 2} mais
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Day Sessions Modal */}
      <Dialog open={isDayModalOpen} onOpenChange={setIsDayModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Sessões do dia {selectedDate && format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedDateSessions.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhuma sessão agendada para este dia</p>
                {isMentor && onCreateSession && selectedDate && (
                  <Button 
                    className="mt-4" 
                    onClick={() => {
                      onCreateSession(selectedDate);
                      setIsDayModalOpen(false);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agendar Sessão
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDateSessions.map((session) => (
                  <Card key={session.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                          <div className="flex-1">
                             <div className="flex items-center gap-3 mb-2">
                               <h4 className="font-medium">
                                 {session.startup_name}
                               </h4>
                               <Badge variant="outline">
                                 {getSessionTypeLabel(session.session_type)}
                               </Badge>
                               <div className="flex items-center text-sm text-muted-foreground">
                                 <Clock className="h-4 w-4 mr-1" />
                                 {session.duration}min
                               </div>
                             </div>
                             {/* Mentor info */}
                             <div className="flex items-center gap-2 mt-1">
                               <Avatar className="h-5 w-5">
                                 <AvatarImage src={session.mentor_avatar_url || undefined} />
                                 <AvatarFallback className="text-[10px]">
                                   {getMentorInitials(session.mentor_name)}
                                 </AvatarFallback>
                               </Avatar>
                               <span className="text-xs text-muted-foreground">
                                 {session.is_own_session ? 'Sua sessão' : session.mentor_name}
                               </span>
                             </div>
                           {session.notes && (
                             <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                               {session.notes}
                             </p>
                           )}
                         </div>
                         <div className="flex gap-2">
                           <Button 
                             variant="outline" 
                             size="sm"
                             onClick={() => {
                               handleSessionClick(session);
                             }}
                           >
                             <Eye className="h-4 w-4" />
                           </Button>
                           {isMentor && onEditSession && session.is_own_session && (
                             <Button 
                               variant="outline" 
                               size="sm"
                               onClick={() => {
                                 onEditSession(session);
                                 setIsDayModalOpen(false);
                               }}
                             >
                               <Edit className="h-4 w-4" />
                             </Button>
                           )}
                         </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Session Detail Modal */}
      <Dialog open={isSessionDetailOpen} onOpenChange={setIsSessionDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setIsSessionDetailOpen(false);
                  setIsDayModalOpen(true);
                }}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Detalhes da Sessão de Mentoria
              </DialogTitle>
            </div>
          </DialogHeader>
          
          {selectedSession && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-lg">
                          {selectedSession.startup_name}
                        </CardTitle>
                        <Badge variant="outline">
                          {getSessionTypeLabel(selectedSession.session_type)}
                        </Badge>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4 mr-1" />
                          {format(parseISO(selectedSession.session_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 mr-1" />
                          {selectedSession.duration}min
                        </div>
                      </div>
                      {/* Mentor info */}
                      <div className="flex items-center gap-2 mt-1">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={selectedSession.mentor_avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {getMentorInitials(selectedSession.mentor_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground">
                          {selectedSession.is_own_session ? 'Sua sessão' : selectedSession.mentor_name}
                        </span>
                      </div>
                    </div>
                    {isMentor && onEditSession && selectedSession.is_own_session && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          onEditSession(selectedSession);
                          setIsSessionDetailOpen(false);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedSession.notes && (
                    <div className="mb-4">
                      <h4 className="font-medium text-sm mb-2 text-muted-foreground">Notas da Sessão</h4>
                      <p className="text-sm whitespace-pre-wrap border-l-4 border-primary/20 pl-4 py-2">
                        {selectedSession.notes}
                      </p>
                    </div>
                  )}
                  
                  <div className="mt-4">
                    <ActionItemsManager sessionId={selectedSession.id} canEdit={selectedSession.is_own_session === true} />
                  </div>
                  
                  {selectedSession.follow_up_date && (
                    <div className="text-sm text-muted-foreground mt-4 p-3 bg-muted/50 rounded-lg">
                      <strong>Follow-up agendado:</strong> {format(parseISO(selectedSession.follow_up_date), 'dd/MM/yyyy', { locale: ptBR })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
