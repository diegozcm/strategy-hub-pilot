import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Building, Users, Shield, Activity, TrendingUp, AlertTriangle } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

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
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    fetchAdminStats();
    fetchRecentActivity();
  }, []);

  const fetchAdminStats = async () => {
    try {
      setLoading(true);

      // Total companies
      const { count: companiesCount } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true });

      // Total users
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Pending users
      const { count: pendingCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Active users
      const { count: activeCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // System admins
      const { count: adminCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'admin');

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

  const fetchRecentActivity = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('first_name, last_name, email, created_at, status, role')
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentActivity(data || []);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
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
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard Administrativo</h1>
        <p className="text-slate-300">Visão geral do sistema e estatísticas</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statsCards.map((stat, index) => (
          <Card key={index} className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-300">{stat.title}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-slate-400">{stat.description}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Atividade Recente
          </CardTitle>
          <CardDescription className="text-slate-300">
            Últimos usuários registrados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                  <div className="flex items-center">
                    <div className="bg-slate-600 p-2 rounded-full mr-3">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {activity.first_name} {activity.last_name}
                      </p>
                      <p className="text-xs text-slate-400">{activity.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      activity.status === 'active' ? 'bg-green-100 text-green-800' :
                      activity.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {activity.status === 'active' ? 'Ativo' :
                       activity.status === 'pending' ? 'Pendente' : 'Inativo'}
                    </span>
                    <p className="text-xs text-slate-400 mt-1">
                      {activity.role === 'admin' ? 'Admin' :
                       activity.role === 'manager' ? 'Gestor' : 'Membro'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-center py-4">Nenhuma atividade recente</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};