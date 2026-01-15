import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface StartupHubStats {
  totalStartups: number;
  activeStartups: number;
  startupMembers: number;
  mentors: number;
  activeMentors: number;
  mentorLinks: number;
  totalSessions: number;
  completedSessions: number;
}

interface Mentor {
  id: string;
  user_id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  company_id: string | null;
  company_name: string | null;
  linkedStartups: number;
  status: string;
}

interface MentorLink {
  id: string;
  mentor_id: string;
  mentor_name: string;
  mentor_email: string;
  startup_company_id: string;
  startup_name: string;
  assigned_at: string;
  status: string;
}

interface StartupDetails {
  id: string;
  name: string;
  logo_url: string | null;
  status: string;
  ai_enabled: boolean;
  created_at: string;
  members: number;
  mentor_name: string | null;
  mentor_id: string | null;
}

export const useStartupHubStats = () => {
  return useQuery({
    queryKey: ["admin-startup-hub-stats"],
    queryFn: async (): Promise<StartupHubStats> => {
      // Fetch startups count
      const { data: startups, error: startupsError } = await supabase
        .from("companies")
        .select("id, status")
        .eq("company_type", "startup");

      if (startupsError) throw startupsError;

      // Fetch startup hub profiles
      const { data: hubProfiles, error: hubError } = await supabase
        .from("startup_hub_profiles")
        .select("id, type, status");

      if (hubError) throw hubError;

      // Fetch mentor-startup relations
      const { data: relations, error: relationsError } = await supabase
        .from("mentor_startup_relations")
        .select("id, status");

      if (relationsError) throw relationsError;

      // Fetch mentoring sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from("mentoring_sessions")
        .select("id, status");

      if (sessionsError) throw sessionsError;

      const startupsArray = startups || [];
      const profilesArray = hubProfiles || [];
      const relationsArray = relations || [];
      const sessionsArray = sessions || [];

      return {
        totalStartups: startupsArray.length,
        activeStartups: startupsArray.filter(s => s.status === "active").length,
        startupMembers: profilesArray.filter(p => p.type === "startup").length,
        mentors: profilesArray.filter(p => p.type === "mentor").length,
        activeMentors: profilesArray.filter(p => p.type === "mentor" && p.status === "active").length,
        mentorLinks: relationsArray.filter(r => r.status === "active").length,
        totalSessions: sessionsArray.length,
        completedSessions: sessionsArray.filter(s => s.status === "completed").length,
      };
    },
    staleTime: 60 * 1000,
  });
};

export const useMentors = () => {
  return useQuery({
    queryKey: ["admin-mentors"],
    queryFn: async (): Promise<Mentor[]> => {
      // Fetch mentor profiles from startup_hub_profiles
      const { data: mentorProfiles, error: mentorError } = await supabase
        .from("startup_hub_profiles")
        .select("id, user_id, status")
        .eq("type", "mentor");

      if (mentorError) throw mentorError;

      if (!mentorProfiles || mentorProfiles.length === 0) {
        return [];
      }

      const userIds = mentorProfiles.map(m => m.user_id);

      // Fetch user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name, email, avatar_url, company_id")
        .in("user_id", userIds);

      if (profilesError) throw profilesError;

      // Fetch companies for names
      const companyIds = [...new Set(profiles?.map(p => p.company_id).filter(Boolean) || [])];
      const { data: companies } = await supabase
        .from("companies")
        .select("id, name")
        .in("id", companyIds);

      const companyMap = new Map(companies?.map(c => [c.id, c.name]) || []);

      // Fetch mentor relations to count linked startups
      const { data: relations } = await supabase
        .from("mentor_startup_relations")
        .select("mentor_id, status")
        .eq("status", "active");

      const linkCounts: Record<string, number> = {};
      relations?.forEach(r => {
        linkCounts[r.mentor_id] = (linkCounts[r.mentor_id] || 0) + 1;
      });

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return mentorProfiles.map(mp => {
        const profile = profileMap.get(mp.user_id);
        return {
          id: mp.id,
          user_id: mp.user_id,
          name: profile ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Sem nome" : "Sem nome",
          email: profile?.email || "",
          avatar_url: profile?.avatar_url || null,
          company_id: profile?.company_id || null,
          company_name: profile?.company_id ? companyMap.get(profile.company_id) || null : null,
          linkedStartups: linkCounts[mp.user_id] || 0,
          status: mp.status,
        };
      });
    },
    staleTime: 60 * 1000,
  });
};

