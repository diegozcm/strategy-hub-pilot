import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGovernanceMeetings, type MeetingFormData } from '@/hooks/useGovernanceMeetings';
import { Calendar } from '@/components/ui/calendar';
import { Plus, MapPin, Clock, CalendarDays, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { GovernanceMeetingForm } from './GovernanceMeetingForm';
import { format, isSameDay, parseISO, startOfMonth, endOfMonth, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  scheduled: { label: 'Agendada', variant: 'default' },
  completed: { label: 'Concluída', variant: 'secondary' },
  cancelled: { label: 'Cancelada', variant: 'destructive' },
};

const typeLabels: Record<string, string> = {
  RM: 'Reunião de Monitoramento',
  RE: 'Reunião de Execução',
  Extraordinaria: 'Extraordinária',
};

export const GovernanceMeetingsSection: React.FC = () => {
  const { meetings, isLoading, addMeeting, updateMeetingStatus, deleteMeeting } = useGovernanceMeetings();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [month, setMonth] = useState<Date>(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);

  const meetingDates = meetings.map(m => parseISO(m.scheduled_date));
  const monthMeetings = meetings.filter(m => isSameMonth(parseISO(m.scheduled_date), month));
  const dayMeetings = meetings.filter(m => isSameDay(parseISO(m.scheduled_date), selectedDate));

  const handleAddMeeting = (data: MeetingFormData) => {
    addMeeting.mutate(data, { onSuccess: () => setDialogOpen(false) });
  };

  // Highlight days with meetings
  const modifiers = {
    hasMeeting: meetingDates,
  };
  const modifiersStyles = {
    hasMeeting: { 
      fontWeight: 'bold' as const,
      textDecoration: 'underline' as const,
      textDecorationColor: 'hsl(var(--primary))',
      textUnderlineOffset: '3px',
    },
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-8 text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Agenda de Reuniões</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nova Reunião</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Agendar Reunião</DialogTitle>
            </DialogHeader>
            <GovernanceMeetingForm onSubmit={handleAddMeeting} isPending={addMeeting.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Calendar */}
        <Card>
          <CardContent className="p-3 flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => d && setSelectedDate(d)}
              month={month}
              onMonthChange={setMonth}
              locale={ptBR}
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
              className={cn("p-3 pointer-events-auto")}
            />
          </CardContent>
        </Card>

        {/* Day meetings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dayMeetings.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">Nenhuma reunião neste dia</p>
            ) : (
              <div className="space-y-3">
                {dayMeetings.map(m => (
                  <MeetingCard key={m.id} meeting={m} onStatusChange={updateMeetingStatus.mutate} onDelete={deleteMeeting.mutate} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Month list */}
      {monthMeetings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reuniões de {format(month, 'MMMM yyyy', { locale: ptBR })}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {monthMeetings.map(m => (
                <div
                  key={m.id}
                  className={cn(
                    "flex items-center justify-between p-2 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors",
                    isSameDay(parseISO(m.scheduled_date), selectedDate) && "bg-muted"
                  )}
                  onClick={() => setSelectedDate(parseISO(m.scheduled_date))}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-muted-foreground w-12">{format(parseISO(m.scheduled_date), 'dd/MM')}</span>
                    <span className="text-sm font-medium">{m.title}</span>
                    <Badge variant="outline" className="text-xs">{m.meeting_type}</Badge>
                  </div>
                  <Badge variant={statusLabels[m.status]?.variant || 'default'} className="text-xs">
                    {statusLabels[m.status]?.label || m.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const MeetingCard: React.FC<{
  meeting: any;
  onStatusChange: (data: { id: string; status: string }) => void;
  onDelete: (id: string) => void;
}> = ({ meeting, onStatusChange, onDelete }) => (
  <div className="p-3 border rounded-lg space-y-2">
    <div className="flex items-start justify-between">
      <div>
        <p className="font-medium text-sm">{meeting.title}</p>
        <p className="text-xs text-muted-foreground">{typeLabels[meeting.meeting_type] || meeting.meeting_type}</p>
      </div>
      <Badge variant={statusLabels[meeting.status]?.variant || 'default'} className="text-xs">
        {statusLabels[meeting.status]?.label || meeting.status}
      </Badge>
    </div>
    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
      {meeting.scheduled_time && (
        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{meeting.scheduled_time.slice(0, 5)}</span>
      )}
      {meeting.duration_minutes && (
        <span>{meeting.duration_minutes}min</span>
      )}
      {meeting.location && (
        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{meeting.location}</span>
      )}
    </div>
    {meeting.notes && <p className="text-xs text-muted-foreground">{meeting.notes}</p>}
    <div className="flex gap-1 pt-1">
      {meeting.status === 'scheduled' && (
        <>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onStatusChange({ id: meeting.id, status: 'completed' })}>
            <CheckCircle className="h-3 w-3 mr-1" /> Concluir
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onStatusChange({ id: meeting.id, status: 'cancelled' })}>
            <XCircle className="h-3 w-3 mr-1" /> Cancelar
          </Button>
        </>
      )}
      <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive ml-auto" onClick={() => onDelete(meeting.id)}>
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  </div>
);
