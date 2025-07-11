
import React from 'react';
import { 
  Target, 
  Briefcase, 
  TrendingUp, 
  Users, 
  Calendar,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

const stats = [
  {
    title: 'Objetivos Ativos',
    value: '12',
    change: '+2',
    changeType: 'positive',
    icon: Target,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  {
    title: 'Projetos em Andamento',
    value: '8',
    change: '+1',
    changeType: 'positive',
    icon: Briefcase,
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  {
    title: 'KRs no Prazo',
    value: '85%',
    change: '-5%',
    changeType: 'negative',
    icon: TrendingUp,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50'
  },
  {
    title: 'Equipe Ativa',
    value: '24',
    change: '+3',
    changeType: 'positive',
    icon: Users,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  },
];

const recentObjectives = [
  {
    title: 'Aumentar satisfação do cliente',
    progress: 75,
    status: 'on-track',
    owner: 'Maria Silva',
    dueDate: '2024-03-30'
  },
  {
    title: 'Reduzir custos operacionais',
    progress: 45,
    status: 'at-risk',
    owner: 'João Santos',
    dueDate: '2024-04-15'
  },
  {
    title: 'Expandir mercado digital',
    progress: 90,
    status: 'completed',
    owner: 'Ana Costa',
    dueDate: '2024-02-28'
  },
];

export const DashboardHome: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Visão geral do seu planejamento estratégico</p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-blue-700">
          <Calendar className="h-4 w-4 mr-2" />
          Novo Relatório
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <div className="flex items-center mt-2">
                    {stat.changeType === 'positive' ? (
                      <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
                    ) : (
                      <ArrowDown className="h-3 w-3 text-red-500 mr-1" />
                    )}
                    <span className={`text-xs font-medium ${
                      stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Objectives Progress */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Objetivos Estratégicos</CardTitle>
              <CardDescription>Progresso dos principais objetivos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentObjectives.map((objective, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{objective.title}</h4>
                      <p className="text-sm text-gray-600">
                        {objective.owner} • Vence em {objective.dueDate}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {objective.status === 'completed' && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      {objective.status === 'at-risk' && (
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                      )}
                      <span className="text-sm font-medium">{objective.progress}%</span>
                    </div>
                  </div>
                  <Progress value={objective.progress} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Target className="h-4 w-4 mr-2" />
                Criar Objetivo
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Briefcase className="h-4 w-4 mr-2" />
                Novo Projeto
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="h-4 w-4 mr-2" />
                Adicionar KPI
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Convidar Equipe
              </Button>
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-900">💡 Insights de IA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-white p-3 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900 font-medium">
                  3 projetos estão atrasados
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Considere redistribuir recursos ou ajustar prazos
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900 font-medium">
                  Equipe de marketing superou meta
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Oportunidade de aumentar investimentos
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
