import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useMultiTenant';
import { supabase } from '@/integrations/supabase/client';
import { PermissionGate } from '@/components/PermissionGate';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Building2, Edit, Trash2, Users } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface Company {
  id: string;
  name: string;
  document?: string;
  email?: string;
  phone?: string;
  active: boolean;
  created_at: string;
  _count?: {
    profiles: number;
  };
}

export const CompaniesPage: React.FC = () => {
  const { isSystemAdmin } = useAuth();
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isSystemAdmin) {
      fetchCompanies();
    }
  }, [isSystemAdmin]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await supabase.from('companies').select('*').order('name');
      setCompanies(response.data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isSystemAdmin) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h2>
          <p className="text-gray-600">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Empresas</h1>
          <p className="text-gray-600 mt-2">Gerencie todas as empresas do sistema</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nova Empresa
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies.map((company) => (
          <Card key={company.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{company.name}</CardTitle>
                    <p className="text-sm text-gray-500">{company.document}</p>
                  </div>
                </div>
                <Badge variant={company.active ? 'default' : 'secondary'}>
                  {company.active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                {company.email && (
                  <p className="text-gray-600">📧 {company.email}</p>
                )}
                {company.phone && (
                  <p className="text-gray-600">📞 {company.phone}</p>
                )}
                <div className="flex items-center gap-2 text-gray-600">
                  <Users className="h-4 w-4" />
                  <span>{company._count?.profiles || 0} usuários</span>
                </div>
              </div>
              
              <div className="flex gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" className="flex-1">
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button 
                  variant="outline"
                  size="sm" 
                  className="flex-1"
                >
                  Status
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {companies.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma empresa encontrada</h3>
          <p className="text-gray-600 mb-6">Comece criando sua primeira empresa.</p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Criar Empresa
          </Button>
        </div>
      )}
    </div>
  );
};