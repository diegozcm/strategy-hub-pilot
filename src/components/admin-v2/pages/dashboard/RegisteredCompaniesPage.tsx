import { Building2, Users, Sparkles, Target, Rocket, Search } from "lucide-react";
import { AdminPageContainer } from "../../components/AdminPageContainer";
import { StatCard } from "../../components/StatCard";
import { StatusBadge } from "../../components/StatusBadge";
import { useCompanyStats } from "@/hooks/admin/useDashboardStats";
import { useCompanyModules } from "@/hooks/admin/useCompanyModules";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useMemo } from "react";

export default function RegisteredCompaniesPage() {
  const { data: companies, isLoading } = useCompanyStats();
  const { data: moduleData, isLoading: modulesLoading } = useCompanyModules();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [moduleFilter, setModuleFilter] = useState<string>("all");

  // Calculate stats
  const stats = useMemo(() => {
    if (!companies) return null;
    
    return {
      total: companies.length,
      active: companies.filter(c => c.status === "active").length,
      inactive: companies.filter(c => c.status === "inactive").length,
      startups: companies.filter(c => c.company_type === "startup").length,
      regular: companies.filter(c => c.company_type !== "startup").length,
      withAI: companies.filter(c => c.ai_enabled).length,
      totalUsers: companies.reduce((sum, c) => sum + c.users.total, 0),
    };
  }, [companies]);

  // Chart data
  const chartData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: "Regulares", value: stats.regular, color: "hsl(var(--primary))" },
      { name: "Startups", value: stats.startups, color: "hsl(210, 100%, 50%)" },
    ];
  }, [stats]);

  // Get modules for a company
  const getCompanyModules = (companyId: string): string[] => {
    return moduleData?.modulesByCompany[companyId] || [];
  };

  // Filter companies
  const filteredCompanies = useMemo(() => {
    if (!companies) return [];
    
    return companies.filter(company => {
      const matchesSearch = searchTerm === "" || 
        company.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || company.status === statusFilter;
      const matchesType = typeFilter === "all" || 
        (typeFilter === "startup" ? company.company_type === "startup" : company.company_type !== "startup");
      
      // Module filter
      const companyModules = getCompanyModules(company.id);
      const matchesModule = moduleFilter === "all" || 
        (moduleFilter === "ai" && company.ai_enabled) ||
        (moduleFilter === "strategic-planning" && companyModules.includes("strategic-planning")) ||
        (moduleFilter === "startup-hub" && companyModules.includes("startup-hub"));
      
      return matchesSearch && matchesStatus && matchesType && matchesModule;
    });
  }, [companies, searchTerm, statusFilter, typeFilter, moduleFilter, moduleData]);

  return (
    <AdminPageContainer 
      title="Empresas Cadastradas" 
      description="Estatísticas e listagem de todas as empresas do sistema"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total de Empresas"
            value={stats?.total || 0}
            icon={Building2}
            variant="info"
            isLoading={isLoading}
          />
          <StatCard
            title="Empresas Ativas"
            value={stats?.active || 0}
            description={`${stats?.inactive || 0} inativas`}
            icon={Building2}
            variant="success"
            isLoading={isLoading}
          />
          <StatCard
            title="Com IA Habilitada"
            value={stats?.withAI || 0}
            icon={Sparkles}
            variant="info"
            isLoading={isLoading}
          />
          <StatCard
            title="Total de Usuários"
            value={stats?.totalUsers || 0}
            description="Em todas as empresas"
            icon={Users}
            variant="default"
            isLoading={isLoading}
          />
        </div>

        {/* Chart and Module Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Distribuição por Tipo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                {chartData.length > 0 && chartData.some(d => d.value > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    Nenhum dado disponível
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Módulos e Recursos Habilitados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {/* Strategy HUB */}
                <div className="p-4 rounded-lg bg-cofound-blue-light/10 border border-cofound-blue-light/30">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded-md bg-cofound-blue-light/20">
                      <Target className="h-4 w-4 text-cofound-blue-light" />
                    </div>
                    <span className="font-medium text-sm">Strategy HUB</span>
                  </div>
                  <p className="text-2xl font-bold text-cofound-blue-light">
                    {modulesLoading ? "..." : moduleData?.stats.strategyHub || 0}
                  </p>
                  <p className="text-xs text-cofound-blue-light/70">
                    {stats?.total ? (((moduleData?.stats.strategyHub || 0) / stats.total) * 100).toFixed(0) : 0}% das empresas
                  </p>
                </div>

                {/* Startup HUB */}
                <div className="p-4 rounded-lg bg-cofound-green/10 border border-cofound-green/30">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded-md bg-cofound-green/20">
                      <Rocket className="h-4 w-4 text-cofound-green" />
                    </div>
                    <span className="font-medium text-sm">Startup HUB</span>
                  </div>
                  <p className="text-2xl font-bold text-cofound-green">
                    {modulesLoading ? "..." : moduleData?.stats.startupHub || 0}
                  </p>
                  <p className="text-xs text-cofound-green/70">
                    {stats?.total ? (((moduleData?.stats.startupHub || 0) / stats.total) * 100).toFixed(0) : 0}% das empresas
                  </p>
                </div>

                {/* IA Copilot */}
                <div className="p-4 rounded-lg bg-cofound-blue-dark/10 border border-cofound-blue-dark/30">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded-md bg-cofound-blue-dark/20">
                      <Sparkles className="h-4 w-4 text-cofound-blue-dark" />
                    </div>
                    <span className="font-medium text-sm">Atlas Hub</span>
                  </div>
                  <p className="text-2xl font-bold text-cofound-blue-dark">
                    {isLoading ? "..." : stats?.withAI || 0}
                  </p>
                  <p className="text-xs text-cofound-blue-dark/70">
                    {stats?.total ? ((stats.withAI / stats.total) * 100).toFixed(0) : 0}% das empresas
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Companies Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Lista de Empresas</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativas</SelectItem>
                  <SelectItem value="inactive">Inativas</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="regular">Regulares</SelectItem>
                  <SelectItem value="startup">Startups</SelectItem>
                </SelectContent>
              </Select>
              <Select value={moduleFilter} onValueChange={setModuleFilter}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Módulo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos módulos</SelectItem>
                  <SelectItem value="strategic-planning">Strategy HUB</SelectItem>
                  <SelectItem value="startup-hub">Startup HUB</SelectItem>
                  <SelectItem value="ai">Com IA</SelectItem>
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
                      <TableHead className="text-center">Usuários</TableHead>
                      <TableHead>Módulos</TableHead>
                      <TableHead>Criada em</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCompanies.map((company) => {
                      const companyModules = getCompanyModules(company.id);
                      
                      return (
                        <TableRow key={company.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={company.logo_url || undefined} />
                                <AvatarFallback className="text-xs bg-cofound-blue-light/10 text-cofound-blue-light">
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
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center">
                              <span className="font-medium">{company.users.total}</span>
                              <span className="text-xs text-muted-foreground">
                                {company.users.active} ativos
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              {companyModules.includes('strategic-planning') && (
                                <Badge variant="secondary" className="text-xs bg-cofound-blue-light/20 text-cofound-blue-light border-cofound-blue-light/30">
                                  <Target className="h-3 w-3 mr-1" />
                                  Strategy
                                </Badge>
                              )}
                              {companyModules.includes('startup-hub') && (
                                <Badge variant="secondary" className="text-xs bg-cofound-green/20 text-cofound-green border-cofound-green/30">
                                  <Rocket className="h-3 w-3 mr-1" />
                                  Startup
                                </Badge>
                              )}
                              {company.ai_enabled && (
                                <Badge variant="secondary" className="text-xs bg-cofound-blue-dark/20 text-cofound-blue-dark border-cofound-blue-dark/30">
                                  <Sparkles className="h-3 w-3 mr-1" />
                                  IA
                                </Badge>
                              )}
                              {!companyModules.includes('strategic-planning') && 
                               !companyModules.includes('startup-hub') && 
                               !company.ai_enabled && (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {format(new Date(company.created_at), "dd/MM/yyyy", { locale: ptBR })}
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
