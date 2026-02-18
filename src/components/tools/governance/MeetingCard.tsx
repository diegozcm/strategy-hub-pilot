import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import type { GovernanceMeeting } from '@/hooks/useGovernanceMeetings';

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

interface Props {
  meeting: GovernanceMeeting;
  onStatusChange: (data: { id: string; status: string }) => void;
  onDelete: (id: string) => void;
}

export const MeetingCard: React.FC<Props> = ({ meeting, onStatusChange, onDelete }) => (
  <div className="p-4 border rounded-lg space-y-3 bg-card">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="font-medium text-sm">{meeting.title}</p>
        <p className="text-xs text-muted-foreground">{typeLabels[meeting.meeting_type] || meeting.meeting_type}</p>
      </div>
      <Badge variant={statusLabels[meeting.status]?.variant || 'default'} className="text-xs shrink-0">
        {statusLabels[meeting.status]?.label || meeting.status}
      </Badge>
    </div>

    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
      {meeting.scheduled_time && (
        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{meeting.scheduled_time.slice(0, 5)}</span>
      )}
      {meeting.duration_minutes && <span>{meeting.duration_minutes}min</span>}
      {meeting.location && (
        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{meeting.location}</span>
      )}
    </div>

    {meeting.notes && <p className="text-xs text-muted-foreground">{meeting.notes}</p>}

    <div className="flex gap-1.5 pt-1">
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
