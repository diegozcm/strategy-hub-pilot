import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ModuleInfo {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  active: boolean;
  created_at: string;
}

export interface RoleStats {
  admin: number;
  manager: number;
  member: number;
}

export interface ModulesStatsData {
  modules: ModuleInfo[];
  totalModules: number;
  activeModules: number;
  totalUsers: number;
  totalCompanies: number;
  roleStats: RoleStats;
  usersByModule: Record<string, number>;
  companiesByModule: Record<string, number>;
}

export const useModulesStats = () => {
  return useQuery({
    queryKey: ["admin-modules-stats"],
    queryFn: async (): Promise<ModulesStatsData> => {
      // 1. Fetch all system modules
      const { data: modules, error: modulesError } = await supabase
        .from("system_modules")
        .select("id, name, slug, description, icon, active, created_at")
        .order("created_at", { ascending: true });

      if (modulesError) throw modulesError;

      // 2. Fetch all user_module_roles
      const { data: userRoles, error: rolesError } = await supabase
        .from("user_module_roles")
        .select("user_id, module_id, role");

      if (rolesError) throw rolesError;

      // 3. Fetch profiles to get company_id mapping
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, company_id");

      if (profilesError) throw profilesError;

      // Create user -> company mapping
      const userToCompany: Record<string, string> = {};
      profiles?.forEach(p => {
        if (p.user_id && p.company_id) {
          userToCompany[p.user_id] = p.company_id;
        }
      });

      // Calculate stats
      const usersByModule: Record<string, Set<string>> = {};
      const companiesByModule: Record<string, Set<string>> = {};
      const roleStats: RoleStats = { admin: 0, manager: 0, member: 0 };

      userRoles?.forEach(role => {
        const moduleId = role.module_id;
        const userId = role.user_id;
        const companyId = userToCompany[userId];
        const roleName = role.role?.toLowerCase() || "";

        // Count users by module
        if (!usersByModule[moduleId]) {
          usersByModule[moduleId] = new Set();
        }
        usersByModule[moduleId].add(userId);

        // Count companies by module
        if (companyId) {
          if (!companiesByModule[moduleId]) {
            companiesByModule[moduleId] = new Set();
          }
          companiesByModule[moduleId].add(companyId);
        }

        // Count roles
        if (roleName === "admin") roleStats.admin++;
        else if (roleName === "manager" || roleName === "gestor") roleStats.manager++;
        else if (roleName === "member" || roleName === "membro") roleStats.member++;
      });

      // Get unique users and companies across all modules
      const allUsers = new Set<string>();
      const allCompanies = new Set<string>();

      Object.values(usersByModule).forEach(users => {
        users.forEach(u => allUsers.add(u));
      });

      Object.values(companiesByModule).forEach(companies => {
        companies.forEach(c => allCompanies.add(c));
      });

      // Convert sets to counts
      const usersByModuleCount: Record<string, number> = {};
      const companiesByModuleCount: Record<string, number> = {};

      Object.entries(usersByModule).forEach(([moduleId, users]) => {
        usersByModuleCount[moduleId] = users.size;
      });

      Object.entries(companiesByModule).forEach(([moduleId, companies]) => {
        companiesByModuleCount[moduleId] = companies.size;
      });

      const modulesArray = modules || [];

      return {
        modules: modulesArray,
        totalModules: modulesArray.length,
        activeModules: modulesArray.filter(m => m.active).length,
        totalUsers: allUsers.size,
        totalCompanies: allCompanies.size,
        roleStats,
        usersByModule: usersByModuleCount,
        companiesByModule: companiesByModuleCount,
      };
    },
    staleTime: 60 * 1000,
  });
};
