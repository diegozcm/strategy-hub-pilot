import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Save, ArrowLeft, Plus, X } from 'lucide-react';

export default function NewTemplatePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [templateKey, setTemplateKey] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [variables, setVariables] = useState<string[]>([]);
  const [newVar, setNewVar] = useState('');

  const addVariable = () => {
    const v = newVar.trim();
    if (v && !variables.includes(v)) {
      setVariables(prev => [...prev, v]);
      setNewVar('');
    }
  };

  const removeVariable = (v: string) => {
    setVariables(prev => prev.filter(x => x !== v));
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('email_templates')
        .insert({
          template_key: templateKey,
          template_name: templateName,
          subject,
          body_html: bodyHtml,
          description: description || null,
          is_active: isActive,
          available_variables: variables.length > 0 ? variables : null,
        } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast({ title: 'Template criado', description: 'O novo template foi salvo com sucesso.' });
      navigate('/app/admin-v2/emails');
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao criar template', description: error.message, variant: 'destructive' });
    },
  });

  const canSave = templateKey.trim() && templateName.trim() && subject.trim() && bodyHtml.trim();

  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/app/admin-v2/emails')} className="mb-2 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Novo Template de Email</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="active">Ativo</Label>
            <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
          </div>
          <Button onClick={() => createMutation.mutate()} disabled={!canSave || createMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {createMutation.isPending ? 'Salvando...' : 'Criar Template'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
            <h2 className="font-semibold text-foreground">Informações Básicas</h2>
            <div className="space-y-2">
              <Label htmlFor="key">Chave do Template</Label>
              <Input id="key" value={templateKey} onChange={e => setTemplateKey(e.target.value)} placeholder="ex: welcome_credentials" />
              <p className="text-xs text-muted-foreground">Identificador único usado no código (snake_case).</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder="ex: Credenciais de Boas-vindas" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subj">Assunto do Email</Label>
              <Input id="subj" value={subject} onChange={e => setSubject(e.target.value)} placeholder="ex: Bem-vindo ao Strategy HUB" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Descrição (opcional)</Label>
              <Input id="desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="Descrição breve do template" />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
            <h2 className="font-semibold text-foreground">Variáveis Disponíveis</h2>
            <div className="flex gap-2">
              <Input
                value={newVar}
                onChange={e => setNewVar(e.target.value)}
                placeholder="Nome da variável"
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addVariable())}
              />
              <Button variant="outline" size="icon" onClick={addVariable}><Plus className="h-4 w-4" /></Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {variables.map(v => (
                <Badge key={v} variant="secondary" className="gap-1 font-mono text-xs">
                  {`{{${v}}}`}
                  <button onClick={() => removeVariable(v)}><X className="h-3 w-3" /></button>
                </Badge>
              ))}
              {variables.length === 0 && (
                <p className="text-xs text-muted-foreground">Nenhuma variável adicionada ainda.</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Corpo do Email (HTML)</Label>
          <Textarea
            value={bodyHtml}
            onChange={e => setBodyHtml(e.target.value)}
            className="min-h-[500px] font-mono text-sm leading-relaxed"
            placeholder="Cole o HTML do seu template aqui..."
          />
        </div>
      </div>
    </div>
  );
}