export const useMentorLinks = () => {
  return useQuery({
    queryKey: ["admin-mentor-links"],
    queryFn: async (): Promise<MentorLink[]> => {
      // Fetch active mentor-startup relations
      const { data: relations, error: relationsError } = await supabase
        .from("mentor_startup_relations")
        .select("id, mentor_id, startup_company_id, assigned_at, status")
        .eq("status", "active");

      if (relationsError) throw relationsError;

      if (!relations || relations.length === 0) {
        return [];
      }

      // Fetch mentor profiles
      const mentorIds = [...new Set(relations.map(r => r.mentor_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name, email")
        .in("user_id", mentorIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Fetch startup companies
      const startupIds = [...new Set(relations.map(r => r.startup_company_id))];
      const { data: startups } = await supabase
        .from("companies")
        .select("id, name")
        .in("id", startupIds);

      const startupMap = new Map(startups?.map(s => [s.id, s.name]) || []);

      return relations.map(r => {
        const mentor = profileMap.get(r.mentor_id);
        return {
          id: r.id,
          mentor_id: r.mentor_id,
          mentor_name: mentor ? `${mentor.first_name || ""} ${mentor.last_name || ""}`.trim() || "Sem nome" : "Sem nome",
          mentor_email: mentor?.email || "",
          startup_company_id: r.startup_company_id,
          startup_name: startupMap.get(r.startup_company_id) || "Startup desconhecida",
          assigned_at: r.assigned_at,
          status: r.status,
        };
      });
    },
    staleTime: 60 * 1000,
  });
};

export const useStartupDetails = () => {
  return useQuery({
    queryKey: ["admin-startup-details"],
    queryFn: async (): Promise<StartupDetails[]> => {
      // Fetch startup companies
      const { data: startups, error: startupsError } = await supabase
        .from("companies")
        .select("id, name, logo_url, status, ai_enabled, created_at")
        .eq("company_type", "startup");

      if (startupsError) throw startupsError;

      if (!startups || startups.length === 0) {
        return [];
      }

      // Fetch profiles to count members
      const { data: profiles } = await supabase
        .from("profiles")
        .select("company_id")
        .in("company_id", startups.map(s => s.id));

      const memberCounts: Record<string, number> = {};
      profiles?.forEach(p => {
        if (p.company_id) {
          memberCounts[p.company_id] = (memberCounts[p.company_id] || 0) + 1;
        }
      });

      // Fetch mentor relations
      const { data: relations } = await supabase
        .from("mentor_startup_relations")
        .select("mentor_id, startup_company_id")
        .eq("status", "active")
        .in("startup_company_id", startups.map(s => s.id));

      // Fetch mentor profiles
      const mentorIds = [...new Set(relations?.map(r => r.mentor_id) || [])];
      const { data: mentorProfiles } = mentorIds.length > 0 
        ? await supabase
            .from("profiles")
            .select("user_id, first_name, last_name")
            .in("user_id", mentorIds)
        : { data: [] };

      const mentorMap = new Map<string, string>();
      mentorProfiles?.forEach(m => {
        mentorMap.set(m.user_id, `${m.first_name || ""} ${m.last_name || ""}`.trim());
      });
      
      const startupMentorMap = new Map<string, { id: string; name: string | null }>();
      relations?.forEach(r => {
        startupMentorMap.set(r.startup_company_id, { 
          id: r.mentor_id, 
          name: mentorMap.get(r.mentor_id) || null 
        });
      });

      return startups.map(s => ({
        id: s.id,
        name: s.name,
        logo_url: s.logo_url,
        status: s.status || "active",
        ai_enabled: s.ai_enabled,
        created_at: s.created_at,
        members: memberCounts[s.id] || 0,
        mentor_name: startupMentorMap.get(s.id)?.name || null,
        mentor_id: startupMentorMap.get(s.id)?.id || null,
      }));
    },
    staleTime: 60 * 1000,
  });
};
