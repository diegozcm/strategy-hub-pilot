import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Eye, Code, Variable, Copy, Check } from 'lucide-react';
import DOMPurify from 'dompurify';

interface EmailTemplate {
  id: string;
  template_key: string;
  template_name: string;
  subject: string;
  body_html: string;
  available_variables: string[] | null;
  description: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

const SAMPLE_DATA: Record<string, string> = {
  userName: 'João Silva',
  email: 'joao@empresa.com',
  temporaryPassword: 'Temp@2026!',
  companyName: 'Empresa Exemplo LTDA',
  loginUrl: 'https://app.strategyhub.com/login',
  resetUrl: 'https://app.strategyhub.com/reset',
  expirationTime: '24 horas',
};

interface EmailTemplateEditorProps {
  templateKey: string;
  title: string;
}

export default function EmailTemplateEditor({ templateKey, title }: EmailTemplateEditorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [copiedVar, setCopiedVar] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('editor');

  const { data: template, isLoading } = useQuery({
    queryKey: ['email-template', templateKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('template_key', templateKey)
        .maybeSingle();
      if (error) throw error;
      return data as EmailTemplate | null;
    },
  });

  useEffect(() => {
    if (template) {
      setSubject(template.subject);
      setBodyHtml(template.body_html);
      setIsActive(template.is_active ?? true);
    }
  }, [template]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!template) return;
      const { error } = await supabase
        .from('email_templates')
        .update({
          subject,
          body_html: bodyHtml,
          is_active: isActive,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', template.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-template', templateKey] });
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast({ title: 'Template salvo', description: 'As alterações foram salvas com sucesso.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    },
  });

  const insertVariable = useCallback((variable: string) => {
    const tag = `{{${variable}}}`;
    if (textareaRef.current) {
      const ta = textareaRef.current;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newValue = bodyHtml.substring(0, start) + tag + bodyHtml.substring(end);
      setBodyHtml(newValue);
      setTimeout(() => {
        ta.focus();
        ta.selectionStart = ta.selectionEnd = start + tag.length;
      }, 0);
    } else {
      setBodyHtml(prev => prev + tag);
    }
  }, [bodyHtml]);

  const copyVariable = (variable: string) => {
    navigator.clipboard.writeText(`{{${variable}}}`);
    setCopiedVar(variable);
    setTimeout(() => setCopiedVar(null), 1500);
  };

  const renderPreview = () => {
    let html = bodyHtml;
    Object.entries(SAMPLE_DATA).forEach(([key, value]) => {
      html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    });
    return DOMPurify.sanitize(html);
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex-1 p-6">
        <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="mt-4 text-muted-foreground">
            Template <code className="bg-muted px-1 rounded">{templateKey}</code> não encontrado no banco de dados.
          </p>
        </div>
      </div>
    );
  }

  const variables = template.available_variables ?? [];

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Templates de Email</p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          {template.description && (
            <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="active-switch" className="text-sm">Ativo</Label>
            <Switch id="active-switch" checked={isActive} onCheckedChange={setIsActive} />
          </div>
          <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>

      {/* Subject */}
      <div className="space-y-2">
        <Label htmlFor="subject">Assunto do Email</Label>
        <Input id="subject" value={subject} onChange={e => setSubject(e.target.value)} />
      </div>

      {/* Editor + Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Variables Panel */}
        <div className="lg:col-span-1 rounded-xl border border-border bg-card p-4 shadow-sm h-fit">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
            <Variable className="h-4 w-4" /> Variáveis Disponíveis
          </h3>
          <div className="space-y-2">
            {variables.map(v => (
              <div key={v} className="flex items-center justify-between gap-1">
                <button
                  onClick={() => insertVariable(v)}
                  className="text-xs font-mono bg-muted hover:bg-muted/80 text-foreground px-2 py-1.5 rounded cursor-pointer transition-colors flex-1 text-left"
                  title="Clique para inserir no editor"
                >
                  {`{{${v}}}`}
                </button>
                <button
                  onClick={() => copyVariable(v)}
                  className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground"
                  title="Copiar"
                >
                  {copiedVar === v ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Clique em uma variável para inseri-la na posição do cursor.
          </p>
        </div>

        {/* Editor / Preview Tabs */}
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="editor" className="gap-1.5">
                <Code className="h-4 w-4" /> Editor HTML
              </TabsTrigger>
              <TabsTrigger value="preview" className="gap-1.5">
                <Eye className="h-4 w-4" /> Preview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="editor" className="mt-3">
              <Textarea
                ref={textareaRef}
                value={bodyHtml}
                onChange={e => setBodyHtml(e.target.value)}
                className="min-h-[500px] font-mono text-sm leading-relaxed"
                placeholder="Cole o HTML do seu template aqui..."
              />
            </TabsContent>

            <TabsContent value="preview" className="mt-3">
              <div className="rounded-lg border border-border bg-white overflow-hidden">
                <div className="bg-muted px-4 py-2 border-b border-border flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">Preview com dados de exemplo</Badge>
                </div>
                <iframe
                  srcDoc={renderPreview()}
                  className="w-full min-h-[500px] border-0"
                  sandbox="allow-same-origin"
                  title="Preview do email"
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
