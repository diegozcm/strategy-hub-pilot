import { useState, useMemo } from "react";
import { Users, XCircle, Search, AlertCircle, Building2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AdminPageContainer } from "../../components/AdminPageContainer";
import { StatCard } from "../../components/StatCard";
import { StatusBadge } from "../../components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

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

export default function InactiveCompaniesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<CompanyWithDetails | null>(null);
  const [modalType, setModalType] = useState<ModalType>(null);

  const { data: companies, isLoading, refetch } = useQuery({
    queryKey: ["admin-inactive-companies"],
    queryFn: async (): Promise<CompanyWithDetails[]> => {
      const { data: companiesData, error } = await supabase
        .from("companies")
        .select("id, name, company_type, status, ai_enabled, created_at, logo_url")
        .eq("status", "inactive")
        .order("name");

      if (error) throw error;

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
    if (!searchQuery) return companies;
    return companies.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [companies, searchQuery]);

  const stats = useMemo(() => {
    if (!companies) return { total: 0, startups: 0, regular: 0, totalUsers: 0 };
    return {
      total: companies.length,
      startups: companies.filter(c => c.company_type === "startup").length,
      regular: companies.filter(c => c.company_type !== "startup").length,
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
      title="Empresas Inativas" 
      description="Empresas desativadas no sistema"
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Empresas Inativas"
            value={stats.total}
            icon={XCircle}
            variant="warning"
            isLoading={isLoading}
          />
          <StatCard
            title="Startups"
            value={stats.startups}
            icon={Building2}
            isLoading={isLoading}
          />
          <StatCard
            title="Regulares"
            value={stats.regular}
            icon={Building2}
            isLoading={isLoading}
          />
          <StatCard
            title="Usuários Afetados"
            value={stats.totalUsers}
            icon={Users}
            variant="danger"
            isLoading={isLoading}
          />
        </div>

        {/* Lista */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-yellow-600" />
                Empresas Inativas ({filteredCompanies.length})
              </CardTitle>
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
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredCompanies.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <h3 className="text-lg font-medium">Nenhuma empresa inativa</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Todas as empresas estão ativas no momento
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.map(company => (
                    <TableRow key={company.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleOpenDetails(company)}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={company.logo_url || undefined} alt={company.name} />
                            <AvatarFallback className="bg-yellow-500/10 text-yellow-600">
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
                        <StatusBadge status="inactive" />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{company.userCount}</span>
                        </div>
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
