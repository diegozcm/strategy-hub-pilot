import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Company, CompanyUser } from '@/types/admin';
import { useToast } from '@/components/ui/use-toast';

interface LoadingStates {
  companies: boolean;
  users: boolean;
  overall: boolean;
}

interface CompanyDataLoaderState {
  companies: Company[];
  companyUsers: { [key: string]: CompanyUser[] };
  loading: LoadingStates;
  errors: {
    companies: Error | null;
    users: Error | null;
  };
}

export const useCompanyDataLoader = () => {
  const { toast } = useToast();
  const [state, setState] = useState<CompanyDataLoaderState>({
    companies: [],
    companyUsers: {},
    loading: {
      companies: false,
      users: false,
      overall: false
    },
    errors: {
      companies: null,
      users: null
    }
  });

  const logPerformance = (operation: string, startTime: number) => {
    const duration = Date.now() - startTime;
    console.log(`⏱️ [PERFORMANCE] ${operation}: ${duration}ms`);
  };

  const retryQuery = async <T,>(
    queryFn: () => Promise<T>, 
    operation: string, 
    maxRetries = 3, 
    delay = 1000
  ): Promise<T> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 [RETRY] ${operation} - Tentativa ${attempt}/${maxRetries}`);
        return await queryFn();
      } catch (error) {
        console.error(`❌ [RETRY] ${operation} falhou na tentativa ${attempt}:`, error);
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        if (delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
        }
      }
    }
    
    throw new Error(`Failed after ${maxRetries} attempts`);
  };

  const loadCompanies = useCallback(async (): Promise<Company[]> => {
    const startTime = Date.now();
    console.log('🏢 [COMPANIES] Iniciando carregamento de empresas...');
    
    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, companies: true },
      errors: { ...prev.errors, companies: null }
    }));

    try {
      const result = await retryQuery(async () => {
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
      }, 'load_companies');

      const companiesTyped = (result || []).map(company => ({
        ...company,
        status: company.status as 'active' | 'inactive'
      })) as Company[];

      console.log(`✅ [COMPANIES] ${companiesTyped.length} empresas carregadas`);
      logPerformance('COMPANIES_LOAD', startTime);

      setState(prev => ({
        ...prev,
        companies: companiesTyped,
        loading: { ...prev.loading, companies: false }
      }));

      return companiesTyped;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Erro desconhecido ao carregar empresas');
      console.error('❌ [COMPANIES] Erro fatal:', errorObj);
      
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, companies: false },
        errors: { ...prev.errors, companies: errorObj }
      }));
      
      throw errorObj;
    }
  }, []);

  const loadCompanyUsers = useCallback(async (companies: Company[]): Promise<{ [key: string]: CompanyUser[] }> => {
    if (companies.length === 0) {
      console.log('📋 [USERS] Nenhuma empresa para carregar usuários');
      return {};
    }

    const startTime = Date.now();
    console.log(`👥 [USERS] Carregando usuários para ${companies.length} empresas...`);
    
    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, users: true },
      errors: { ...prev.errors, users: null }
    }));

    try {
      const companyIds = companies.map(c => c.id);
      
      // QUERY 1: Buscar relações user-company (simplificada)
      const relations = await retryQuery(async () => {
        console.log('🔗 [USERS] Buscando relações usuário-empresa...');
        const { data, error } = await supabase
          .from('user_company_relations')
          .select('user_id, company_id, role')
          .in('company_id', companyIds);

        if (error) throw error;
        return data || [];
      }, 'load_user_relations');

      console.log(`✅ [USERS] ${relations.length} relações encontradas`);

      if (relations.length === 0) {
        setState(prev => ({
          ...prev,
          companyUsers: {},
          loading: { ...prev.loading, users: false }
        }));
        return {};
      }

      // QUERY 2: Buscar perfis dos usuários (simplificada)
      const userIds = [...new Set(relations.map(r => r.user_id))];
      
      const profiles = await retryQuery(async () => {
        console.log(`👤 [USERS] Buscando perfis de ${userIds.length} usuários...`);
        const { data, error } = await supabase
          .from('profiles')
          .select('user_id, id, first_name, last_name, email, status')
          .in('user_id', userIds);

        if (error) throw error;
        return data || [];
      }, 'load_user_profiles');

      console.log(`✅ [USERS] ${profiles.length} perfis carregados`);

      // Mapear dados manualmente no JavaScript (mais confiável que JOINs complexos)
      const profilesMap = new Map(profiles.map(p => [p.user_id, p]));
      const usersMap: { [key: string]: CompanyUser[] } = {};

      // Inicializar arrays vazios para todas as empresas
      companies.forEach(company => {
        usersMap[company.id] = [];
      });

      // Combinar relações com perfis
      relations.forEach(relation => {
        const profile = profilesMap.get(relation.user_id);
        if (profile && relation.company_id) {
          const user: CompanyUser = {
            user_id: relation.user_id,
            id: profile.id,
            first_name: profile.first_name,
            last_name: profile.last_name,
            email: profile.email,
            role: relation.role as 'admin' | 'manager' | 'member',
            status: profile.status as 'active' | 'inactive'
          };
          
          if (usersMap[relation.company_id]) {
            usersMap[relation.company_id].push(user);
          }
        }
      });

      console.log('✅ [USERS] Dados de usuários organizados por empresa');
      logPerformance('USERS_LOAD', startTime);

      setState(prev => ({
        ...prev,
        companyUsers: usersMap,
        loading: { ...prev.loading, users: false }
      }));

      return usersMap;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Erro desconhecido ao carregar usuários');
      console.error('❌ [USERS] Erro ao carregar usuários:', errorObj);
      
      // FALLBACK: Não falha o carregamento geral, apenas mostra empresas sem usuários
      const emptyUsersMap: { [key: string]: CompanyUser[] } = {};
      companies.forEach(company => {
        emptyUsersMap[company.id] = [];
      });

      setState(prev => ({
        ...prev,
        companyUsers: emptyUsersMap,
        loading: { ...prev.loading, users: false },
        errors: { ...prev.errors, users: errorObj }
      }));

      // Notificar o usuário mas não bloquear a interface
      toast({
        title: 'Atenção',
        description: 'Erro ao carregar usuários das empresas. Mostrando apenas dados das empresas.',
        variant: 'default'
      });

      return emptyUsersMap;
    }
  }, [toast]);

  const loadAllData = useCallback(async () => {
    console.log('🚀 [LOADER] Iniciando carregamento completo de dados...');
    const overallStartTime = Date.now();
    
    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, overall: true }
    }));

    try {
      // Carregar empresas primeiro (crítico)
      const companies = await loadCompanies();
      
      // Carregar usuários em paralelo (não crítico)
      await loadCompanyUsers(companies);
      
      logPerformance('COMPLETE_LOAD', overallStartTime);
      console.log('🎉 [LOADER] Carregamento completo finalizado com sucesso');
      
    } catch (error) {
      console.error('❌ [LOADER] Erro crítico no carregamento:', error);
      
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro desconhecido ao carregar dados',
        variant: 'destructive'
      });
    } finally {
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, overall: false }
      }));
      console.log('🏁 [LOADER] Carregamento finalizado');
    }
  }, [loadCompanies, loadCompanyUsers, toast]);

  const reloadUsers = useCallback(async () => {
    if (state.companies.length > 0) {
      await loadCompanyUsers(state.companies);
    }
  }, [state.companies, loadCompanyUsers]);

  const clearErrors = useCallback(() => {
    setState(prev => ({
      ...prev,
      errors: { companies: null, users: null }
    }));
  }, []);

  return {
    companies: state.companies,
    companyUsers: state.companyUsers,
    loading: state.loading,
    errors: state.errors,
    loadAllData,
    reloadUsers,
    clearErrors,
    hasErrors: !!(state.errors.companies || state.errors.users)
  };
};