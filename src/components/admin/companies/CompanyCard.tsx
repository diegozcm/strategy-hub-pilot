import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, Edit, Power, PowerOff, UserPlus, Trash2 } from 'lucide-react';
import { Company, CompanyUser } from '@/types/admin';

interface CompanyCardProps {
  company: Company;
  users: CompanyUser[];
  onEdit: (company: Company) => void;
  onToggleStatus: (companyId: string, currentStatus: string) => void;
  onManageUsers: (company: Company) => void;
  onDelete: (company: Company) => void;
}

export const CompanyCard: React.FC<CompanyCardProps> = ({ 
  company, 
  users, 
  onEdit, 
  onToggleStatus,
  onManageUsers,
  onDelete
}) => {
  const activeUsers = users.filter(u => u.status === 'active').length;
  const totalUsers = users.length;

  return (
    <Card className="w-full hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          {/* Left section - Company info */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Company Info */}
              <div className="space-y-3">
                {company.mission && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Missão</h4>
                    <p className="text-sm">{company.mission}</p>
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
                      <div key={user.user_id} className="flex items-center justify-between text-xs">
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
            </div>
          </div>

          {/* Right section - Actions */}
          <div className="flex flex-row lg:flex-col gap-2 lg:min-w-[200px]">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(company)}
              className="flex-1 lg:w-full"
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onManageUsers(company)}
              className="flex-1 lg:w-full"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Usuários
            </Button>
            <Button
              size="sm"
              variant={company.status === 'active' ? 'destructive' : 'default'}
              onClick={() => onToggleStatus(company.id, company.status)}
              className="flex-1 lg:w-full"
            >
              {company.status === 'active' ? (
                <>
                  <PowerOff className="w-4 h-4 mr-2" />
                  Desativar
                </>
              ) : (
                <>
                  <Power className="w-4 h-4 mr-2" />
                  Ativar
                </>
              )}
            </Button>
            {totalUsers === 0 && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onDelete(company)}
                className="flex-1 lg:w-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};