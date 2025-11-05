import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Building2, ArrowRight, Users, Calendar, ArrowLeft, LogOut, Sparkles, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/hooks/useMultiTenant';
import { Company } from '@/types/auth';
import { toast } from 'sonner';

export const CompanySelectionPage: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectingCompanyId, setSelectingCompanyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  
  const { user, profile, fetchAllUserCompanies, switchCompany, signOut, isSystemAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if user came from company switching
  const fromSwitching = location.state?.fromSwitching;

  useEffect(() => {
    loadUserCompanies();
  }, []);

  const loadUserCompanies = async () => {
    try {
      setLoading(true);
      const userCompanies = await fetchAllUserCompanies?.() || [];
      setCompanies(userCompanies);
      
      // Se o usuário tem apenas uma empresa, selecionar automaticamente
      if (userCompanies.length === 1) {
        await handleCompanySelect(userCompanies[0]);
        return;
      }
      
      // Se não tem empresas, mostrar erro
      if (userCompanies.length === 0) {
        setError('Você não está associado a nenhuma empresa. Entre em contato com o administrador.');
      }
    } catch (error) {
      console.error('Error loading companies:', error);
      setError('Erro ao carregar empresas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompanySelect = async (company: Company) => {
    try {
      setSelectingCompanyId(company.id);
      
      // Persistir a empresa selecionada
      localStorage.setItem('selectedCompanyId', company.id);
      
      // Selecionar a empresa
      await switchCompany?.(company.id);
      
      // Navegar para o dashboard
      navigate('/app/dashboard');
    } catch (error) {
      console.error('Error selecting company:', error);
      setError('Erro ao selecionar empresa. Tente novamente.');
    } finally {
      setSelectingCompanyId(null);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Logout realizado com sucesso');
      navigate('/auth');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Erro ao fazer logout');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground mt-4">Carregando suas empresas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Erro</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate('/auth')} variant="outline">
              Voltar ao Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-4">
            {fromSwitching ? (
              <Button
                variant="ghost"
                onClick={() => navigate(-1)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            ) : (
              <div />
            )}
            <div className="flex items-center gap-2">
              {isSystemAdmin && (
                <Button
                  variant="default"
                  onClick={() => navigate('/app/admin')}
                  className="flex items-center gap-2"
                >
                  <Shield className="h-4 w-4" />
                  Console Administrativo
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
          <div className="inline-flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-700 p-3 rounded-2xl mb-4">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            {fromSwitching ? 'Trocar de Empresa' : 'Selecione sua Empresa'}
          </h1>
          <p className="text-gray-600 mt-2">
            Olá {profile?.first_name}! Escolha a empresa em que deseja trabalhar.
          </p>
        </div>

        {/* Companies Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {companies.map((company) => (
            <Card key={company.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{company.name}</CardTitle>
                    {company.ai_enabled && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        AI Ativo
                      </Badge>
                    )}
                  </div>
                  {company.logo_url ? (
                    <img 
                      src={company.logo_url} 
                      alt={`Logo ${company.name}`}
                      className="h-10 w-10 object-cover rounded-md border border-border/50"
                    />
                  ) : (
                    <div className="flex-shrink-0 bg-primary/10 rounded-full p-2">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                  )}
                </div>
                <CardDescription className="text-sm">
                  {company.document ? `CNPJ: ${company.document}` : 'Empresa'}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    <span>Empresa</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{new Date(company.created_at).getFullYear()}</span>
                  </div>
                </div>
                
                <Button 
                  className="w-full" 
                  onClick={() => handleCompanySelect(company)}
                  disabled={selectingCompanyId === company.id}
                >
                  {selectingCompanyId === company.id ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      Selecionar
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Help Text */}
        {!fromSwitching && (
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>Você pode trocar de empresa a qualquer momento através do menu do usuário.</p>
          </div>
        )}
      </div>
    </div>
  );
};