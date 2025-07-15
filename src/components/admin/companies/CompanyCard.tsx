import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, Edit, Power, PowerOff, UserPlus, Eye } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  owner_id: string;
  mission?: string;
  vision?: string;
  values?: string[];
  logo_url?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

interface CompanyUser {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  role: 'admin' | 'manager' | 'member';
  status: 'active' | 'inactive';
  company_id?: string;
}

interface CompanyCardProps {
  company: Company;
  users: CompanyUser[];
  onEdit: (company: Company) => void;
  onToggleStatus: (companyId: string, currentStatus: string) => void;
  onManageUsers: (company: Company) => void;
}

export const CompanyCard: React.FC<CompanyCardProps> = ({ 
  company, 
  users, 
  onEdit, 
  onToggleStatus,
  onManageUsers
}) => {
  const activeUsers = users.filter(u => u.status === 'active').length;
  const totalUsers = users.length;

  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg leading-tight truncate">{company.name}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Users className="w-4 h-4" />
                {activeUsers}/{totalUsers} usuários ativos
              </CardDescription>
            </div>
          </div>
          <Badge variant={company.status === 'active' ? 'default' : 'destructive'}>
            {company.status === 'active' ? 'Ativa' : 'Inativa'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Company Info */}
        <div className="space-y-3">
          {company.mission && (
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">Missão</h4>
              <p className="text-sm line-clamp-2">{company.mission}</p>
            </div>
          )}
          
          {company.values && company.values.length > 0 && (
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Valores</h4>
              <div className="flex flex-wrap gap-1">
                {company.values.slice(0, 3).map((value, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {value}
                  </Badge>
                ))}
                {company.values.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{company.values.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Users Preview */}
        {users.length > 0 && (
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-2">Usuários Recentes</h4>
            <div className="space-y-1">
              {users.slice(0, 3).map((user) => (
                <div key={user.id} className="flex items-center justify-between text-xs">
                  <span className="truncate">
                    {user.first_name} {user.last_name}
                  </span>
                  <Badge variant={user.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                    {user.role}
                  </Badge>
                </div>
              ))}
              {users.length > 3 && (
                <p className="text-xs text-muted-foreground">
                  +{users.length - 3} usuários
                </p>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="pt-2 border-t">
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(company)}
              className="h-8"
            >
              <Edit className="w-3 h-3 mr-1" />
              Editar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onManageUsers(company)}
              className="h-8"
            >
              <UserPlus className="w-3 h-3 mr-1" />
              Usuários
            </Button>
          </div>
          
          <Button
            size="sm"
            variant={company.status === 'active' ? 'destructive' : 'default'}
            onClick={() => onToggleStatus(company.id, company.status)}
            className="w-full mt-2 h-8"
          >
            {company.status === 'active' ? (
              <>
                <PowerOff className="w-3 h-3 mr-1" />
                Desativar
              </>
            ) : (
              <>
                <Power className="w-3 h-3 mr-1" />
                Ativar
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};