import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGovernanceMeetings } from '@/hooks/useGovernanceMeetings';
import { useGovernanceAtas } from '@/hooks/useGovernanceAtas';
import { useCompanyUsers } from '@/hooks/useCompanyUsers';
import { useAuth } from '@/hooks/useMultiTenant';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Pencil, CheckCircle, FileText } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const GovernanceAtasSection: React.FC = () => {
  const { company } = useAuth();
  const { meetings } = useGovernanceMeetings();
  const { atas, isLoading, addAta, updateAta, approveAta, deleteAta } = useGovernanceAtas();
  const { users } = useCompanyUsers(company?.id);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<{
    id?: string;
    meeting_id: string;
    content: string;
    decisions: string;
    participants: string[];
  } | null>(null);

  const handleSave = () => {
    if (!editing) return;
    if (editing.id) {
      updateAta.mutate({ id: editing.id, content: editing.content, decisions: editing.decisions, participants: editing.participants });
    } else {
      addAta.mutate({ meeting_id: editing.meeting_id, content: editing.content, decisions: editing.decisions, participants: editing.participants });
    }
    setEditing(null);
    setDialogOpen(false);
  };

  const toggleParticipant = (name: string) => {
    if (!editing) return;
    setEditing(prev => {
      if (!prev) return null;
      const has = prev.participants.includes(name);
      return { ...prev, participants: has ? prev.participants.filter(p => p !== name) : [...prev.participants, name] };
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-8 text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-cofound-blue-light" />
          <h3 className="text-lg font-display font-semibold">ATAs de Reunião</h3>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="cofound" onClick={() => setEditing({ meeting_id: '', content: '', decisions: '', participants: [] })} disabled={meetings.length === 0}>
              <Plus className="h-4 w-4 mr-1" /> Nova ATA
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">{editing?.id ? 'Editar ATA' : 'Nova ATA'}</DialogTitle>
            </DialogHeader>
            {editing && (
              <div className="space-y-4">
                {!editing.id && (
                  <div>
                    <Label>Reunião *</Label>
                    <Select value={editing.meeting_id} onValueChange={(v) => setEditing(prev => prev ? { ...prev, meeting_id: v } : null)}>
                      <SelectTrigger><SelectValue placeholder="Selecione a reunião" /></SelectTrigger>
                      <SelectContent>
                        {meetings.map(m => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.title} - {format(parseISO(m.scheduled_date), 'dd/MM/yyyy', { locale: ptBR })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div>
                  <Label>Conteúdo</Label>
                  <Textarea
                    value={editing.content}
                    onChange={(e) => setEditing(prev => prev ? { ...prev, content: e.target.value } : null)}
                    placeholder="Conteúdo da ata..."
                    className="min-h-[120px]"
                  />
                </div>
                <div>
                  <Label>Decisões</Label>
                  <Textarea
                    value={editing.decisions}
                    onChange={(e) => setEditing(prev => prev ? { ...prev, decisions: e.target.value } : null)}
                    placeholder="Decisões tomadas..."
                  />
                </div>
                <div>
                  <Label>Participantes</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {users.map(u => {
                      const name = `${u.first_name} ${u.last_name}`.trim();
                      const isSelected = editing.participants.includes(name);
                      return (
                        <Badge
                          key={u.user_id}
                          variant={isSelected ? 'default' : 'outline'}
                          className={isSelected ? 'cursor-pointer bg-cofound-green text-cofound-blue-dark hover:bg-cofound-green/80' : 'cursor-pointer'}
                          onClick={() => toggleParticipant(name)}
                        >
                          {name}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
                <Button onClick={handleSave} className="w-full" variant="cofound" disabled={!editing.id && !editing.meeting_id}>
                  Salvar
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {meetings.length === 0 && (
        <Card>
          <CardContent className="py-6">
            <p className="text-muted-foreground text-sm text-center">Crie reuniões na aba Agenda antes de registrar ATAs.</p>
          </CardContent>
        </Card>
      )}

      {atas.length === 0 && meetings.length > 0 ? (
        <Card>
          <CardContent className="py-6">
            <p className="text-muted-foreground text-sm text-center">Nenhuma ATA registrada ainda.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {atas.map(ata => (
            <Card key={ata.id} className="border-l-2 border-l-cofound-blue-light">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base font-display">{(ata as any).governance_meetings?.title || 'Reunião'}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {(ata as any).governance_meetings?.scheduled_date && format(parseISO((ata as any).governance_meetings.scheduled_date), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {ata.approved ? (
                      <Badge className="text-xs bg-cofound-green text-cofound-blue-dark">Aprovada</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">Pendente</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
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
                      {ata.participants.map((p, i) => <Badge key={i} variant="outline" className="text-xs">{p}</Badge>)}
                    </div>
                  </div>
                )}
                <div className="flex gap-1 pt-2">
                  {!ata.approved && (
                    <Button size="sm" variant="cofound" className="h-7 text-xs" onClick={() => approveAta.mutate(ata.id)}>
                      <CheckCircle className="h-3 w-3 mr-1" /> Aprovar
                    </Button>
                  )}
                  <Button size="sm" variant="cofound-ghost" className="h-7 text-xs" onClick={() => {
                    setEditing({ id: ata.id, meeting_id: ata.meeting_id, content: ata.content || '', decisions: ata.decisions || '', participants: ata.participants || [] });
                    setDialogOpen(true);
                  }}>
                    <Pencil className="h-3 w-3 mr-1" /> Editar
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive ml-auto" onClick={() => deleteAta.mutate(ata.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
