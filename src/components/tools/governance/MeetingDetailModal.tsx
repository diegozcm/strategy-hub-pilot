import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GovernanceMeetingForm } from './GovernanceMeetingForm';
import { useGovernanceAgendaItems } from '@/hooks/useGovernanceAgendaItems';
import { useGovernanceAtas } from '@/hooks/useGovernanceAtas';
import { useCompanyUsers } from '@/hooks/useCompanyUsers';
import { useAuth } from '@/hooks/useMultiTenant';
import type { GovernanceMeeting, MeetingFormData } from '@/hooks/useGovernanceMeetings';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  Clock, MapPin, CheckCircle, XCircle, Trash2, Pencil,
  Plus, ClipboardList, FileText, CalendarDays,
} from 'lucide-react';

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

const typeBorderColors: Record<string, string> = {
  RM: 'border-t-blue-500',
  RE: 'border-t-emerald-500',
  Extraordinaria: 'border-t-amber-500',
};

interface Props {
  meeting: GovernanceMeeting;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (data: { id: string; status: string }) => void;
  onDelete: (id: string) => void;
  onUpdate: (data: MeetingFormData & { id: string }) => void;
  isUpdating: boolean;
}

export const MeetingDetailModal: React.FC<Props> = ({
  meeting, open, onOpenChange, onStatusChange, onDelete, onUpdate, isUpdating,
}) => {
  const [activeTab, setActiveTab] = useState('dados');
  const [isEditing, setIsEditing] = useState(false);

  const handleUpdate = (data: MeetingFormData) => {
    onUpdate({ id: meeting.id, ...data });
    setIsEditing(false);
  };

  const handleDelete = () => {
    onDelete(meeting.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        'max-w-3xl max-h-[85vh] overflow-y-auto border-t-4',
        typeBorderColors[meeting.meeting_type] || 'border-t-muted-foreground'
      )}>
        <DialogHeader>
          <div className="flex items-start justify-between gap-3 pr-6">
            <div>
              <DialogTitle className="font-display text-xl">{meeting.title}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {typeLabels[meeting.meeting_type] || meeting.meeting_type}
                {' · '}
                {format(parseISO(meeting.scheduled_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
            <Badge variant={statusLabels[meeting.status]?.variant || 'default'} className="shrink-0">
              {statusLabels[meeting.status]?.label || meeting.status}
            </Badge>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="grid w-full grid-cols-3 bg-muted/50">
            <TabsTrigger value="dados" className="data-[state=active]:bg-cofound-green data-[state=active]:text-cofound-blue-dark font-medium">
              <CalendarDays className="h-4 w-4 mr-1.5" /> Dados
            </TabsTrigger>
            <TabsTrigger value="pautas" className="data-[state=active]:bg-cofound-green data-[state=active]:text-cofound-blue-dark font-medium">
              <ClipboardList className="h-4 w-4 mr-1.5" /> Pautas
            </TabsTrigger>
            <TabsTrigger value="ata" className="data-[state=active]:bg-cofound-green data-[state=active]:text-cofound-blue-dark font-medium">
              <FileText className="h-4 w-4 mr-1.5" /> ATA
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dados" className="mt-4">
            {isEditing ? (
              <div className="space-y-3">
                <GovernanceMeetingForm
                  onSubmit={handleUpdate}
                  isPending={isUpdating}
                  initialData={{
                    title: meeting.title,
                    meeting_type: meeting.meeting_type,
                    scheduled_date: meeting.scheduled_date,
                    scheduled_time: meeting.scheduled_time || undefined,
                    duration_minutes: meeting.duration_minutes || undefined,
                    location: meeting.location || undefined,
                    notes: meeting.notes || undefined,
                  }}
                />
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="w-full">
                  Cancelar edição
                </Button>
              </div>
            ) : (
              <MeetingDetailsView
                meeting={meeting}
                onEdit={() => setIsEditing(true)}
                onStatusChange={onStatusChange}
                onDelete={handleDelete}
              />
            )}
          </TabsContent>

          <TabsContent value="pautas" className="mt-4">
            <MeetingAgendaTab meetingId={meeting.id} />
          </TabsContent>

          <TabsContent value="ata" className="mt-4">
            <MeetingAtaTab meetingId={meeting.id} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

// --- Dados Tab ---
const MeetingDetailsView: React.FC<{
  meeting: GovernanceMeeting;
  onEdit: () => void;
  onStatusChange: (data: { id: string; status: string }) => void;
  onDelete: () => void;
}> = ({ meeting, onEdit, onStatusChange, onDelete }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <InfoField label="Horário" value={meeting.scheduled_time?.slice(0, 5) || '—'} icon={<Clock className="h-4 w-4 text-cofound-blue-light" />} />
      <InfoField label="Duração" value={meeting.duration_minutes ? `${meeting.duration_minutes} min` : '—'} />
      <InfoField label="Local" value={meeting.location || '—'} icon={<MapPin className="h-4 w-4 text-cofound-blue-light" />} />
      <InfoField label="Tipo" value={typeLabels[meeting.meeting_type] || meeting.meeting_type} />
    </div>

    {meeting.notes && (
      <div className="p-3 rounded-lg bg-muted/40 border">
        <p className="text-xs font-medium text-muted-foreground mb-1">Observações</p>
        <p className="text-sm whitespace-pre-wrap">{meeting.notes}</p>
      </div>
    )}

    <div className="flex flex-wrap gap-2 pt-2 border-t">
      <Button size="sm" variant="cofound-ghost" onClick={onEdit}>
        <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
      </Button>
      {meeting.status === 'scheduled' && (
        <>
          <Button size="sm" variant="cofound" onClick={() => onStatusChange({ id: meeting.id, status: 'completed' })}>
            <CheckCircle className="h-3.5 w-3.5 mr-1" /> Concluir
          </Button>
          <Button size="sm" variant="outline" onClick={() => onStatusChange({ id: meeting.id, status: 'cancelled' })}>
            <XCircle className="h-3.5 w-3.5 mr-1" /> Cancelar
          </Button>
        </>
      )}
      <Button size="sm" variant="ghost" className="text-destructive ml-auto" onClick={onDelete}>
        <Trash2 className="h-3.5 w-3.5 mr-1" /> Excluir
      </Button>
    </div>
  </div>
);

const InfoField: React.FC<{ label: string; value: string; icon?: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="flex items-start gap-2">
    {icon && <span className="mt-0.5">{icon}</span>}
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  </div>
);

// --- Pautas Tab ---
const MeetingAgendaTab: React.FC<{ meetingId: string }> = ({ meetingId }) => {
  const { company } = useAuth();
  const { items, isLoading, addItem, updateItem, deleteItem } = useGovernanceAgendaItems(meetingId);
  const { users } = useCompanyUsers(company?.id);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<{ id?: string; title: string; description: string; responsible_user_id: string } | null>(null);

  const handleSave = () => {
    if (!editing?.title.trim()) return;
    if (editing.id) {
      updateItem.mutate({ id: editing.id, title: editing.title, description: editing.description, responsible_user_id: editing.responsible_user_id || undefined });
    } else {
      addItem.mutate({ title: editing.title, description: editing.description, responsible_user_id: editing.responsible_user_id || undefined });
    }
    setEditing(null);
    setDialogOpen(false);
  };

  const getUserName = (userId: string | null) => {
    if (!userId) return null;
    const u = users.find(u => u.user_id === userId);
    return u ? `${u.first_name} ${u.last_name}`.trim() : null;
  };

  if (isLoading) return <div className="text-muted-foreground text-sm text-center py-4">Carregando pautas...</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-display font-semibold">Itens da Pauta ({items.length})</p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <Button size="sm" variant="cofound" onClick={() => { setEditing({ title: '', description: '', responsible_user_id: '' }); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Adicionar
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">{editing?.id ? 'Editar Item' : 'Novo Item de Pauta'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Título *</Label>
                <Input
                  value={editing?.title || ''}
                  onChange={(e) => setEditing(prev => prev ? { ...prev, title: e.target.value } : null)}
                  placeholder="Assunto da pauta"
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={editing?.description || ''}
                  onChange={(e) => setEditing(prev => prev ? { ...prev, description: e.target.value } : null)}
                  placeholder="Detalhamento"
                />
              </div>
              <div>
                <Label>Responsável</Label>
                <Select
                  value={editing?.responsible_user_id || 'none'}
                  onValueChange={(v) => setEditing(prev => prev ? { ...prev, responsible_user_id: v === 'none' ? '' : v } : null)}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {users.map(u => (
                      <SelectItem key={u.user_id} value={u.user_id}>{u.first_name} {u.last_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSave} className="w-full" variant="cofound">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground text-sm">
          <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-40" />
          Nenhum item de pauta
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30 border-l-2 border-l-cofound-green">
              <span className="text-muted-foreground font-medium text-sm mt-0.5">{idx + 1}.</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{item.title}</p>
                {item.description && <p className="text-muted-foreground text-xs mt-1">{item.description}</p>}
                <div className="flex gap-2 mt-1">
                  {getUserName(item.responsible_user_id) && (
                    <Badge variant="outline" className="text-xs">{getUserName(item.responsible_user_id)}</Badge>
                  )}
                  <Select
                    value={item.status}
                    onValueChange={(status) => updateItem.mutate({ id: item.id, status })}
                  >
                    <SelectTrigger className="h-6 w-auto text-xs border-none bg-transparent p-0 px-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="discussed">Discutido</SelectItem>
                      <SelectItem value="deferred">Adiado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="cofound-ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing({ id: item.id, title: item.title, description: item.description || '', responsible_user_id: item.responsible_user_id || '' }); setDialogOpen(true); }}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteItem.mutate(item.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- ATA Tab ---
const MeetingAtaTab: React.FC<{ meetingId: string }> = ({ meetingId }) => {
  const { company } = useAuth();
  const { atas, isLoading, addAta, updateAta, approveAta, deleteAta } = useGovernanceAtas(meetingId);
  const { users } = useCompanyUsers(company?.id);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ content: '', decisions: '', participants: [] as string[] });

  const toggleParticipant = (name: string) => {
    setForm(prev => ({
      ...prev,
      participants: prev.participants.includes(name)
        ? prev.participants.filter(p => p !== name)
        : [...prev.participants, name],
    }));
  };

  const handleSave = () => {
    if (editingId) {
      updateAta.mutate({ id: editingId, ...form });
      setEditingId(null);
    } else {
      addAta.mutate({ meeting_id: meetingId, ...form });
      setIsCreating(false);
    }
    setForm({ content: '', decisions: '', participants: [] });
  };

  const startEdit = (ata: any) => {
    setForm({ content: ata.content || '', decisions: ata.decisions || '', participants: ata.participants || [] });
    setEditingId(ata.id);
    setIsCreating(false);
  };

  if (isLoading) return <div className="text-muted-foreground text-sm text-center py-4">Carregando...</div>;

  const showForm = isCreating || editingId;

  return (
    <div className="space-y-4">
      {atas.length === 0 && !isCreating && (
        <div className="text-center py-6">
          <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-40" />
          <p className="text-muted-foreground text-sm mb-3">Nenhuma ATA registrada</p>
          <Button variant="cofound" size="sm" onClick={() => { setIsCreating(true); setForm({ content: '', decisions: '', participants: [] }); }}>
            <Plus className="h-4 w-4 mr-1" /> Criar ATA
          </Button>
        </div>
      )}

      {atas.length > 0 && !showForm && (
        <div className="space-y-3">
          {atas.map(ata => (
            <div key={ata.id} className="p-4 rounded-lg border border-l-2 border-l-cofound-blue-light bg-card space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Criada em {format(parseISO(ata.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
                {ata.approved ? (
                  <Badge className="text-xs bg-cofound-green text-cofound-blue-dark">Aprovada</Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">Pendente</Badge>
                )}
              </div>
              {ata.content && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Conteúdo</p>
                  <p className="text-sm whitespace-pre-wrap">{ata.content}</p>
                </div>
              )}
              {ata.decisions && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Decisões</p>
                  <p className="text-sm whitespace-pre-wrap">{ata.decisions}</p>
                </div>
              )}
              {ata.participants?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Participantes</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {ata.participants.map((p: string, i: number) => <Badge key={i} variant="outline" className="text-xs">{p}</Badge>)}
                  </div>
                </div>
              )}
              <div className="flex gap-1 pt-2">
                {!ata.approved && (
                  <Button size="sm" variant="cofound" className="h-7 text-xs" onClick={() => approveAta.mutate(ata.id)}>
                    <CheckCircle className="h-3 w-3 mr-1" /> Aprovar
                  </Button>
                )}
                <Button size="sm" variant="cofound-ghost" className="h-7 text-xs" onClick={() => startEdit(ata)}>
                  <Pencil className="h-3 w-3 mr-1" /> Editar
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive ml-auto" onClick={() => deleteAta.mutate(ata.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
          <Button variant="cofound" size="sm" onClick={() => { setIsCreating(true); setForm({ content: '', decisions: '', participants: [] }); }}>
            <Plus className="h-4 w-4 mr-1" /> Nova ATA
          </Button>
        </div>
      )}

      {showForm && (
        <div className="space-y-4 p-4 rounded-lg border bg-muted/20">
          <p className="font-display font-semibold text-sm">{editingId ? 'Editar ATA' : 'Nova ATA'}</p>
          <div>
            <Label>Conteúdo</Label>
            <Textarea
              value={form.content}
              onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Conteúdo da ata..."
              className="min-h-[100px]"
            />
          </div>
          <div>
            <Label>Decisões</Label>
            <Textarea
              value={form.decisions}
              onChange={(e) => setForm(prev => ({ ...prev, decisions: e.target.value }))}
              placeholder="Decisões tomadas..."
            />
          </div>
          <div>
            <Label>Participantes</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {users.map(u => {
                const name = `${u.first_name} ${u.last_name}`.trim();
                const isSelected = form.participants.includes(name);
                return (
                  <Badge
                    key={u.user_id}
                    variant={isSelected ? 'default' : 'outline'}
                    className={cn(
                      'cursor-pointer',
                      isSelected && 'bg-cofound-green text-cofound-blue-dark hover:bg-cofound-green/80'
                    )}
                    onClick={() => toggleParticipant(name)}
                  >
                    {name}
                  </Badge>
                );
              })}
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} variant="cofound">Salvar</Button>
            <Button variant="ghost" onClick={() => { setIsCreating(false); setEditingId(null); setForm({ content: '', decisions: '', participants: [] }); }}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
