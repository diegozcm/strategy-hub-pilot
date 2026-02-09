import { useState } from "react";
import { Monitor, Clock, LogOut, Loader2, Search, RefreshCw } from "lucide-react";
import { AdminPageContainer } from "../../components/AdminPageContainer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ActiveSession {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
  login_time: string;
  user_agent: string | null;
  ip_address: string | null;
}

function parseDevice(ua: string | null): string {
  if (!ua) return "Desktop";
  const lower = ua.toLowerCase();
  if (/ipad|tablet/i.test(lower)) return "Tablet";
  if (/mobile|iphone|android/i.test(lower)) return "Mobile";
  return "Desktop";
}

export default function ActiveSessionsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: sessions, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["active-sessions"],
    queryFn: async (): Promise<ActiveSession[]> => {
      // Get recent logins (last 24h) without logout
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const { data: logs, error } = await supabase
        .from("user_login_logs")
        .select("user_id, login_time, user_agent, ip_address")
        .is("logout_time", null)
        .gte("login_time", since)
        .order("login_time", { ascending: false });

      if (error) throw error;
      if (!logs?.length) return [];

      // Deduplicate by user_id (keep most recent)
      const uniqueMap = new Map<string, typeof logs[0]>();
      logs.forEach((l) => {
        if (!uniqueMap.has(l.user_id)) uniqueMap.set(l.user_id, l);
      });
      const unique = Array.from(uniqueMap.values());

      const userIds = unique.map((l) => l.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name, email, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

      return unique.map((l) => {
        const p = profileMap.get(l.user_id);
        return {
          user_id: l.user_id,
          first_name: p?.first_name || null,
          last_name: p?.last_name || null,
          email: p?.email || null,
          avatar_url: p?.avatar_url || null,
          login_time: l.login_time,
          user_agent: l.user_agent,
          ip_address: l.ip_address,
        };
      });
    },
    refetchInterval: 30000,
  });

  const filtered = sessions?.filter((s) => {
    if (!searchQuery) return true;
    const text = `${s.first_name || ""} ${s.last_name || ""} ${s.email || ""}`.toLowerCase();
    return text.includes(searchQuery.toLowerCase());
  });

  return (
    <AdminPageContainer title="Sessões Ativas" description="Usuários conectados nas últimas 24 horas">
      <div className="max-w-4xl space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Sessões Ativas
                </CardTitle>
                <CardDescription className="mt-1">
                  {sessions?.length ?? 0} sessões nas últimas 24h
                </CardDescription>
              </div>
              <div className="flex gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar usuário..."
                    className="pl-9 w-48"
                  />
                </div>
                <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
                  <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : !filtered?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                <Monitor className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>Nenhuma sessão ativa encontrada</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Dispositivo</TableHead>
                    <TableHead>Login</TableHead>
                    <TableHead>IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((session, idx) => (
                    <TableRow key={`${session.user_id}-${idx}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={session.avatar_url || undefined} />
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {(session.first_name?.[0] || session.email?.[0] || "?").toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {session.first_name || session.last_name
                                ? `${session.first_name || ""} ${session.last_name || ""}`.trim()
                                : "Sem nome"}
                            </p>
                            <p className="text-xs text-muted-foreground">{session.email || "—"}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {parseDevice(session.user_agent)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(session.login_time), { addSuffix: true, locale: ptBR })}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground font-mono">
                        {session.ip_address || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminPageContainer>
  );
}
