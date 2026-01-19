
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminPageContainer } from '../../components/AdminPageContainer';
import { StatCard } from '../../components/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  LogIn, 
  RefreshCw, 
  Download,
  Search,
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Filter
} from 'lucide-react';
import { format, subDays, subWeeks, isAfter, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LoginLog {
  id: string;
  user_id: string;
  login_time: string;
  ip_address: string | null;
  user_agent: string | null;
  login_method: string | null;
  success: boolean;
  created_at: string;
  user?: {
    full_name: string;
    avatar_url: string | null;
    company_name?: string;
  };
}

export default function AccessLogsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data: loginLogs, isLoading, refetch } = useQuery({
    queryKey: ['access-logs', page],
    queryFn: async () => {
      const { data: logs, error: logsError } = await supabase
        .from('user_login_logs')
        .select('*')
        .order('login_time', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);
      
      if (logsError) throw logsError;

      const userIds = [...new Set(logs?.map(log => log.user_id) || [])];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select(`
          user_id,
          full_name,
          avatar_url,
          user_company_relations (
            companies (name)
          )
        `)
        .in('user_id', userIds);
      
      const profilesMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const enrichedLogs: LoginLog[] = (logs || []).map(log => {
        const profile = profilesMap.get(log.user_id);
        const companyName = profile?.user_company_relations?.[0]?.companies?.name;
        
        return {
          ...log,
          user: profile ? {
            full_name: profile.full_name || 'Usuário',
            avatar_url: profile.avatar_url,
            company_name: companyName
          } : undefined
        };
      });

      return enrichedLogs;
    }
  });

  const { data: stats } = useQuery({
    queryKey: ['access-logs-stats'],
    queryFn: async () => {
      const today = startOfDay(new Date());
      const weekAgo = subWeeks(new Date(), 1);

      const { count: totalCount } = await supabase
        .from('user_login_logs')
        .select('*', { count: 'exact', head: true });

      const { count: todayCount } = await supabase
        .from('user_login_logs')
        .select('*', { count: 'exact', head: true })
        .gte('login_time', today.toISOString());

      const { count: weekCount } = await supabase
        .from('user_login_logs')
        .select('*', { count: 'exact', head: true })
        .gte('login_time', weekAgo.toISOString());

      const { data: uniqueUsers } = await supabase
        .from('user_login_logs')
        .select('user_id')
        .gte('login_time', weekAgo.toISOString());
      
      const uniqueCount = new Set(uniqueUsers?.map(u => u.user_id)).size;

      return {
        total: totalCount || 0,
        today: todayCount || 0,
        week: weekCount || 0,
        uniqueUsers: uniqueCount
      };
    }
  });

  const filteredLogs = React.useMemo(() => {
    let filtered = loginLogs || [];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        log.user?.full_name?.toLowerCase().includes(term) ||
        log.user?.company_name?.toLowerCase().includes(term) ||
        log.ip_address?.includes(term)
      );
    }

    if (periodFilter !== 'all') {
      const now = new Date();
      let cutoff: Date;
      
      switch (periodFilter) {
        case 'today':
          cutoff = startOfDay(now);
          break;
        case 'week':
          cutoff = subWeeks(now, 1);
          break;
        case 'month':
          cutoff = subDays(now, 30);
          break;
        default:
          cutoff = new Date(0);
      }
      
      filtered = filtered.filter(log => isAfter(new Date(log.login_time), cutoff));
    }

    return filtered;
  }, [loginLogs, searchTerm, periodFilter]);

  const maskIP = (ip: string | null) => {
    if (!ip) return 'N/A';
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.x.x`;
    }
    return ip.substring(0, 8) + '...';
  };

  const handleExport = () => {
    if (!filteredLogs.length) {
      toast.error('Nenhum log para exportar');
      return;
    }

    const csvContent = [
      ['Data/Hora', 'Usuário', 'Empresa', 'IP', 'Sucesso'].join(','),
      ...filteredLogs.map(log => [
        format(new Date(log.login_time), "dd/MM/yyyy HH:mm:ss"),
        log.user?.full_name || 'Desconhecido',
        log.user?.company_name || 'N/A',
        maskIP(log.ip_address),
        log.success ? 'Sim' : 'Não'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `logs-acesso-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    
    toast.success('Logs exportados com sucesso');
  };

  if (isLoading) {
    return (
      <AdminPageContainer
        title="Logs de Acesso"
        description="Carregando logs..."
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      </AdminPageContainer>
    );
  }

  return (
    <AdminPageContainer
      title="Logs de Acesso"
      description="Histórico de logins e acessos ao sistema"
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Total de Acessos"
            value={(stats?.total || 0).toLocaleString()}
            icon={<LogIn className="h-5 w-5" />}
          />
          <StatCard
            title="Hoje"
            value={(stats?.today || 0).toString()}
            icon={<Calendar className="h-5 w-5" />}
            trend={stats?.today && stats.today > 0 ? 'up' : 'neutral'}
            trendValue="Ativos"
          />
          <StatCard
            title="Esta Semana"
            value={(stats?.week || 0).toString()}
            icon={<Clock className="h-5 w-5" />}
          />
          <StatCard
            title="Usuários Únicos"
            value={(stats?.uniqueUsers || 0).toString()}
            icon={<Users className="h-5 w-5" />}
          />
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por usuário, empresa ou IP..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Última semana</SelectItem>
                  <SelectItem value="month">Último mês</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              Histórico de Logins
              <Badge variant="secondary">{filteredLogs.length} registros</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nenhum log encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(log.login_time), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={log.user?.avatar_url || undefined} />
                              <AvatarFallback className="text-xs">
                                {log.user?.full_name?.substring(0, 2).toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">
                              {log.user?.full_name || 'Usuário'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {log.user?.company_name || (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {maskIP(log.ip_address)}
                        </TableCell>
                        <TableCell className="text-center">
                          {log.success ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600 mx-auto" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>

            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Página {page}
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Anterior
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => p + 1)}
                  disabled={filteredLogs.length < pageSize}
                >
                  Próxima
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminPageContainer>
  );
}
