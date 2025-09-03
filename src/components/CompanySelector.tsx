import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useMultiTenant';
import { useModules } from '@/hooks/useModules';
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
  const { isSystemAdmin, company, switchCompany, profile, fetchCompaniesByType, fetchAllUserCompanies } = useAuth();
  const { currentModule } = useModules();
  const [availableCompanies, setAvailableCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);

  // Load companies based on current module requirements
  useEffect(() => {
    if (currentModule) {
      loadCompaniesForCurrentModule();
    }
  }, [currentModule, isSystemAdmin, profile?.role]);

  const loadCompaniesForCurrentModule = async () => {
    if (!currentModule) return;
    
    setLoading(true);
    try {
      let companies: any[] = [];
      
      // Different logic based on module
      if (currentModule.slug === 'startup-hub') {
        // StartupHUB: only startup companies (makes sense as it's startup-specific)
        companies = await fetchCompaniesByType?.('startup') || [];
      } else if (currentModule.slug === 'strategic-planning') {
        // StrategyHUB: all companies (startups can create strategic plans too)
        companies = await fetchAllUserCompanies?.() || [];
      } else {
        // Other modules: regular companies (default behavior)
        companies = await fetchCompaniesByType?.('regular') || [];
      }
      
      setAvailableCompanies(companies as Company[]);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyChange = async (selectedCompany: Company) => {
    if (switchCompany) {
      await switchCompany(selectedCompany.id);
    }
  };

  // Se não há módulo ativo, não mostrar o seletor
  if (!currentModule) {
    return null;
  }

  // Se só há uma empresa disponível para o módulo atual, não mostrar o seletor
  if (availableCompanies.length <= 1) {
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