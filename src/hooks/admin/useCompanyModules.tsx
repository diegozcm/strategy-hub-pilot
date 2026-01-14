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
      // 1. Fetch user_module_roles with system_modules (no FK to profiles exists)
      const { data: moduleRoles, error: rolesError } = await supabase
        .from("user_module_roles")
        .select(`
          user_id,
          module_id,
          system_modules!inner(id, name, slug)
        `);

      if (rolesError) throw rolesError;

      // 2. Fetch profiles separately to get user_id -> company_id mapping
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, company_id");

      if (profilesError) throw profilesError;

      // 3. Create user_id -> company_id map for manual JOIN
      const userToCompany: Record<string, string> = {};
      profiles?.forEach(p => {
        if (p.user_id && p.company_id) {
          userToCompany[p.user_id] = p.company_id;
        }
      });

      // 4. Aggregate modules by company using manual JOIN
      const companyModuleSet: Record<string, Set<string>> = {};

      moduleRoles?.forEach((row: any) => {
        const companyId = userToCompany[row.user_id];
        const moduleSlug = row.system_modules?.slug;
        
        if (companyId && moduleSlug) {
          if (!companyModuleSet[companyId]) {
            companyModuleSet[companyId] = new Set();
          }
          companyModuleSet[companyId].add(moduleSlug);
        }
      });

      // 5. Convert sets to arrays
      const modulesByCompany: CompanyModules = {};
      Object.entries(companyModuleSet).forEach(([companyId, slugs]) => {
        modulesByCompany[companyId] = Array.from(slugs);
      });

      // 6. Calculate stats - count unique companies with each module
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
