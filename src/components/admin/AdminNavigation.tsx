import React from 'react';
import { BarChart3, Users, Building2, Settings, Shield, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const adminCards = [
  {
    title: 'Empresas',
    description: 'Gerenciar empresas do sistema',
    icon: Building2,
    href: '/app/admin/companies',
    color: 'text-blue-600'
  },
  {
    title: 'Usuários',
    description: 'Gerenciar usuários e permissões',
    icon: Users,
    href: '/app/admin/users',
    color: 'text-green-600'
  },
  {
    title: 'Módulos',
    description: 'Configurar módulos do sistema',
    icon: Package,
    href: '/app/admin/modules',
    color: 'text-purple-600'
  },
  {
    title: 'Acesso aos Módulos',
    description: 'Gerenciar acesso dos usuários aos módulos',
    icon: Shield,
    href: '/app/admin/user-modules',
    color: 'text-orange-600'
  },
  {
    title: 'Configurações',
    description: 'Configurações gerais do sistema',
    icon: Settings,
    href: '/app/admin/settings',
    color: 'text-gray-600'
  }
];

export const AdminNavigation: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Administração</h1>
        <p className="text-muted-foreground">
          Acesso rápido às ferramentas administrativas
        </p>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminCards.map((card, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <card.icon className={`h-6 w-6 ${card.color}`} />
                </div>
                <div>
                  <CardTitle className="text-lg">{card.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {card.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Link to={card.href}>
                <Button variant="outline" className="w-full">
                  Acessar
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};