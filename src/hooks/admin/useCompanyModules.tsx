import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CompanyModules {
  [companyId: string]: string[];
}

export interface ModuleStats {
  strategyHub: number;
  startupHub: number;
}

export const useCompanyModules = () => {
  return useQuery({
    queryKey: ["admin-company-modules"],
    queryFn: async (): Promise<{ modulesByCompany: CompanyModules; stats: ModuleStats }> => {
      // Fetch user_module_roles with profiles and system_modules
      const { data: moduleRoles, error: rolesError } = await supabase
        .from("user_module_roles")
        .select(`
          module_id,
          profiles!inner(company_id),
          system_modules!inner(id, name, slug)
        `);

      if (rolesError) throw rolesError;

      // Aggregate modules by company
      const modulesByCompany: CompanyModules = {};
      const companyModuleSet: Record<string, Set<string>> = {};

      moduleRoles?.forEach((row: any) => {
        const companyId = row.profiles?.company_id;
        const moduleSlug = row.system_modules?.slug;
        
        if (companyId && moduleSlug) {
          if (!companyModuleSet[companyId]) {
            companyModuleSet[companyId] = new Set();
          }
          companyModuleSet[companyId].add(moduleSlug);
        }
      });

      // Convert sets to arrays
      Object.entries(companyModuleSet).forEach(([companyId, slugs]) => {
        modulesByCompany[companyId] = Array.from(slugs);
      });

      // Calculate stats - count unique companies with each module
      const companiesWithStrategy = new Set<string>();
      const companiesWithStartup = new Set<string>();

      Object.entries(modulesByCompany).forEach(([companyId, modules]) => {
        if (modules.includes('strategic-planning')) {
          companiesWithStrategy.add(companyId);
        }
        if (modules.includes('startup-hub')) {
          companiesWithStartup.add(companyId);
        }
      });

      return {
        modulesByCompany,
        stats: {
          strategyHub: companiesWithStrategy.size,
          startupHub: companiesWithStartup.size,
        }
      };
    },
    staleTime: 60 * 1000,
  });
};
