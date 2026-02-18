import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { MeetingFormData } from '@/hooks/useGovernanceMeetings';
import { format } from 'date-fns';

interface GovernanceMeetingFormProps {
  onSubmit: (data: MeetingFormData) => void;
  isPending: boolean;
  initialData?: Partial<MeetingFormData>;
}

export const GovernanceMeetingForm: React.FC<GovernanceMeetingFormProps> = ({ onSubmit, isPending, initialData }) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [meetingType, setMeetingType] = useState(initialData?.meeting_type || 'RM');
  const [scheduledDate, setScheduledDate] = useState(initialData?.scheduled_date || format(new Date(), 'yyyy-MM-dd'));
  const [scheduledTime, setScheduledTime] = useState(initialData?.scheduled_time || '');
  const [durationMinutes, setDurationMinutes] = useState(initialData?.duration_minutes?.toString() || '60');
  const [location, setLocation] = useState(initialData?.location || '');
  const [notes, setNotes] = useState(initialData?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !scheduledDate) return;
    onSubmit({
      title: title.trim(),
      meeting_type: meetingType,
      scheduled_date: scheduledDate,
      scheduled_time: scheduledTime || undefined,
      duration_minutes: parseInt(durationMinutes) || 60,
      location: location || undefined,
      notes: notes || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label className="font-display">Título *</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: RM Semanal" required className="focus-visible:ring-cofound-blue-light" />
      </div>
      <div>
        <Label className="font-display">Tipo</Label>
        <Select value={meetingType} onValueChange={setMeetingType}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="RM">Reunião de Monitoramento (RM)</SelectItem>
            <SelectItem value="RE">Reunião de Execução (RE)</SelectItem>
            <SelectItem value="Extraordinaria">Extraordinária</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="font-display">Data *</Label>
          <Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} required className="focus-visible:ring-cofound-blue-light" />
        </div>
        <div>
          <Label className="font-display">Horário</Label>
          <Input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} className="focus-visible:ring-cofound-blue-light" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="font-display">Duração (min)</Label>
          <Input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} className="focus-visible:ring-cofound-blue-light" />
        </div>
        <div>
          <Label className="font-display">Local</Label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Sala ou link" className="focus-visible:ring-cofound-blue-light" />
        </div>
      </div>
      <div>
        <Label className="font-display">Observações</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observações..." className="focus-visible:ring-cofound-blue-light" />
      </div>
      <Button type="submit" disabled={isPending} className="w-full" variant="cofound">
        {isPending ? 'Salvando...' : 'Salvar'}
      </Button>
    </form>
  );
};
