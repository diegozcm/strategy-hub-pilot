import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGovernanceMeetings, type MeetingFormData } from '@/hooks/useGovernanceMeetings';
import { Calendar } from '@/components/ui/calendar';
import { Plus, MapPin, Clock, CalendarDays, Trash2, CheckCircle, XCircle, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { GovernanceMeetingForm } from './GovernanceMeetingForm';
import { format, isSameDay, parseISO, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

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

  const modifiers = {
    hasMeeting: meetingDates,
  };
  const modifiersStyles = {
    hasMeeting: {
      fontWeight: 'bold' as const,
      textDecoration: 'underline' as const,
      textDecorationColor: 'hsl(var(--primary))',
      textUnderlineOffset: '4px',
    },
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-8 text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Agenda de Reuniões</h3>
        </div>
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

      {/* Main layout: Calendar (large) + Sidebar (compact) */}
      <div className="flex gap-4">
        {/* Calendar - 85% */}
        <Card className="flex-[5.5] min-w-0">
          <CardContent className="p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => d && setSelectedDate(d)}
              month={month}
              onMonthChange={setMonth}
              locale={ptBR}
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
              className={cn("p-3 pointer-events-auto w-full")}
              classNames={{
                months: "flex flex-col w-full",
                month: "space-y-6 w-full",
                caption: "flex justify-center pt-1 relative items-center mb-2",
                caption_label: "text-base font-semibold capitalize",
                nav: "space-x-1 flex items-center",
                nav_button: "h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100 border rounded-md inline-flex items-center justify-center",
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse",
                head_row: "flex w-full",
                head_cell: "text-muted-foreground rounded-md flex-1 font-medium text-sm py-2 text-center",
                row: "flex w-full mt-1",
                cell: cn(
                  "flex-1 text-center text-sm p-0.5 relative",
                  "[&:has([aria-selected].day-range-end)]:rounded-r-md",
                  "[&:has([aria-selected])]:bg-accent",
                  "first:[&:has([aria-selected])]:rounded-l-md",
                  "last:[&:has([aria-selected])]:rounded-r-md",
                  "focus-within:relative focus-within:z-20"
                ),
                day: "h-10 w-full rounded-md font-normal aria-selected:opacity-100 hover:bg-muted transition-colors inline-flex items-center justify-center",
                day_range_end: "day-range-end",
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_today: "bg-accent text-accent-foreground font-semibold",
                day_outside: "day-outside text-muted-foreground opacity-40 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                day_disabled: "text-muted-foreground opacity-50",
                day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                day_hidden: "invisible",
              }}
            />

            {/* Selected day details below calendar */}
            {dayMeetings.length > 0 && (
              <div className="mt-4 pt-4 border-t space-y-3">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </h4>
                {dayMeetings.map(m => (
                  <MeetingCard key={m.id} meeting={m} onStatusChange={updateMeetingStatus.mutate} onDelete={deleteMeeting.mutate} />
                ))}
              </div>
            )}

            {dayMeetings.length === 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-muted-foreground text-sm text-center py-3">
                  Nenhuma reunião em {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sidebar - 15% */}
        <Card className="flex-[1] min-w-[200px]">
          <CardHeader className="pb-2 px-3 pt-3">
            <CardTitle className="text-sm font-semibold capitalize">
              {format(month, 'MMMM yyyy', { locale: ptBR })}
            </CardTitle>
            <p className="text-xs text-muted-foreground">{monthMeetings.length} reuniões</p>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <ScrollArea className="h-[400px]">
              {monthMeetings.length === 0 ? (
                <p className="text-muted-foreground text-xs text-center py-6">Sem reuniões neste mês</p>
              ) : (
                <div className="space-y-1.5">
                  {monthMeetings.map(m => (
                    <div
                      key={m.id}
                      className={cn(
                        "p-2 rounded-md border cursor-pointer hover:bg-muted/50 transition-colors",
                        isSameDay(parseISO(m.scheduled_date), selectedDate) && "bg-primary/10 border-primary/30"
                      )}
                      onClick={() => setSelectedDate(parseISO(m.scheduled_date))}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs font-mono text-muted-foreground">{format(parseISO(m.scheduled_date), 'dd/MM')}</span>
                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">{m.meeting_type}</Badge>
                      </div>
                      <p className="text-xs font-medium truncate">{m.title}</p>
                      {m.scheduled_time && (
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="h-2.5 w-2.5" />{m.scheduled_time.slice(0, 5)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const MeetingCard: React.FC<{
  meeting: any;
  onStatusChange: (data: { id: string; status: string }) => void;
  onDelete: (id: string) => void;
}> = ({ meeting, onStatusChange, onDelete }) => (
  <div className="p-3 border rounded-lg space-y-2 bg-muted/20">
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
