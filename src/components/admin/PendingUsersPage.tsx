import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useMultiTenant';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, X, Clock, User, Building2 } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';

interface PendingUser {
  id: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  role: string;
  status: string;
  created_at: string;
}

interface Company {
  id: string;
  name: string;
}

export const PendingUsersPage: React.FC = () => {
  const { isSystemAdmin } = useAuth();
  const { toast } = useToast();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingUser, setProcessingUser] = useState<string | null>(null);

  useEffect(() => {
    if (isSystemAdmin) {
      fetchPendingUsers();
      fetchCompanies();
    }
  }, [isSystemAdmin]);

  const fetchPendingUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pending users:', error);
        return;
      }

      setPendingUsers(data || []);
    } catch (error) {
      console.error('Error fetching pending users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      setCompanies([
        { id: '00000000-0000-0000-0000-000000000001', name: 'Sistema Principal' }
      ]);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const approveUser = async (userId: string, companyId: string, role: string) => {
    setProcessingUser(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          status: 'active',
          company_id: companyId,
          role: role as any,
          approved_at: new Date().toISOString(),
        } as any)
        .eq('id', userId);

      if (error) {
        console.error('Error approving user:', error);
        toast({
          title: "Erro",
          description: "Erro ao aprovar usuário",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Usuário aprovado",
        description: "Usuário aprovado com sucesso",
      });

      await fetchPendingUsers();
    } catch (error) {
      console.error('Error approving user:', error);
      toast({
        title: "Erro",
        description: "Erro ao aprovar usuário",
        variant: "destructive",
      });
    } finally {
      setProcessingUser(null);
    }
  };

  const rejectUser = async (userId: string) => {
    setProcessingUser(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('Error rejecting user:', error);
        toast({
          title: "Erro",
          description: "Erro ao rejeitar usuário",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Usuário rejeitado",
        description: "Usuário rejeitado e removido do sistema",
      });

      await fetchPendingUsers();
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast({
        title: "Erro",
        description: "Erro ao rejeitar usuário",
        variant: "destructive",
      });
    } finally {
      setProcessingUser(null);
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
          <h1 className="text-3xl font-bold text-gray-900">Usuários Pendentes</h1>
          <p className="text-gray-600 mt-2">Aprovar novos usuários no sistema</p>
        </div>
        <Badge variant="secondary" className="text-lg px-3 py-1">
          {pendingUsers.length} pendente(s)
        </Badge>
      </div>

      {pendingUsers.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum usuário pendente</h3>
          <p className="text-gray-600">Todos os usuários foram processados.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {pendingUsers.map((user) => (
            <UserApprovalCard
              key={user.id}
              user={user}
              companies={companies}
              onApprove={approveUser}
              onReject={rejectUser}
              processing={processingUser === user.id}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface UserApprovalCardProps {
  user: PendingUser;
  companies: Company[];
  onApprove: (userId: string, companyId: string, role: string) => void;
  onReject: (userId: string) => void;
  processing: boolean;
}

const UserApprovalCard: React.FC<UserApprovalCardProps> = ({
  user,
  companies,
  onApprove,
  onReject,
  processing
}) => {
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedRole, setSelectedRole] = useState('collaborator');

  const handleApprove = () => {
    if (!selectedCompany) {
      alert('Selecione uma empresa');
      return;
    }
    onApprove(user.id, selectedCompany, selectedRole);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gray-100 p-2 rounded-lg">
              <User className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {user.first_name} {user.last_name}
              </CardTitle>
              <p className="text-sm text-gray-500">{user.email}</p>
              <p className="text-xs text-gray-400">
                Cadastrado em: {new Date(user.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
          <Badge variant="secondary">Pendente</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Empresa</label>
            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar empresa" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {company.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Função</label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="collaborator">Colaborador</SelectItem>
                <SelectItem value="manager">Gestor</SelectItem>
                <SelectItem value="company_admin">Admin da Empresa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex gap-2 pt-4 border-t">
          <Button
            onClick={handleApprove}
            disabled={processing || !selectedCompany}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {processing ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Aprovar
          </Button>
          <Button
            variant="destructive"
            onClick={() => onReject(user.id)}
            disabled={processing}
            className="flex-1"
          >
            <X className="h-4 w-4 mr-2" />
            Rejeitar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};