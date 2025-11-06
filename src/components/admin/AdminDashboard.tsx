import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Building, Users, Shield, Activity, TrendingUp, AlertTriangle } from 'lucide-react';
import { AdminDashboardSkeleton } from './AdminDashboardSkeleton';

interface AdminStats {
  totalCompanies: number;
  totalUsers: number;
  pendingUsers: number;
  activeUsers: number;
  systemAdmins: number;
}

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats>({
    totalCompanies: 0,
    totalUsers: 0,
    pendingUsers: 0,
    activeUsers: 0,
    systemAdmins: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentLogins, setRecentLogins] = useState<any[]>([]);

  useEffect(() => {
    fetchAdminStats();
    fetchRecentLogins();
  }, []);

  const fetchAdminStats = async () => {
    try {
      setLoading(true);

      // Executar todas as queries em paralelo para melhor performance
      const [
        { count: companiesCount },
        { count: usersCount },
        { count: pendingCount },
        { count: activeCount },
        { count: adminCount }
      ] = await Promise.all([
        supabase.from('companies').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin')
      ]);

      setStats({
        totalCompanies: companiesCount || 0,
        totalUsers: usersCount || 0,
        pendingUsers: pendingCount || 0,
        activeUsers: activeCount || 0,
        systemAdmins: adminCount || 0,
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentLogins = async () => {
    try {
      const { data, error } = await supabase
        .from('user_login_logs')
        .select(`
          id,
          user_id,
          company_id,
          login_time,
          profiles!user_login_logs_user_id_fkey (
            first_name,
            last_name,
            email,
            role
          ),
          companies (
            name
          )
        `)
        .order('login_time', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching recent logins:', error);
        return;
      }

      setRecentLogins(data || []);
    } catch (error) {
      console.error('Error fetching recent logins:', error);
    }
  };

  if (loading) {
    return <AdminDashboardSkeleton />;
  }

  const statsCards = [
    {
      title: 'Total de Empresas',
      value: stats.totalCompanies,
      icon: Building,
      description: 'Empresas cadastradas',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Total de Usuários',
      value: stats.totalUsers,
      icon: Users,
      description: 'Usuários registrados',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Usuários Pendentes',
      value: stats.pendingUsers,
      icon: AlertTriangle,
      description: 'Aguardando aprovação',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    {
      title: 'Usuários Ativos',
      value: stats.activeUsers,
      icon: TrendingUp,
      description: 'Usuários aprovados',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      title: 'Administradores',
      value: stats.systemAdmins,
      icon: Shield,
      description: 'Admins do sistema',
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard Administrativo</h1>
        <p className="text-muted-foreground">Visão geral do sistema e estatísticas</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statsCards.map((stat, index) => (
          <Card key={index} className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Logins */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Últimos Logins
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Últimos 10 logins de usuários no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentLogins.length > 0 ? (
              recentLogins.map((login) => (
                <div key={login.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center flex-1">
                    <div className="bg-muted p-2 rounded-full mr-3">
                      <Users className="h-4 w-4 text-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {login.profiles?.first_name} {login.profiles?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">{login.profiles?.email}</p>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm font-medium text-foreground">
                      {login.companies?.name || 'Sem empresa'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(login.login_time).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                      login.profiles?.role === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                      login.profiles?.role === 'manager' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                    }`}>
                      {login.profiles?.role === 'admin' ? 'Admin' :
                       login.profiles?.role === 'manager' ? 'Gestor' : 'Membro'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">Nenhum login registrado</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};