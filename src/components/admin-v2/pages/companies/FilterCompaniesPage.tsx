import { useState, useMemo } from "react";
import { Search, Filter, X, Building2, Users, Bot } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AdminPageContainer } from "../../components/AdminPageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { StatusBadge } from "../../components/StatusBadge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { CompanyDetailsModal } from "./modals";

interface CompanyWithDetails {
  id: string;
  name: string;
  company_type: string | null;
  status: string | null;
  ai_enabled: boolean;
  created_at: string;
  logo_url: string | null;
  userCount: number;
}

type ModalType = 'details' | null;

export default function FilterCompaniesPage() {
  const [filters, setFilters] = useState({
    search: "",
    type: "all",
    status: "all",
    aiEnabled: "all",
  });
  const [selectedCompany, setSelectedCompany] = useState<CompanyWithDetails | null>(null);
  const [modalType, setModalType] = useState<ModalType>(null);

  const { data: companies, isLoading, refetch } = useQuery({
    queryKey: ["admin-companies-filter"],
    queryFn: async (): Promise<CompanyWithDetails[]> => {
      const { data: companiesData, error } = await supabase
        .from("companies")
        .select("id, name, company_type, status, ai_enabled, created_at, logo_url")
        .order("name");

      if (error) throw error;

      // Fetch user counts via user_company_relations (source of truth)
      const { data: relations } = await supabase
        .from("user_company_relations")
        .select("company_id");

      const userCounts: Record<string, number> = {};
      relations?.forEach(r => {
        if (r.company_id) {
          userCounts[r.company_id] = (userCounts[r.company_id] || 0) + 1;
        }
      });

      return (companiesData || []).map(c => ({
        ...c,
        userCount: userCounts[c.id] || 0,
      }));
    },
    staleTime: 60 * 1000,
  });

  const filteredCompanies = useMemo(() => {
    if (!companies) return [];

    return companies.filter(company => {
      // Search filter
      if (filters.search && !company.name.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      // Type filter
      if (filters.type !== "all" && company.company_type !== filters.type) {
        return false;
      }

      // Status filter
      if (filters.status !== "all" && company.status !== filters.status) {
        return false;
      }

      // AI filter
      if (filters.aiEnabled !== "all") {
        const hasAI = filters.aiEnabled === "true";
        if (company.ai_enabled !== hasAI) {
          return false;
        }
      }

      return true;
    });
  }, [companies, filters]);

  const clearFilters = () => {
    setFilters({
      search: "",
      type: "all",
      status: "all",
      aiEnabled: "all",
    });
  };

  const hasActiveFilters = filters.search || filters.type !== "all" || filters.status !== "all" || filters.aiEnabled !== "all";

  const handleOpenDetails = (company: CompanyWithDetails) => {
    setSelectedCompany(company);
    setModalType('details');
  };

  const handleCloseModal = () => {
    setModalType(null);
    setSelectedCompany(null);
  };

  const handleSuccess = () => {
    refetch();
    handleCloseModal();
  };

  return (
    <AdminPageContainer 
      title="Filtrar Empresas" 
      description="Busca avançada de empresas no sistema"
    >
      <div className="space-y-6">
        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros de Busca
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Buscar por Nome</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Nome da empresa..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select 
                  value={filters.type} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Tipos</SelectItem>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="startup">Startup</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={filters.status} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>IA Copilot</Label>
                <Select 
                  value={filters.aiEnabled} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, aiEnabled: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="true">Habilitado</SelectItem>
                    <SelectItem value="false">Desabilitado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                <span className="text-sm text-muted-foreground">Filtros ativos:</span>
                {filters.search && (
                  <Badge variant="secondary">Nome: {filters.search}</Badge>
                )}
                {filters.type !== "all" && (
                  <Badge variant="secondary">Tipo: {filters.type}</Badge>
                )}
                {filters.status !== "all" && (
                  <Badge variant="secondary">Status: {filters.status}</Badge>
                )}
                {filters.aiEnabled !== "all" && (
                  <Badge variant="secondary">IA: {filters.aiEnabled === "true" ? "Sim" : "Não"}</Badge>
                )}
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Limpar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resultados */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Resultados
              </CardTitle>
              <Badge variant="outline">
                {filteredCompanies.length} empresa{filteredCompanies.length !== 1 ? "s" : ""}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredCompanies.length === 0 ? (
              <div className="text-center py-12">
                <Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium">Nenhuma empresa encontrada</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Tente ajustar os filtros de busca
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Usuários</TableHead>
                    <TableHead>IA</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.map(company => (
                    <TableRow key={company.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleOpenDetails(company)}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={company.logo_url || undefined} alt={company.name} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {company.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{company.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {company.company_type === "startup" ? "Startup" : "Regular"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={company.status === "active" ? "active" : "inactive"} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {company.userCount}
                        </div>
                      </TableCell>
                      <TableCell>
                        {company.ai_enabled ? (
                          <Bot className="h-4 w-4 text-primary" />
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {modalType === 'details' && selectedCompany && (
        <CompanyDetailsModal
          open={true}
          onOpenChange={handleCloseModal}
          company={selectedCompany}
          onSuccess={handleSuccess}
        />
      )}
    </AdminPageContainer>
  );
}
