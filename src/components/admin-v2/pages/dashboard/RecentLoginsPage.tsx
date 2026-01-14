import { LogIn, Search, Calendar, Monitor, Smartphone } from "lucide-react";
import { AdminPageContainer } from "../../components/AdminPageContainer";
import { StatCard } from "../../components/StatCard";
import { PeriodFilter } from "../../components/PeriodFilter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, formatDistanceToNow, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useMemo } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const ITEMS_PER_PAGE = 15;

function parseUserAgent(ua: string | null): { device: string; icon: typeof Monitor } {
  if (!ua) return { device: "Desconhecido", icon: Monitor };
  
  const lowerUA = ua.toLowerCase();
  if (lowerUA.includes("mobile") || lowerUA.includes("android") || lowerUA.includes("iphone")) {
    return { device: "Mobile", icon: Smartphone };
  }
  if (lowerUA.includes("chrome")) return { device: "Chrome", icon: Monitor };
  if (lowerUA.includes("firefox")) return { device: "Firefox", icon: Monitor };
  if (lowerUA.includes("safari")) return { device: "Safari", icon: Monitor };
  if (lowerUA.includes("edge")) return { device: "Edge", icon: Monitor };
  
  return { device: "Desktop", icon: Monitor };
}

function maskIP(ip: string | null): string {
  if (!ip) return "-";
  const parts = ip.split(".");
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.***.***`;
  }
  return ip.substring(0, 8) + "***";
}

export default function RecentLoginsPage() {
  const [dateRange, setDateRange] = useState({ 
    from: subDays(new Date(), 7), 
    to: new Date() 
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch logins
  const { data: loginsData, isLoading } = useQuery({
    queryKey: ["admin-logins-filtered", dateRange.from, dateRange.to],
    queryFn: async () => {
      const { data: logins, error } = await supabase
        .from("user_login_logs")
        .select("id, user_id, login_time, logout_time, ip_address, user_agent")
        .gte("login_time", dateRange.from.toISOString())
        .lte("login_time", dateRange.to.toISOString())
        .order("login_time", { ascending: false });

      if (error) throw error;

      const userIds = [...new Set(logins?.map(l => l.user_id) || [])];
      
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name, email, avatar_url, company_id")
        .in("user_id", userIds);

      const { data: companies } = await supabase
        .from("companies")
        .select("id, name");

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      const companyMap = new Map(companies?.map(c => [c.id, c]) || []);

      return {
        logins: logins?.map(login => {
          const profile = profileMap.get(login.user_id);
          const company = profile?.company_id ? companyMap.get(profile.company_id) : null;
          const duration = login.logout_time 
            ? differenceInMinutes(new Date(login.logout_time), new Date(login.login_time))
            : null;
          
          return {
            ...login,
            user_name: profile ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Usuário" : "Usuário",
            user_email: profile?.email || "",
            user_avatar: profile?.avatar_url,
            company_id: profile?.company_id || null,
            company_name: company?.name || "Sem empresa",
            duration_minutes: duration,
          };
        }) || [],
        companies: companies || [],
      };
    },
  });

  // Calculate stats
  const stats = useMemo(() => {
    if (!loginsData?.logins) return { total: 0, today: 0, week: 0, avgPerDay: 0 };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekAgo = subDays(today, 7);
    
    const todayLogins = loginsData.logins.filter(l => new Date(l.login_time) >= today).length;
    const weekLogins = loginsData.logins.filter(l => new Date(l.login_time) >= weekAgo).length;
    
    return {
      total: loginsData.logins.length,
      today: todayLogins,
      week: weekLogins,
      avgPerDay: Math.round(loginsData.logins.length / 7),
    };
  }, [loginsData?.logins]);

  // Filter logins
  const filteredLogins = useMemo(() => {
    if (!loginsData?.logins) return [];
    
    return loginsData.logins.filter(login => {
      const matchesSearch = searchTerm === "" || 
        login.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        login.user_email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCompany = companyFilter === "all" || login.company_id === companyFilter;
      
      return matchesSearch && matchesCompany;
    });
  }, [loginsData?.logins, searchTerm, companyFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredLogins.length / ITEMS_PER_PAGE);
  const paginatedLogins = filteredLogins.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <AdminPageContainer 
      title="Logins Recentes" 
      description="Histórico de acessos ao sistema"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total no Período"
            value={stats.total}
            icon={LogIn}
            variant="info"
            isLoading={isLoading}
          />
          <StatCard
            title="Logins Hoje"
            value={stats.today}
            icon={Calendar}
            variant="success"
            isLoading={isLoading}
          />
          <StatCard
            title="Últimos 7 Dias"
            value={stats.week}
            icon={Calendar}
            variant="default"
            isLoading={isLoading}
          />
          <StatCard
            title="Média/Dia"
            value={stats.avgPerDay}
            description="No período selecionado"
            icon={LogIn}
            variant="default"
            isLoading={isLoading}
          />
        </div>

        {/* Filters and Table */}
        <Card>
          <CardHeader className="space-y-4">
            <CardTitle className="text-lg">Histórico de Logins</CardTitle>
            <PeriodFilter value={dateRange} onChange={setDateRange} />
          </CardHeader>
          <CardContent>
            {/* Search and Company Filter */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="pl-9"
                />
              </div>
              <Select value={companyFilter} onValueChange={(v) => { setCompanyFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Todas as empresas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as empresas</SelectItem>
                  {loginsData?.companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : paginatedLogins.length > 0 ? (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Duração</TableHead>
                        <TableHead>IP</TableHead>
                        <TableHead>Dispositivo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedLogins.map((login) => {
                        const { device, icon: DeviceIcon } = parseUserAgent(login.user_agent);
                        return (
                          <TableRow key={login.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={login.user_avatar || undefined} />
                                  <AvatarFallback className="text-xs">
                                    {login.user_name.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-sm">{login.user_name}</p>
                                  <p className="text-xs text-muted-foreground">{login.user_email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{login.company_name}</TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm">
                                  {format(new Date(login.login_time), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(login.login_time), { addSuffix: true, locale: ptBR })}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {login.duration_minutes !== null ? (
                                <Badge variant="secondary">
                                  {login.duration_minutes < 60 
                                    ? `${login.duration_minutes}min`
                                    : `${Math.floor(login.duration_minutes / 60)}h ${login.duration_minutes % 60}min`
                                  }
                                </Badge>
                              ) : (
                                <Badge variant="outline">Ativo</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground font-mono">
                              {maskIP(login.ip_address)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <DeviceIcon className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{device}</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-4 flex justify-center">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        {[...Array(Math.min(5, totalPages))].map((_, i) => {
                          const page = i + 1;
                          return (
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => setCurrentPage(page)}
                                isActive={currentPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                Nenhum login encontrado no período selecionado
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminPageContainer>
  );
}
