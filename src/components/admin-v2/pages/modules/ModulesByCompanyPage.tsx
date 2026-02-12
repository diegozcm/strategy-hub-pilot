import { useState } from "react";
import { AdminPageContainer } from "../../components/AdminPageContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Building2, CheckCircle, XCircle, Edit } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface CompanyModuleData {
  id: string;
  name: string;
  status: string;
  modules: {
    strategic: { enabled: boolean; userCount: number };
    startup: { enabled: boolean; userCount: number };
    ai: { enabled: boolean; userCount: number };
  };
}

export default function ModulesByCompanyPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["modules-by-company"],
    queryFn: async (): Promise<CompanyModuleData[]> => {
      // Get all companies with company_type
      const { data: companies, error: companiesError } = await supabase
        .from("companies")
        .select("id, name, status, ai_enabled, company_type")
        .order("name");

      if (companiesError) throw companiesError;

      // Get system modules
      const { data: modules } = await supabase
        .from("system_modules")
        .select("id, slug");

      const moduleMap: Record<string, string> = {};
      modules?.forEach(m => {
        moduleMap[m.slug] = m.id;
      });

      // Get user_module_roles
      const { data: roles } = await supabase
        .from("user_module_roles")
        .select("user_id, module_id");

      // Get profiles for user-company mapping
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, company_id");

      const userToCompany: Record<string, string> = {};
      profiles?.forEach(p => {
        if (p.user_id && p.company_id) userToCompany[p.user_id] = p.company_id;
      });

      // Get startup_hub_profiles to check which companies have startup hub access
      const { data: startupProfiles } = await supabase
        .from("startup_hub_profiles")
        .select("user_id");

      // Map companies that have users with startup_hub_profiles
      const companiesWithStartupHub = new Set<string>();
      startupProfiles?.forEach(sp => {
        const companyId = userToCompany[sp.user_id];
        if (companyId) companiesWithStartupHub.add(companyId);
      });

      // Calculate module usage per company
      const companyModules: Record<string, Record<string, Set<string>>> = {};

      roles?.forEach(role => {
        const companyId = userToCompany[role.user_id];
        if (companyId) {
          if (!companyModules[companyId]) companyModules[companyId] = {};
          if (!companyModules[companyId][role.module_id]) {
            companyModules[companyId][role.module_id] = new Set();
          }
          companyModules[companyId][role.module_id].add(role.user_id);
        }
      });

      return companies?.map(company => {
        const companyRoles = companyModules[company.id] || {};
        
        const strategicModuleId = moduleMap["strategic-planning"];
        const startupModuleId = moduleMap["startup-hub"];
        const aiModuleId = moduleMap["ai"];

        // Startup Hub is enabled if:
        // 1. Company is of type 'startup', OR
        // 2. Company has users with startup_hub_profiles (e.g., mentors), OR
        // 3. Company has users with startup-hub module roles
        const isStartupCompany = company.company_type === 'startup';
        const hasStartupProfiles = companiesWithStartupHub.has(company.id);
        const hasStartupModuleRoles = startupModuleId ? (companyRoles[startupModuleId]?.size || 0) > 0 : false;
        const startupEnabled = isStartupCompany || hasStartupProfiles || hasStartupModuleRoles;

        // Count users for startup module (from module roles or estimate from profiles)
        const startupUserCount = startupModuleId ? companyRoles[startupModuleId]?.size || 0 : 0;

        return {
          id: company.id,
          name: company.name,
          status: company.status || "active",
          modules: {
            strategic: {
              enabled: strategicModuleId ? (companyRoles[strategicModuleId]?.size || 0) > 0 : false,
              userCount: strategicModuleId ? companyRoles[strategicModuleId]?.size || 0 : 0,
            },
            startup: {
              enabled: startupEnabled,
              userCount: startupUserCount,
            },
            ai: {
              enabled: company.ai_enabled,
              userCount: aiModuleId ? companyRoles[aiModuleId]?.size || 0 : 0,
            },
          },
        };
      }) || [];
    },
  });

  const handleEdit = (companyId: string) => {
    toast({
      title: "Em Desenvolvimento",
      description: "Edição de módulos será implementada em breve.",
    });
  };

  // Filter data
  const filteredData = data?.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesModule = true;
    if (moduleFilter === "strategic") matchesModule = company.modules.strategic.enabled;
    else if (moduleFilter === "startup") matchesModule = company.modules.startup.enabled;
    else if (moduleFilter === "ai") matchesModule = company.modules.ai.enabled;
    else if (moduleFilter === "none") {
      matchesModule = !company.modules.strategic.enabled && 
                      !company.modules.startup.enabled && 
                      !company.modules.ai.enabled;
    }

    return matchesSearch && matchesModule;
  });

  return (
    <AdminPageContainer
      title="Módulos por Empresa"
      description="Visualize quais módulos estão ativos em cada empresa"
    >
      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar empresa..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={moduleFilter} onValueChange={setModuleFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filtrar por módulo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Módulos</SelectItem>
                  <SelectItem value="strategic">Strategy HUB</SelectItem>
                  <SelectItem value="startup">Startup Hub</SelectItem>
                  <SelectItem value="ai">Atlas Hub</SelectItem>
                  <SelectItem value="none">Sem Módulos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Matriz Empresa × Módulos
            </CardTitle>
            <CardDescription>
              {filteredData?.length || 0} empresas encontradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !filteredData || filteredData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma empresa encontrada com os filtros selecionados.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead className="text-center">Strategy HUB</TableHead>
                    <TableHead className="text-center">Startup Hub</TableHead>
                    <TableHead className="text-center">Atlas Hub</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map(company => (
                    <TableRow key={company.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{company.name}</span>
                          {company.status !== "active" && (
                            <Badge variant="secondary" className="text-xs">Inativa</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {company.modules.strategic.enabled ? (
                          <Badge variant="cofound-info">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {company.modules.strategic.userCount}
                          </Badge>
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {company.modules.startup.enabled ? (
                          <Badge variant="cofound-success">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {company.modules.startup.userCount}
                          </Badge>
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {company.modules.ai.enabled ? (
                          <Badge variant="cofound-primary">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Sim
                          </Badge>
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(company.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Legend */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="cofound-info">
                  <CheckCircle className="h-3 w-3 mr-1" />N
                </Badge>
                <span className="text-muted-foreground">Módulo ativo, N usuários</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Não habilitado</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminPageContainer>
  );
}
