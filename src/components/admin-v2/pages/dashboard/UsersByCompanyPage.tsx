import { Building2, Users, Search, TrendingUp } from "lucide-react";
import { AdminPageContainer } from "../../components/AdminPageContainer";
import { StatCard } from "../../components/StatCard";
import { StatusBadge } from "../../components/StatusBadge";
import { useCompanyStats } from "@/hooks/admin/useDashboardStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useState, useMemo } from "react";

type SortField = "name" | "users" | "active" | "pending";
type SortOrder = "asc" | "desc";

export default function UsersByCompanyPage() {
  const { data: companies, isLoading } = useCompanyStats();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("users");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Calculate stats
  const stats = useMemo(() => {
    if (!companies) return null;
    
    const totalUsers = companies.reduce((sum, c) => sum + c.users.total, 0);
    const avgPerCompany = companies.length > 0 ? Math.round(totalUsers / companies.length) : 0;
    const maxUsers = Math.max(...companies.map(c => c.users.total), 0);
    const companiesWithUsers = companies.filter(c => c.users.total > 0).length;
    
    return {
      totalCompanies: companies.length,
      totalUsers,
      avgPerCompany,
      maxUsers,
      companiesWithUsers,
    };
  }, [companies]);

  // Chart data (top 10)
  const chartData = useMemo(() => {
    if (!companies) return [];
    
    return [...companies]
      .sort((a, b) => b.users.total - a.users.total)
      .slice(0, 10)
      .map(c => ({
        name: c.name.length > 15 ? c.name.substring(0, 15) + "..." : c.name,
        total: c.users.total,
        ativos: c.users.active,
      }));
  }, [companies]);

  // Filter and sort companies
  const filteredCompanies = useMemo(() => {
    if (!companies) return [];
    
    let filtered = companies.filter(company => {
      const matchesSearch = searchTerm === "" || 
        company.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || company.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "users":
          comparison = a.users.total - b.users.total;
          break;
        case "active":
          comparison = a.users.active - b.users.active;
          break;
        case "pending":
          comparison = a.users.pending - b.users.pending;
          break;
      }
      return sortOrder === "desc" ? -comparison : comparison;
    });

    return filtered;
  }, [companies, searchTerm, statusFilter, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  return (
    <AdminPageContainer 
      title="Usuários por Empresa" 
      description="Distribuição de usuários entre as empresas"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total de Empresas"
            value={stats?.totalCompanies || 0}
            description={`${stats?.companiesWithUsers || 0} com usuários`}
            icon={Building2}
            variant="info"
            isLoading={isLoading}
          />
          <StatCard
            title="Total de Usuários"
            value={stats?.totalUsers || 0}
            icon={Users}
            variant="success"
            isLoading={isLoading}
          />
          <StatCard
            title="Média por Empresa"
            value={stats?.avgPerCompany || 0}
            description="usuários/empresa"
            icon={TrendingUp}
            variant="default"
            isLoading={isLoading}
          />
          <StatCard
            title="Maior Empresa"
            value={stats?.maxUsers || 0}
            description="usuários"
            icon={Users}
            variant="info"
            isLoading={isLoading}
          />
        </div>

        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top 10 Empresas por Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs fill-muted-foreground" />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      width={120}
                      className="text-xs fill-muted-foreground"
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                    />
                    <Bar 
                      dataKey="total" 
                      fill="hsl(var(--primary))" 
                      name="Total"
                      radius={[0, 4, 4, 0]}
                    />
                    <Bar 
                      dataKey="ativos" 
                      fill="hsl(142, 76%, 36%)" 
                      name="Ativos"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Nenhum dado disponível
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Detalhamento por Empresa</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar empresa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativas</SelectItem>
                  <SelectItem value="inactive">Inativas</SelectItem>
                </SelectContent>
              </Select>
              <Select value={`${sortField}-${sortOrder}`} onValueChange={(v) => {
                const [field, order] = v.split("-") as [SortField, SortOrder];
                setSortField(field);
                setSortOrder(order);
              }}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="users-desc">Mais usuários</SelectItem>
                  <SelectItem value="users-asc">Menos usuários</SelectItem>
                  <SelectItem value="name-asc">Nome A-Z</SelectItem>
                  <SelectItem value="name-desc">Nome Z-A</SelectItem>
                  <SelectItem value="active-desc">Mais ativos</SelectItem>
                  <SelectItem value="pending-desc">Mais pendentes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : filteredCompanies.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                      <TableHead className="text-center">Ativos</TableHead>
                      <TableHead className="text-center">Pendentes</TableHead>
                      <TableHead>Taxa de Ativação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCompanies.map((company) => {
                      const activationRate = company.users.total > 0 
                        ? Math.round((company.users.active / company.users.total) * 100) 
                        : 0;
                      
                      return (
                        <TableRow key={company.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={company.logo_url || undefined} />
                                <AvatarFallback className="text-xs bg-primary/10">
                                  {company.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{company.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {company.company_type === "startup" ? "Startup" : "Regular"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <StatusBadge 
                              status={company.status === "active" ? "active" : "inactive"} 
                            />
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            {company.users.total}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-green-600 font-medium">{company.users.active}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            {company.users.pending > 0 ? (
                              <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700">
                                {company.users.pending}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">0</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={activationRate} className="h-2 w-20" />
                              <span className="text-sm text-muted-foreground w-10">
                                {activationRate}%
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                Nenhuma empresa encontrada com os filtros aplicados
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminPageContainer>
  );
}
