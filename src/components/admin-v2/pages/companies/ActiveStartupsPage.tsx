import { useState, useMemo } from "react";
import { Rocket, Users, Bot, UserCheck, Eye, Calendar, Search } from "lucide-react";
import { AdminPageContainer } from "../../components/AdminPageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useStartupDetails } from "@/hooks/admin/useStartupHubStats";

export default function ActiveStartupsPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: allStartups, isLoading } = useStartupDetails();

  const activeStartups = useMemo(() => {
    if (!allStartups) return [];
    return allStartups.filter(s => s.status === "active");
  }, [allStartups]);

  const filteredStartups = useMemo(() => {
    if (!activeStartups) return [];
    if (!searchQuery) return activeStartups;
    return activeStartups.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeStartups, searchQuery]);

  const handleNotImplemented = (action: string) => {
    toast({
      title: "Funcionalidade em Desenvolvimento",
      description: `A ação "${action}" será implementada em breve.`,
    });
  };

  return (
    <AdminPageContainer 
      title="Startups Ativas" 
      description="Startups com status ativo no Startup Hub"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-green-500/10 text-green-600">
              <Rocket className="h-3 w-3 mr-1" />
              {filteredStartups.length} startup{filteredStartups.length !== 1 ? "s" : ""} ativa{filteredStartups.length !== 1 ? "s" : ""}
            </Badge>
          </div>
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

        {/* Grid de Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : filteredStartups.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Rocket className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium">Nenhuma startup ativa encontrada</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery ? "Tente uma busca diferente" : "Não há startups ativas no momento"}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStartups.map(startup => (
              <Card key={startup.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={startup.logo_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {startup.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{startup.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        Desde {new Date(startup.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <Badge className="bg-green-500/10 text-green-600 shrink-0">
                      Ativa
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Users className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Membros</p>
                        <p className="font-medium">{startup.members}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        {startup.ai_enabled ? (
                          <Bot className="h-4 w-4 text-purple-600" />
                        ) : (
                          <Bot className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">IA</p>
                        <p className="font-medium">{startup.ai_enabled ? "Sim" : "Não"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Mentor */}
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                    {startup.mentor_name ? (
                      <>
                        <UserCheck className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Mentor: {startup.mentor_name}</span>
                      </>
                    ) : (
                      <>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Sem mentor vinculado</span>
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handleNotImplemented("Ver Perfil")}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Perfil
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminPageContainer>
  );
}
