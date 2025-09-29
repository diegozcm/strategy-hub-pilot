import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarUI } from '@/components/ui/calendar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, MoreVertical, Plus, Eye, Edit, Calendar, Clock, ArrowLeft } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MentoringSession } from '@/hooks/useMentorSessions';
import { ActionItemsManager } from '@/components/startup-hub/ActionItemsManager';

// Unified session type for calendar display
type CalendarSession = MentoringSession & {
  mentor_name?: string;
};
import { cn } from '@/lib/utils';

interface CalendarGridProps {
  sessions: CalendarSession[];
  isMentor: boolean;
  onCreateSession?: (date: Date) => void;
  onEditSession?: (session: CalendarSession) => void;
  selectedMonth: Date;
  onMonthChange: (date: Date) => void;
}

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
  const [selectedSession, setSelectedSession] = useState<CalendarSession | null>(null);
  const [isSessionDetailOpen, setIsSessionDetailOpen] = useState(false);

  // Get days in the month
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get sessions for a specific day
  const getSessionsForDay = (date: Date) => {
    return sessions.filter(session => 
      isSameDay(new Date(session.session_date), date)
    );
  };

  // Handle day click
  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setIsDayModalOpen(true);
  };

  // Handle session click for detailed view
  const handleSessionClick = (session: CalendarSession) => {
    setSelectedSession(session);
    setIsSessionDetailOpen(true);
    setIsDayModalOpen(false);
  };

  // Get session types for display
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

  // Navigation handlers
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
          {/* Days of week header */}
          <div className="grid grid-cols-7 border-b">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
              <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground border-r last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {daysInMonth.map((date) => {
              const daySessions = getSessionsForDay(date);
              const isCurrentDay = isToday(date);
              
              return (
                <div
                  key={date.toISOString()}
                  className="min-h-[100px] border-r border-b last:border-r-0 p-2 hover:bg-muted/50 cursor-pointer group"
                  onClick={() => handleDayClick(date)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn(
                      "text-sm font-medium",
                      isCurrentDay && "text-primary font-bold"
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

                  {/* Sessions for this day */}
                  <div className="space-y-1">
                    {daySessions.slice(0, 2).map((session) => (
                      <div
                        key={session.id}
                        className="p-1 rounded text-xs bg-primary/10 text-primary truncate"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSessionClick(session);
                        }}
                      >
                        {isMentor ? session.startup_name : session.mentor_name || 'Mentor'}
                      </div>
                    ))}
                    {daySessions.length > 2 && (
                      <div className="text-xs text-muted-foreground">
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
                                 {isMentor ? session.startup_name : session.mentor_name || 'Mentor'}
                               </h4>
                               <Badge variant="outline">
                                 {getSessionTypeLabel(session.session_type)}
                               </Badge>
                               <div className="flex items-center text-sm text-muted-foreground">
                                 <Clock className="h-4 w-4 mr-1" />
                                 {session.duration}min
                               </div>
                             </div>
                           {session.notes && (
                             <p className="text-sm text-muted-foreground line-clamp-2">
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
                           {isMentor && onEditSession && (
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
                          {isMentor ? selectedSession.startup_name : selectedSession.mentor_name || 'Mentor'}
                        </CardTitle>
                        <Badge variant="outline">
                          {getSessionTypeLabel(selectedSession.session_type)}
                        </Badge>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4 mr-1" />
                          {format(new Date(selectedSession.session_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 mr-1" />
                          {selectedSession.duration}min
                        </div>
                      </div>
                    </div>
                    {isMentor && onEditSession && (
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
                  
                  {/* Action Items Manager */}
                  <div className="mt-4">
                    <ActionItemsManager sessionId={selectedSession.id} canEdit={isMentor} />
                  </div>
                  
                  {selectedSession.follow_up_date && (
                    <div className="text-sm text-muted-foreground mt-4 p-3 bg-muted/50 rounded-lg">
                      <strong>Follow-up agendado:</strong> {format(new Date(selectedSession.follow_up_date), 'dd/MM/yyyy', { locale: ptBR })}
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