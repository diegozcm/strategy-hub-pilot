import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGovernanceMeetings, type MeetingFormData } from '@/hooks/useGovernanceMeetings';
import { Plus, CalendarDays } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { GovernanceMeetingForm } from './GovernanceMeetingForm';
import { GovernanceCalendarGrid } from './GovernanceCalendarGrid';
import { MeetingCard } from './MeetingCard';
import { format, isSameDay, isSameMonth, parseISO, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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

export const GovernanceMeetingsSection: React.FC = () => {
  const { meetings, isLoading, addMeeting, updateMeeting, updateMeetingStatus, deleteMeeting } = useGovernanceMeetings();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [month, setMonth] = useState<Date>(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);

  const monthMeetings = useMemo(
    () => meetings
      .filter(m => isSameMonth(parseISO(m.scheduled_date), month))
      .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date)),
    [meetings, month]
  );

  const dayMeetings = meetings.filter(m => isSameDay(parseISO(m.scheduled_date), selectedDate));

  const nextMeeting = useMemo(() => {
    const now = new Date();
    return meetings
      .filter(m => m.status === 'scheduled' && isAfter(parseISO(m.scheduled_date), now))
      .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date))[0] || null;
  }, [meetings]);

  const handleAddMeeting = (data: MeetingFormData) => {
    addMeeting.mutate(data, { onSuccess: () => setDialogOpen(false) });
  };

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
            <Badge variant="outline" className="text-xs ml-1">{monthMeetings.length} no mês</Badge>
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
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="cofound"><Plus className="h-4 w-4 mr-1" /> Nova Reunião</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">Agendar Reunião</DialogTitle>
            </DialogHeader>
            <GovernanceMeetingForm onSubmit={handleAddMeeting} isPending={addMeeting.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Calendar */}
      <Card>
        <CardContent className="p-4">
          <GovernanceCalendarGrid
            month={month}
            onMonthChange={setMonth}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            meetings={meetings}
          />

          {/* Selected day details */}
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-display font-semibold flex items-center gap-2 mb-3">
              <CalendarDays className="h-4 w-4 text-cofound-blue-light" />
              {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              {dayMeetings.length > 0 && (
                <Badge variant="outline" className="text-[10px]">{dayMeetings.length} reunião(ões)</Badge>
              )}
            </h4>

            {dayMeetings.length > 0 ? (
              <div className="space-y-3">
                {dayMeetings.map(m => (
                  <MeetingCard
                    key={m.id}
                    meeting={m}
                    onStatusChange={updateMeetingStatus.mutate}
                    onDelete={deleteMeeting.mutate}
                    onUpdate={updateMeeting.mutate}
                    isUpdating={updateMeeting.isPending}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground text-sm mb-2">Nenhuma reunião neste dia</p>
                <Button variant="cofound" size="sm" onClick={() => setDialogOpen(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Agendar para este dia
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Monthly table */}
      {monthMeetings.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="text-sm font-display font-semibold mb-3 capitalize">
              Reuniões de {format(month, 'MMMM yyyy', { locale: ptBR })} ({monthMeetings.length})
            </h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[70px]">Data</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead className="w-[60px]">Tipo</TableHead>
                  <TableHead className="w-[70px]">Horário</TableHead>
                  <TableHead className="w-[120px]">Local</TableHead>
                  <TableHead className="w-[90px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthMeetings.map(m => (
                  <TableRow
                    key={m.id}
                    className={cn('cursor-pointer', isSameDay(parseISO(m.scheduled_date), selectedDate) && 'bg-cofound-blue-light/5')}
                    onClick={() => setSelectedDate(parseISO(m.scheduled_date))}
                  >
                    <TableCell className="font-mono text-xs">{format(parseISO(m.scheduled_date), 'dd/MM')}</TableCell>
                    <TableCell className="font-medium text-sm">{m.title}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className={cn('h-2 w-2 rounded-full', typeColors[m.meeting_type] || 'bg-muted-foreground')} />
                        <span className="text-xs">{m.meeting_type}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{m.scheduled_time?.slice(0, 5) || '—'}</TableCell>
                    <TableCell className="text-xs truncate max-w-[120px]">{m.location || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={statusLabels[m.status]?.variant || 'default'} className="text-[10px]">
                        {statusLabels[m.status]?.label || m.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
