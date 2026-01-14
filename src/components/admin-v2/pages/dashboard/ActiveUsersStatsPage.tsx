import { Users, Search, Building2 } from "lucide-react";
import { AdminPageContainer } from "../../components/AdminPageContainer";
import { StatCard } from "../../components/StatCard";
import { PresenceIndicator } from "../../components/PresenceIndicator";
import { useActiveUsersPresence } from "@/hooks/useActiveUsersPresence";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useMemo } from "react";

export default function ActiveUsersStatsPage() {
  const { activeUsers, isLoading } = useActiveUsersPresence();
  const [searchTerm, setSearchTerm] = useState("");
  const [companyFilter, setCompanyFilter] = useState<string>("all");

  // Get unique companies from active users
  const companies = useMemo(() => {
    const uniqueCompanies = new Map<string, string>();
    activeUsers.forEach(user => {
      if (user.company_id && user.company_name) {
        uniqueCompanies.set(user.company_id, user.company_name);
      }
    });
    return Array.from(uniqueCompanies.entries()).map(([id, name]) => ({ id, name }));
  }, [activeUsers]);

  // Filter users
  const filteredUsers = useMemo(() => {
    return activeUsers.filter(user => {
      const matchesSearch = searchTerm === "" || 
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCompany = companyFilter === "all" || user.company_id === companyFilter;
      
      return matchesSearch && matchesCompany;
    });
  }, [activeUsers, searchTerm, companyFilter]);

  // Stats
  const stats = useMemo(() => {
    const byCompany = new Map<string, number>();
    activeUsers.forEach(user => {
      const companyName = user.company_name || "Sem empresa";
      byCompany.set(companyName, (byCompany.get(companyName) || 0) + 1);
    });

    return {
      total: activeUsers.length,
      byCompany: Array.from(byCompany.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5),
    };
  }, [activeUsers]);

  return (
    <AdminPageContainer 
      title="Usuários Ativos" 
      description="Monitoramento em tempo real de usuários online"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            title="Usuários Online"
            value={stats.total}
            description="Em tempo real"
            icon={Users}
            variant="success"
            isLoading={isLoading}
          />
          <StatCard
            title="Empresas Representadas"
            value={companies.length}
            description="Com usuários online"
            icon={Building2}
            variant="info"
            isLoading={isLoading}
          />
          <Card className="col-span-1">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Top Empresas Online
              </p>
              {stats.byCompany.length > 0 ? (
                <div className="space-y-1">
                  {stats.byCompany.map(([company, count]) => (
                    <div key={company} className="flex items-center justify-between text-sm">
                      <span className="truncate">{company}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum usuário online</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PresenceIndicator />
              Usuários Online ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={companyFilter} onValueChange={setCompanyFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Todas as empresas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as empresas</SelectItem>
                  {companies.map((company) => (
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
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                    <div className="flex-1 space-y-1">
                      <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                      <div className="h-3 w-48 bg-muted animate-pulse rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredUsers.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Online desde</TableHead>
                      <TableHead className="w-[60px]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.user_id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar_url || undefined} />
                              <AvatarFallback className="text-xs">
                                {(user.first_name || user.email || "U").charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">
                              {user.first_name && user.last_name 
                                ? `${user.first_name} ${user.last_name}`
                                : user.first_name || "Usuário"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.email || "-"}
                        </TableCell>
                        <TableCell>{user.company_name || "Sem empresa"}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDistanceToNow(new Date(user.online_at), { 
                            addSuffix: true,
                            locale: ptBR 
                          })}
                        </TableCell>
                        <TableCell>
                          <PresenceIndicator />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                {searchTerm || companyFilter !== "all" 
                  ? "Nenhum usuário encontrado com os filtros aplicados"
                  : "Nenhum usuário online no momento"}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminPageContainer>
  );
}
