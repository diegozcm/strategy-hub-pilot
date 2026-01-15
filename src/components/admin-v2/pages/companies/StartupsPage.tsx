import { useState, useMemo } from "react";
import { Rocket, Users, UserCheck, Calendar, MoreHorizontal, Eye, Link2, MessageSquare, Search } from "lucide-react";
import { AdminPageContainer } from "../../components/AdminPageContainer";
import { StatCard } from "../../components/StatCard";
import { StatusBadge } from "../../components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useStartupHubStats, useStartupDetails } from "@/hooks/admin/useStartupHubStats";

export default function StartupsPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: stats, isLoading: statsLoading } = useStartupHubStats();
  const { data: startups, isLoading: startupsLoading } = useStartupDetails();

  const filteredStartups = useMemo(() => {
    if (!startups) return [];
    if (!searchQuery) return startups;
    return startups.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [startups, searchQuery]);

  const handleNotImplemented = (action: string) => {
    toast({
      title: "Funcionalidade em Desenvolvimento",
      description: `A ação "${action}" será implementada em breve.`,
    });
  };

  const isLoading = statsLoading || startupsLoading;

  return (
    <AdminPageContainer 
      title="Startups" 
      description="Gestão de startups do Startup Hub"
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total de Startups"
            value={stats?.totalStartups || 0}
            icon={Rocket}
            isLoading={isLoading}
          />
          <StatCard
            title="Startups Ativas"
            value={stats?.activeStartups || 0}
            icon={Rocket}
            variant="success"
            isLoading={isLoading}
          />
          <StatCard
            title="Membros de Startups"
            value={stats?.startupMembers || 0}
            icon={Users}
            variant="info"
            isLoading={isLoading}
          />
          <StatCard
            title="Sessões de Mentoria"
            value={stats?.totalSessions || 0}
            icon={Calendar}
            isLoading={isLoading}
          />
        </div>

        {/* Lista */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-primary" />
                Lista de Startups
              </CardTitle>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar startup..."
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
            ) : filteredStartups.length === 0 ? (
              <div className="text-center py-12">
                <Rocket className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium">Nenhuma startup encontrada</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery ? "Tente uma busca diferente" : "Não há startups cadastradas"}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Startup</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Membros</TableHead>
                    <TableHead>Mentor Vinculado</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStartups.map(startup => (
                    <TableRow key={startup.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={startup.logo_url || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {startup.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{startup.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Desde {new Date(startup.created_at).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={startup.status === "active" ? "active" : "inactive"} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{startup.members}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {startup.mentor_name ? (
                          <div className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-green-600" />
                            <span className="text-sm">{startup.mentor_name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Não vinculado</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleNotImplemented("Ver Perfil")}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Perfil
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleNotImplemented("Vincular Mentor")}>
                              <Link2 className="h-4 w-4 mr-2" />
                              Vincular Mentor
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleNotImplemented("Ver Sessões")}>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Ver Sessões
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
    </AdminPageContainer>
  );
}
