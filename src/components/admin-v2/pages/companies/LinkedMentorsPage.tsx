import { useState, useMemo } from "react";
import { UserCheck, Users, Link2, Calendar, Rocket, Mail, Building2, MoreHorizontal, Eye, Unlink, Search } from "lucide-react";
import { AdminPageContainer } from "../../components/AdminPageContainer";
import { StatCard } from "../../components/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useStartupHubStats, useMentors, useMentorLinks } from "@/hooks/admin/useStartupHubStats";

export default function LinkedMentorsPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: stats, isLoading: statsLoading } = useStartupHubStats();
  const { data: mentors, isLoading: mentorsLoading } = useMentors();
  const { data: links, isLoading: linksLoading } = useMentorLinks();

  const filteredMentors = useMemo(() => {
    if (!mentors) return [];
    if (!searchQuery) return mentors;
    return mentors.filter(m => 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [mentors, searchQuery]);

  const filteredLinks = useMemo(() => {
    if (!links) return [];
    if (!searchQuery) return links;
    return links.filter(l => 
      l.mentor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.startup_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [links, searchQuery]);

  const handleNotImplemented = (action: string) => {
    toast({
      title: "Funcionalidade em Desenvolvimento",
      description: `A ação "${action}" será implementada em breve.`,
    });
  };

  const isLoading = statsLoading || mentorsLoading || linksLoading;

  return (
    <AdminPageContainer 
      title="Mentores Vinculados" 
      description="Gestão de mentores e vínculos com startups"
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total de Mentores"
            value={stats?.mentors || 0}
            icon={UserCheck}
            isLoading={isLoading}
          />
          <StatCard
            title="Mentores Ativos"
            value={stats?.activeMentors || 0}
            icon={UserCheck}
            variant="success"
            isLoading={isLoading}
          />
          <StatCard
            title="Vínculos Ativos"
            value={stats?.mentorLinks || 0}
            icon={Link2}
            variant="info"
            isLoading={isLoading}
          />
          <StatCard
            title="Sessões Realizadas"
            value={stats?.completedSessions || 0}
            icon={Calendar}
            isLoading={isLoading}
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="mentors">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <TabsList>
              <TabsTrigger value="mentors">Mentores</TabsTrigger>
              <TabsTrigger value="links">Vínculos Ativos</TabsTrigger>
            </TabsList>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar..."
                className="pl-9"
              />
            </div>
          </div>

          <TabsContent value="mentors">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-primary" />
                  Lista de Mentores ({filteredMentors.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : filteredMentors.length === 0 ? (
                  <div className="text-center py-12">
                    <UserCheck className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium">Nenhum mentor encontrado</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {searchQuery ? "Tente uma busca diferente" : "Não há mentores cadastrados"}
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mentor</TableHead>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Startups Vinculadas</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMentors.map(mentor => (
                        <TableRow key={mentor.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={mentor.avatar_url || undefined} />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {mentor.name.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{mentor.name}</p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {mentor.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {mentor.company_name ? (
                              <div className="flex items-center gap-1">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{mentor.company_name}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Rocket className="h-4 w-4 text-muted-foreground" />
                              <span>{mentor.linkedStartups}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={mentor.status === "active" ? "default" : "secondary"}>
                              {mentor.status === "active" ? "Ativo" : "Inativo"}
                            </Badge>
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
                                <DropdownMenuItem onClick={() => handleNotImplemented("Gerenciar Vínculos")}>
                                  <Link2 className="h-4 w-4 mr-2" />
                                  Gerenciar Vínculos
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
          </TabsContent>

          <TabsContent value="links">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="h-5 w-5 text-primary" />
                  Vínculos Ativos ({filteredLinks.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : filteredLinks.length === 0 ? (
                  <div className="text-center py-12">
                    <Link2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium">Nenhum vínculo ativo</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {searchQuery ? "Tente uma busca diferente" : "Não há vínculos mentor-startup ativos"}
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mentor</TableHead>
                        <TableHead>Startup</TableHead>
                        <TableHead>Data do Vínculo</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLinks.map(link => (
                        <TableRow key={link.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{link.mentor_name}</p>
                              <p className="text-xs text-muted-foreground">{link.mentor_email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Rocket className="h-4 w-4 text-primary" />
                              <span>{link.startup_name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {new Date(link.assigned_at).toLocaleDateString("pt-BR")}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleNotImplemented("Desvincular")}
                            >
                              <Unlink className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminPageContainer>
  );
}
