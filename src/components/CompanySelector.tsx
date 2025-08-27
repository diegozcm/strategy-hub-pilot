import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useMultiTenant';
import { Building2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { Company } from '@/types/admin';

export const CompanySelector: React.FC = () => {
  const { isSystemAdmin, company, switchCompany, profile } = useAuth();
  const [availableCompanies, setAvailableCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isSystemAdmin) {
      loadAvailableCompanies();
    } else if (profile?.role === 'manager' || profile?.role === 'member') {
      loadUserCompanies();
    }
  }, [isSystemAdmin, profile?.role]);

  const loadAvailableCompanies = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setAvailableCompanies((data || []).map(company => ({
        ...company,
        status: company.status as 'active' | 'inactive'
      })));
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserCompanies = async () => {
    if (!profile?.user_id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_company_relations')
        .select(`
          company_id,
          companies!inner (
            id,
            name,
            status,
            owner_id,
            mission,
            vision,
            values,
            logo_url,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', profile.user_id)
        .eq('companies.status', 'active');

      if (error) throw error;
      
      const companies = data?.map(relation => relation.companies).filter(Boolean) || [];
      setAvailableCompanies(companies as Company[]);
    } catch (error) {
      console.error('Erro ao carregar empresas do usuário:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyChange = async (selectedCompany: Company) => {
    if (isSystemAdmin && switchCompany) {
      await switchCompany(selectedCompany.id);
    } else if (availableCompanies.length > 1 && switchCompany) {
      // Permite que usuários com múltiplas empresas também possam trocar
      await switchCompany(selectedCompany.id);
    }
  };

  // Para usuários não admin sem empresa selecionada
  if (!isSystemAdmin && !company) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Building2 className="h-4 w-4" />
        <span>Nenhuma empresa associada</span>
      </div>
    );
  }

  // Para usuários não admin com empresa fixa
  if (!isSystemAdmin && availableCompanies.length <= 1) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Building2 className="h-4 w-4" />
        <span>{company?.name || 'Nenhuma empresa'}</span>
      </div>
    );
  }

  // Para admins ou usuários com múltiplas empresas
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          <span>{company?.name || 'Selecionar empresa'}</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {loading ? (
          <DropdownMenuItem disabled>
            Carregando empresas...
          </DropdownMenuItem>
        ) : availableCompanies.length === 0 ? (
          <DropdownMenuItem disabled>
            Nenhuma empresa disponível
          </DropdownMenuItem>
        ) : (
          availableCompanies.map((availableCompany) => (
            <DropdownMenuItem
              key={availableCompany.id}
              onClick={() => handleCompanyChange(availableCompany)}
              className={company?.id === availableCompany.id ? 'bg-accent' : ''}
            >
              <div className="flex items-center justify-between w-full">
                <span>{availableCompany.name}</span>
                {company?.id === availableCompany.id && (
                  <div className="w-2 h-2 bg-primary rounded-full ml-2" />
                )}
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};