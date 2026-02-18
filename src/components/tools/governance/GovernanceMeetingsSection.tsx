import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGovernanceMeetings, type MeetingFormData } from '@/hooks/useGovernanceMeetings';
import { Plus, CalendarDays, Clock, MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GovernanceMeetingForm } from './GovernanceMeetingForm';
import { GovernanceCalendarGrid } from './GovernanceCalendarGrid';
import { MeetingDetailModal } from './MeetingDetailModal';
import { format, isSameDay, isSameMonth, parseISO, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { GovernanceMeeting } from '@/hooks/useGovernanceMeetings';

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  scheduled: { label: 'Agendada', variant: 'default' },
  completed: { label: 'Concluída', variant: 'secondary' },
  cancelled: { label: 'Cancelada', variant: 'destructive' },
};

const typeColors: Record<string, string> = {
  RM: 'bg-blue-500',
  RE: 'bg-emerald-500',
  Extraordinaria: 'bg-amber-500',
};

const typeBorderColors: Record<string, string> = {
  RM: 'border-l-blue-500',
  RE: 'border-l-emerald-500',
  Extraordinaria: 'border-l-amber-500',
};

export const GovernanceMeetingsSection: React.FC = () => {
  const { meetings, isLoading, addMeeting, updateMeeting, updateMeetingStatus, deleteMeeting } = useGovernanceMeetings();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [month, setMonth] = useState<Date>(new Date());
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailMeeting, setDetailMeeting] = useState<GovernanceMeeting | null>(null);

  const dayMeetings = meetings.filter(m => isSameDay(parseISO(m.scheduled_date), selectedDate));

  const nextMeeting = useMemo(() => {
    const now = new Date();
    return meetings
      .filter(m => m.status === 'scheduled' && isAfter(parseISO(m.scheduled_date), now))
      .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date))[0] || null;
  }, [meetings]);

  const handleAddMeeting = (data: MeetingFormData) => {
    addMeeting.mutate(data, { onSuccess: () => setCreateDialogOpen(false) });
  };

  // Keep detailMeeting in sync with latest data
  const currentDetailMeeting = detailMeeting
    ? meetings.find(m => m.id === detailMeeting.id) || detailMeeting
    : null;

  if (isLoading) {
    return <div className="flex items-center justify-center py-8 text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-cofound-blue-light" />
            <h3 className="text-lg font-display font-semibold">Agenda de Reuniões</h3>
          </div>
          {nextMeeting && (
            <p className="text-xs text-muted-foreground mt-1 ml-7">
              Próxima: <span className="font-medium text-cofound-blue-light">{nextMeeting.title}</span>
              {' — '}
              {format(parseISO(nextMeeting.scheduled_date), "dd/MM", { locale: ptBR })}
              {nextMeeting.scheduled_time && ` às ${nextMeeting.scheduled_time.slice(0, 5)}`}
            </p>
          )}
        </div>
        <Button size="sm" variant="cofound" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Nova Reunião
        </Button>
      </div>

      {/* Create dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Agendar Reunião</DialogTitle>
          </DialogHeader>
          <GovernanceMeetingForm onSubmit={handleAddMeeting} isPending={addMeeting.isPending} initialData={{ scheduled_date: format(selectedDate, 'yyyy-MM-dd') }} />
        </DialogContent>
      </Dialog>

      {/* Calendar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Calendar - 80% */}
            <div className="w-4/5 min-w-0">
              <GovernanceCalendarGrid
                month={month}
                onMonthChange={setMonth}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                meetings={meetings}
              />
            </div>

            {/* Day details - 20% */}
            <div className="w-1/5 min-w-[200px] border-l pl-4">
              <h4 className="text-sm font-display font-semibold flex flex-col gap-1 mb-3">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-cofound-blue-light" />
                  {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                </div>
                {dayMeetings.length > 0 && (
                  <Badge variant="outline" className="text-[10px] w-fit">{dayMeetings.length} reunião(ões)</Badge>
                )}
              </h4>

              {dayMeetings.length > 0 ? (
                <div className="space-y-2">
                  {dayMeetings.map(m => (
                    <div
                      key={m.id}
                      onClick={() => setDetailMeeting(m)}
                      className={cn(
                        'p-3 border rounded-lg bg-card border-l-[3px] cursor-pointer hover:bg-muted/60 transition-all',
                        typeBorderColors[m.meeting_type] || 'border-l-muted-foreground'
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn('h-2 w-2 rounded-full shrink-0', typeColors[m.meeting_type] || 'bg-muted-foreground')} />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{m.meeting_type === 'Extraordinaria' ? 'EX' : m.meeting_type}</span>
                      </div>
                      <p className="font-display font-semibold text-xs truncate">{m.title}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        {m.scheduled_time ? (
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Clock className="h-2.5 w-2.5" />
                            {m.scheduled_time.slice(0, 5)}
                          </span>
                        ) : <span />}
                        <Badge variant={statusLabels[m.status]?.variant || 'default'} className="text-[9px] px-1.5 py-0">
                          {statusLabels[m.status]?.label || m.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground text-xs mb-2">Nenhuma reunião neste dia</p>
                  <Button variant="cofound" size="sm" className="text-xs" onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-3 w-3 mr-1" /> Agendar
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meeting Detail Modal */}
      {currentDetailMeeting && (
        <MeetingDetailModal
          meeting={currentDetailMeeting}
          open={!!detailMeeting}
          onOpenChange={(open) => { if (!open) setDetailMeeting(null); }}
          onStatusChange={updateMeetingStatus.mutate}
          onDelete={(id) => { deleteMeeting.mutate(id); setDetailMeeting(null); }}
          onUpdate={updateMeeting.mutate}
          isUpdating={updateMeeting.isPending}
        />
      )}
    </div>
  );
};
