import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AnalyticsOverview {
  totalVisitors: number;
  totalSessions: number;
  avgSessionDuration: number; // in seconds
  avgPagesPerVisit: number;
  bounceRate: number; // percentage
}

interface DailyVisitors {
  date: string;
  visitors: number;
  sessions: number;
}

interface TopPage {
  label: string;
  value: number;
}

interface DeviceBreakdown {
  device: string;
  count: number;
  percentage: number;
}

function parseDevice(userAgent: string | null): string {
  if (!userAgent) return "Desconhecido";
  const ua = userAgent.toLowerCase();
  if (/mobile|android|iphone|ipad|ipod/.test(ua)) return "Mobile";
  if (/tablet/.test(ua)) return "Tablet";
  return "Desktop";
}

export const useAnalyticsOverview = (days: number = 7) => {
  return useQuery({
    queryKey: ["admin-analytics-overview", days],
    queryFn: async (): Promise<AnalyticsOverview> => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from("user_login_logs")
        .select("user_id, login_time, logout_time")
        .gte("login_time", startDate.toISOString());

      if (error) throw error;

      const logs = data || [];
      const uniqueUsers = new Set(logs.map((l) => l.user_id));

      // Calculate avg session duration
      let totalDuration = 0;
      let sessionsWithDuration = 0;
      logs.forEach((log) => {
        if (log.logout_time && log.login_time) {
          const duration =
            (new Date(log.logout_time).getTime() -
              new Date(log.login_time).getTime()) /
            1000;
          if (duration > 0 && duration < 86400) {
            totalDuration += duration;
            sessionsWithDuration++;
          }
        }
      });

      return {
        totalVisitors: uniqueUsers.size,
        totalSessions: logs.length,
        avgSessionDuration:
          sessionsWithDuration > 0
            ? Math.round(totalDuration / sessionsWithDuration)
            : 0,
        avgPagesPerVisit: uniqueUsers.size > 0
          ? Math.round((logs.length / uniqueUsers.size) * 10) / 10
          : 0,
        bounceRate: 0, // We don't track page-level navigation
      };
    },
    staleTime: 60 * 1000,
  });
};

export const useDailyVisitors = (days: number = 7) => {
  return useQuery({
    queryKey: ["admin-daily-visitors", days],
    queryFn: async (): Promise<DailyVisitors[]> => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from("user_login_logs")
        .select("user_id, login_time")
        .gte("login_time", startDate.toISOString())
        .order("login_time", { ascending: true });

      if (error) throw error;

      const dailyMap: Record<string, { users: Set<string>; sessions: number }> = {};

      (data || []).forEach((log) => {
        const date = new Date(log.login_time).toLocaleDateString("pt-BR");
        if (!dailyMap[date]) {
          dailyMap[date] = { users: new Set(), sessions: 0 };
        }
        dailyMap[date].users.add(log.user_id);
        dailyMap[date].sessions++;
      });

      return Object.entries(dailyMap).map(([date, info]) => ({
        date,
        visitors: info.users.size,
        sessions: info.sessions,
      }));
    },
    staleTime: 60 * 1000,
  });
};

export const useDeviceBreakdown = (days: number = 7) => {
  return useQuery({
    queryKey: ["admin-device-breakdown", days],
    queryFn: async (): Promise<DeviceBreakdown[]> => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from("user_login_logs")
        .select("user_agent")
        .gte("login_time", startDate.toISOString());

      if (error) throw error;

      const deviceCounts: Record<string, number> = {};
      const total = data?.length || 0;

      (data || []).forEach((log) => {
        const device = parseDevice(log.user_agent);
        deviceCounts[device] = (deviceCounts[device] || 0) + 1;
      });

      return Object.entries(deviceCounts)
        .map(([device, count]) => ({
          device,
          count,
          percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count);
    },
    staleTime: 60 * 1000,
  });
};
