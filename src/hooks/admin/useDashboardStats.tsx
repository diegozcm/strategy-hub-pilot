import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  totalCompanies: number;
  activeCompanies: number;
  inactiveCompanies: number;
  startupCompanies: number;
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  systemAdmins: number;
  companiesWithAI: number;
  companiesWithOKR: number;
}

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async (): Promise<DashboardStats> => {
      // Fetch companies stats
      const { data: companies, error: companiesError } = await supabase
        .from("companies")
        .select("id, status, company_type, ai_enabled, okr_enabled");

      if (companiesError) throw companiesError;

      // Fetch users stats
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, status");

      if (profilesError) throw profilesError;

      // Fetch system admins count
      const { data: admins, error: adminsError } = await supabase
        .from("user_roles")
        .select("id")
        .eq("role", "admin");

      if (adminsError) throw adminsError;

      const companiesArray = companies || [];
      const profilesArray = profiles || [];

      return {
        totalCompanies: companiesArray.length,
        activeCompanies: companiesArray.filter(c => c.status === "active").length,
        inactiveCompanies: companiesArray.filter(c => c.status === "inactive").length,
        startupCompanies: companiesArray.filter(c => c.company_type === "startup").length,
        companiesWithAI: companiesArray.filter(c => c.ai_enabled).length,
        companiesWithOKR: companiesArray.filter(c => c.okr_enabled).length,
        totalUsers: profilesArray.length,
        activeUsers: profilesArray.filter(p => p.status === "active").length,
        pendingUsers: profilesArray.filter(p => p.status === "pending").length,
        systemAdmins: admins?.length || 0,
      };
    },
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useRecentLogins = (limit: number = 10) => {
  return useQuery({
    queryKey: ["admin-recent-logins", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_login_logs")
        .select(`
          id,
          user_id,
          login_time,
          logout_time,
          ip_address,
          user_agent
        `)
        .order("login_time", { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Fetch profile info for each login
      const userIds = [...new Set(data?.map(l => l.user_id) || [])];
      
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name, email, avatar_url, company_id")
        .in("user_id", userIds);

      const { data: companies } = await supabase
        .from("companies")
        .select("id, name");

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      const companyMap = new Map(companies?.map(c => [c.id, c.name]) || []);

      return data?.map(login => {
        const profile = profileMap.get(login.user_id);
        return {
          ...login,
          user_name: profile ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Usuário" : "Usuário",
          user_email: profile?.email || "",
          user_avatar: profile?.avatar_url,
          company_name: profile?.company_id ? companyMap.get(profile.company_id) || "Sem empresa" : "Sem empresa",
        };
      }) || [];
    },
    staleTime: 30 * 1000,
  });
};

export const useLoginStats = (days: number = 7) => {
  return useQuery({
    queryKey: ["admin-login-stats", days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from("user_login_logs")
        .select("login_time")
        .gte("login_time", startDate.toISOString());

      if (error) throw error;

      // Group by day
      const dailyLogins: Record<string, number> = {};
      
      data?.forEach(login => {
        const date = new Date(login.login_time).toLocaleDateString("pt-BR");
        dailyLogins[date] = (dailyLogins[date] || 0) + 1;
      });

      return Object.entries(dailyLogins).map(([date, count]) => ({
        date,
        logins: count,
      }));
    },
    staleTime: 60 * 1000,
  });
};

export const useCompanyStats = () => {
  return useQuery({
    queryKey: ["admin-company-stats"],
    queryFn: async () => {
      const { data: companies, error: companiesError } = await supabase
        .from("companies")
        .select("id, name, status, company_type, ai_enabled, okr_enabled, created_at, logo_url");

      if (companiesError) throw companiesError;

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, company_id, status");

      if (profilesError) throw profilesError;

      // Count users per company
      const userCounts: Record<string, { total: number; active: number; pending: number }> = {};
      
      profiles?.forEach(profile => {
        if (profile.company_id) {
          if (!userCounts[profile.company_id]) {
            userCounts[profile.company_id] = { total: 0, active: 0, pending: 0 };
          }
          userCounts[profile.company_id].total++;
          if (profile.status === "active") userCounts[profile.company_id].active++;
          if (profile.status === "pending") userCounts[profile.company_id].pending++;
        }
      });

      return companies?.map(company => ({
        ...company,
        users: userCounts[company.id] || { total: 0, active: 0, pending: 0 },
      })) || [];
    },
    staleTime: 60 * 1000,
  });
};

export const useSystemStatus = () => {
  return useQuery({
    queryKey: ["admin-system-status"],
    queryFn: async () => {
      // Check database connection
      const { error: dbError } = await supabase.from("profiles").select("id").limit(1);
      const dbStatus = !dbError;

      // Get last backup
      const { data: lastBackup } = await supabase
        .from("backup_jobs")
        .select("id, created_at, status, backup_size_bytes")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      // Get last cleanup
      const { data: lastCleanup } = await supabase
        .from("database_cleanup_logs")
        .select("id, executed_at, success, records_deleted")
        .order("executed_at", { ascending: false })
        .limit(1)
        .single();

      // Get pending users count
      const { count: pendingUsers } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");

      return {
        database: {
          status: dbStatus ? "healthy" : "error",
          message: dbStatus ? "Conexão OK" : "Erro de conexão",
        },
        backup: lastBackup ? {
          lastRun: lastBackup.created_at,
          status: lastBackup.status,
          size: lastBackup.backup_size_bytes,
        } : null,
        cleanup: lastCleanup ? {
          lastRun: lastCleanup.executed_at,
          success: lastCleanup.success,
          recordsDeleted: lastCleanup.records_deleted,
        } : null,
        pendingUsers: pendingUsers || 0,
      };
    },
    staleTime: 60 * 1000,
  });
};
