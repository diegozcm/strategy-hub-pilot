import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Mail, Plus, Pencil, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EmailTemplate {
  id: string;
  template_key: string;
  template_name: string;
  subject: string;
  description: string | null;
  is_active: boolean | null;
  updated_at: string | null;
  available_variables: string[] | null;
}

const TEMPLATE_ROUTES: Record<string, string> = {
  welcome_credentials: '/app/admin-v2/emails/welcome',
  password_reset: '/app/admin-v2/emails/password-recovery',
};

export default function AllEmailTemplatesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ['email-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_templates')
        .select('id, template_key, template_name, subject, description, is_active, updated_at, available_variables')
        .order('template_name');
      if (error) throw error;
      return data as EmailTemplate[];
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('email_templates')
        .update({ is_active, updated_at: new Date().toISOString() } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast({ title: 'Status atualizado' });
    },
  });

  const getEditRoute = (key: string) => TEMPLATE_ROUTES[key] || `/app/admin-v2/emails/preview?key=${key}`;

  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Templates de Email</p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Mail className="h-6 w-6" /> Todos os Templates
          </h1>
        </div>
        <Button onClick={() => navigate('/app/admin-v2/emails/new')}>
          <Plus className="h-4 w-4 mr-2" /> Novo Template
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : !templates?.length ? (
          <div className="p-8 text-center text-muted-foreground">
            Nenhum template encontrado.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Chave</TableHead>
                <TableHead>Assunto</TableHead>
                <TableHead>Variáveis</TableHead>
                <TableHead>Atualizado</TableHead>
                <TableHead className="text-center">Ativo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map(t => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.template_name}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{t.template_key}</code>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                    {t.subject}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {t.available_variables?.length ?? 0} variáveis
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {t.updated_at ? format(new Date(t.updated_at), "dd/MM/yy HH:mm", { locale: ptBR }) : '—'}
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={t.is_active ?? false}
                      onCheckedChange={val => toggleMutation.mutate({ id: t.id, is_active: val })}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => navigate(getEditRoute(t.template_key))}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/app/admin-v2/emails/preview?key=${t.template_key}`)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
