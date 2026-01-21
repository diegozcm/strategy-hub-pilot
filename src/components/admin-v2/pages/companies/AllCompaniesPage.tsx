import { useState, useMemo } from "react";
import { Users, CheckCircle, XCircle, Search, MoreHorizontal, Eye, Building2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AdminPageContainer } from "../../components/AdminPageContainer";
import { StatCard } from "../../components/StatCard";
import { StatusBadge } from "../../components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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

export default function AllCompaniesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<CompanyWithDetails | null>(null);
  const [modalType, setModalType] = useState<ModalType>(null);

  const { data: companies, isLoading, refetch } = useQuery({
    queryKey: ["admin-all-companies"],
    queryFn: async (): Promise<CompanyWithDetails[]> => {
      const { data: companiesData, error } = await supabase
        .from("companies")
        .select("id, name, company_type, status, ai_enabled, created_at, logo_url")
        .order("name");

      if (error) throw error;

      const { data: profiles } = await supabase
        .from("profiles")
        .select("company_id");

      const userCounts: Record<string, number> = {};
      profiles?.forEach(p => {
        if (p.company_id) {
          userCounts[p.company_id] = (userCounts[p.company_id] || 0) + 1;
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
    if (!searchQuery) return companies;
    return companies.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [companies, searchQuery]);

  const stats = useMemo(() => {
    if (!companies) return { total: 0, active: 0, inactive: 0, totalUsers: 0 };
    return {
      total: companies.length,
      active: companies.filter(c => c.status === "active").length,
      inactive: companies.filter(c => c.status !== "active").length,
      totalUsers: companies.reduce((acc, c) => acc + c.userCount, 0),
    };
  }, [companies]);

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
      title="Todas as Empresas" 
      description="Visão geral de todas as empresas cadastradas"
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total de Empresas"
            value={stats.total}
            icon={Building2}
            isLoading={isLoading}
          />
          <StatCard
            title="Empresas Ativas"
            value={stats.active}
            icon={CheckCircle}
            variant="success"
            isLoading={isLoading}
          />
          <StatCard
            title="Empresas Inativas"
            value={stats.inactive}
            icon={XCircle}
            variant="warning"
            isLoading={isLoading}
          />
          <StatCard
            title="Total de Usuários"
            value={stats.totalUsers}
            icon={Users}
            variant="info"
            isLoading={isLoading}
          />
        </div>

        {/* Lista */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle>Lista de Empresas</CardTitle>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar empresa..."
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredCompanies.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium">Nenhuma empresa encontrada</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery ? "Tente uma busca diferente" : "Crie a primeira empresa"}
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
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.map(company => (
                    <TableRow key={company.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={company.logo_url || undefined} alt={company.name} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {company.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{company.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Criada em {new Date(company.created_at).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
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
                          <span>{company.userCount}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenDetails(company)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalhes
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
