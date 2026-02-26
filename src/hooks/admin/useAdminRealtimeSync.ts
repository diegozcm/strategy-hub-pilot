import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook that subscribes to Supabase Realtime changes on key admin tables
 * and automatically invalidates the corresponding react-query caches.
 * Mount this once in the AdminV2Page layout.
 */
export const useAdminRealtimeSync = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("admin-v2-realtime")
      // Profiles → users stats, dashboard stats, company stats
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["users-stats"] });
          queryClient.invalidateQueries({ queryKey: ["all-users"] });
          queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
          queryClient.invalidateQueries({ queryKey: ["admin-company-stats"] });
          queryClient.invalidateQueries({ queryKey: ["admin-modules-stats"] });
          queryClient.invalidateQueries({ queryKey: ["admin-startup-hub-stats"] });
        }
      )
      // Companies
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "companies" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["companies-for-select"] });
          queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
          queryClient.invalidateQueries({ queryKey: ["admin-company-stats"] });
          queryClient.invalidateQueries({ queryKey: ["admin-company-modules"] });
          queryClient.invalidateQueries({ queryKey: ["admin-startup-hub-stats"] });
          queryClient.invalidateQueries({ queryKey: ["admin-startup-details"] });
        }
      )
      // User roles (admin flag)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_roles" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["users-stats"] });
          queryClient.invalidateQueries({ queryKey: ["all-users"] });
          queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
        }
      )
      // Login logs → analytics, recent logins, login stats
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_login_logs" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin-recent-logins"] });
          queryClient.invalidateQueries({ queryKey: ["admin-login-stats"] });
          queryClient.invalidateQueries({ queryKey: ["admin-analytics-overview"] });
          queryClient.invalidateQueries({ queryKey: ["admin-daily-visitors"] });
          queryClient.invalidateQueries({ queryKey: ["admin-device-breakdown"] });
        }
      )
      // Module roles
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_module_roles" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin-modules-stats"] });
          queryClient.invalidateQueries({ queryKey: ["admin-company-modules"] });
        }
      )
      // System modules
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "system_modules" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin-modules-stats"] });
        }
      )
      // User-company relations
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_company_relations" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["all-users"] });
        }
      )
      // Mentor-startup relations
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mentor_startup_relations" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin-startup-hub-stats"] });
          queryClient.invalidateQueries({ queryKey: ["admin-mentors"] });
          queryClient.invalidateQueries({ queryKey: ["admin-mentor-links"] });
          queryClient.invalidateQueries({ queryKey: ["admin-startup-details"] });
        }
      )
      // Startup hub profiles
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "startup_hub_profiles" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin-startup-hub-stats"] });
          queryClient.invalidateQueries({ queryKey: ["admin-mentors"] });
        }
      )
      // Mentoring sessions
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mentoring_sessions" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin-startup-hub-stats"] });
        }
      )
      // Backup jobs & cleanup logs → system status
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "backup_jobs" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin-system-status"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "database_cleanup_logs" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin-system-status"] });
        }
      )
      // Landing page content
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "landing_page_content" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["landing-page-content"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "landing_page_content_draft" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["landing-page-draft"] });
        }
      )
      // AI analytics
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ai_analytics" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["ai-analytics-raw"] });
          queryClient.invalidateQueries({ queryKey: ["ai-model-pricing"] });
        }
      )
      // AI chat sessions
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ai_chat_sessions" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["ai-chat-sessions-admin"] });
        }
      )
      // AI chat messages
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ai_chat_messages" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["ai-chat-sessions-admin"] });
        }
      )
      // AI model pricing
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ai_model_pricing" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["ai-model-pricing"] });
          queryClient.invalidateQueries({ queryKey: ["ai-pricing-history"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};
