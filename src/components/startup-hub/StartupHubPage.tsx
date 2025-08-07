import React from 'react';
import { Rocket, Building, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const StartupHubPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-lg">
            <Rocket className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Startup HUB</h1>
            <p className="text-muted-foreground">
              Plataforma de gestão e aceleração de startups
            </p>
          </div>
        </div>
      </div>

      {/* Welcome Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="h-5 w-5" />
            <span>Bem-vindo ao Startup HUB</span>
          </CardTitle>
          <CardDescription>
            Este módulo está em desenvolvimento e em breve oferecerá funcionalidades completas para gestão de startups.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Building className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-medium">Gestão de Startups</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Cadastro e acompanhamento de startups em diferentes estágios de desenvolvimento.
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-medium">Métricas e KPIs</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Acompanhamento de indicadores de performance e crescimento das startups.
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-medium">Mentoria e Suporte</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Sistema de mentoria e suporte para acelerar o crescimento das startups.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coming Soon Section */}
      <Card>
        <CardHeader>
          <CardTitle>Funcionalidades em Desenvolvimento</CardTitle>
          <CardDescription>
            Estamos trabalhando nas seguintes funcionalidades que estarão disponíveis em breve:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-sm">Portal de startups com perfis detalhados</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-sm">Sistema de avaliação e scoring</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-sm">Acompanhamento de programas de aceleração</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-sm">Relatórios de performance e progresso</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-sm">Integração com ferramentas de investimento</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};