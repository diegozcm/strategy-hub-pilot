import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye } from 'lucide-react';
import { useState, useMemo } from 'react';
import DOMPurify from 'dompurify';

const DEFAULT_SAMPLE: Record<string, string> = {
  userName: 'João Silva',
  email: 'joao@empresa.com',
  temporaryPassword: 'Temp@2026!',
  companyName: 'Empresa Exemplo LTDA',
  loginUrl: 'https://app.strategyhub.com/login',
  resetUrl: 'https://app.strategyhub.com/reset',
  expirationTime: '24 horas',
};

export default function PreviewEmailPage() {
  const [searchParams] = useSearchParams();
  const templateKey = searchParams.get('key') || 'welcome_credentials';
  const [sampleData, setSampleData] = useState<Record<string, string>>(DEFAULT_SAMPLE);

  const { data: template, isLoading } = useQuery({
    queryKey: ['email-template-preview', templateKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('template_key', templateKey)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  const renderedHtml = useMemo(() => {
    if (!template) return '';
    let html = template.body_html || '';
    Object.entries(sampleData).forEach(([key, value]) => {
      html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    });
    return DOMPurify.sanitize(html);
  }, [template, sampleData]);

  if (isLoading) {
    return (
      <div className="flex-1 p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex-1 p-6">
        <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-foreground">Preview</h1>
          <p className="mt-4 text-muted-foreground">
            Template <code className="bg-muted px-1 rounded">{templateKey}</code> não encontrado.
          </p>
        </div>
      </div>
    );
  }

  const variables = (template.available_variables as string[]) || [];

  return (
    <div className="flex-1 p-6 space-y-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Templates de Email › Preview</p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Eye className="h-6 w-6" /> {template.template_name}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sample data editor */}
        <div className="lg:col-span-1 rounded-xl border border-border bg-card p-4 shadow-sm space-y-4 h-fit">
          <h3 className="text-sm font-semibold text-foreground">Dados de Exemplo</h3>
          {variables.map(v => (
            <div key={v} className="space-y-1">
              <Label className="text-xs font-mono">{v}</Label>
              <Input
                value={sampleData[v] || ''}
                onChange={e => setSampleData(prev => ({ ...prev, [v]: e.target.value }))}
                className="text-sm"
              />
            </div>
          ))}
          {variables.length === 0 && (
            <p className="text-xs text-muted-foreground">Sem variáveis configuradas.</p>
          )}
        </div>

        {/* Preview */}
        <div className="lg:col-span-3 rounded-xl border border-border bg-white overflow-hidden shadow-sm">
          <div className="bg-muted px-4 py-2 border-b border-border flex items-center gap-2">
            <Badge variant="outline" className="text-xs">Assunto: {template.subject}</Badge>
            <Badge variant={template.is_active ? 'default' : 'secondary'} className="text-xs">
              {template.is_active ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
          <iframe
            srcDoc={renderedHtml}
            className="w-full min-h-[600px] border-0"
            sandbox="allow-same-origin"
            title="Preview do email"
          />
        </div>
      </div>
    </div>
  );
}
