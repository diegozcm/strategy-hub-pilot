import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGovernanceMeetings } from '@/hooks/useGovernanceMeetings';
import { useGovernanceAgendaItems } from '@/hooks/useGovernanceAgendaItems';
import { useCompanyUsers } from '@/hooks/useCompanyUsers';
import { useAuth } from '@/hooks/useMultiTenant';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Pencil, ClipboardList } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  discussed: 'Discutido',
  deferred: 'Adiado',
};

export const GovernanceAgendaSection: React.FC = () => {
  const { company } = useAuth();
  const { meetings, isLoading: meetingsLoading } = useGovernanceMeetings();
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | undefined>();
  const { users } = useCompanyUsers(company?.id);

  const selectedMeeting = meetings.find(m => m.id === selectedMeetingId);

  if (meetingsLoading) {
    return <div className="flex items-center justify-center py-8 text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <ClipboardList className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Pautas de Reunião</h3>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Selecione uma reunião</CardTitle>
        </CardHeader>
        <CardContent>
          {meetings.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">Nenhuma reunião cadastrada. Crie uma na aba Agenda.</p>
          ) : (
            <Select value={selectedMeetingId} onValueChange={setSelectedMeetingId}>
              <SelectTrigger><SelectValue placeholder="Selecione uma reunião" /></SelectTrigger>
              <SelectContent>
                {meetings.map(m => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.title} - {format(parseISO(m.scheduled_date), 'dd/MM/yyyy', { locale: ptBR })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {selectedMeetingId && (
        <AgendaItemsList meetingId={selectedMeetingId} users={users} />
      )}
    </div>
  );
};

const AgendaItemsList: React.FC<{ meetingId: string; users: any[] }> = ({ meetingId, users }) => {
  const { items, isLoading, addItem, updateItem, deleteItem } = useGovernanceAgendaItems(meetingId);
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Itens da Pauta</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => setEditing({ title: '', description: '', responsible_user_id: '' })}>
              <Plus className="h-4 w-4 mr-1" /> Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing?.id ? 'Editar Item' : 'Novo Item de Pauta'}</DialogTitle>
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
              <Button onClick={handleSave} className="w-full">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">Nenhum item de pauta</p>
        ) : (
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
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
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing({ id: item.id, title: item.title, description: item.description || '', responsible_user_id: item.responsible_user_id || '' }); setDialogOpen(true); }}>
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
      </CardContent>
    </Card>
  );
};
