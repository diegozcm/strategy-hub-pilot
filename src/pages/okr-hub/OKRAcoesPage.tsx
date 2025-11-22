import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, CheckCircle2, Circle } from "lucide-react";
import { OKRYearSelector } from "@/components/okr-planning/OKRYearSelector";
import { useOKRYears } from "@/hooks/useOKRYears";
import { useOKRObjectives } from "@/hooks/useOKRObjectives";
import { useOKRPermissions } from "@/hooks/useOKRPermissions";
import { useAuth } from "@/hooks/useAuth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function OKRAcoesPage() {
  const { company } = useAuth();
  const { currentYear, loading: yearsLoading } = useOKRYears();
  const { objectives, loading: objectivesLoading, fetchObjectives } = useOKRObjectives(null);
  const { canCreateAction } = useOKRPermissions();

  const [selectedObjectiveId, setSelectedObjectiveId] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  useEffect(() => {
    if (currentYear?.id && company?.id) {
      fetchObjectives();
    }
  }, [currentYear?.id, company?.id, fetchObjectives]);

  // Flatten all actions from all KRs from all objectives
  const allActions = objectives.flatMap(obj => 
    (obj.key_results || []).flatMap(kr => 
      (kr.actions || []).map(action => ({
        ...action,
        kr: kr,
        objective: obj
      }))
    )
  );

  const filteredActions = allActions.filter(action => {
    const matchesObjective = selectedObjectiveId === "all" || action.objective.id === selectedObjectiveId;
    const matchesStatus = selectedStatus === "all" || action.status === selectedStatus;
    return matchesObjective && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500";
      case "in_progress": return "bg-blue-500";
      case "cancelled": return "bg-red-500";
      default: return "bg-gray-400";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed": return "Concluída";
      case "in_progress": return "Em Andamento";
      case "cancelled": return "Cancelada";
      default: return "Pendente";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "destructive";
      case "medium": return "default";
      default: return "secondary";
    }
  };

  if (!company) {
    return (
      <div className="p-8">
        <div className="text-center text-muted-foreground">
          Selecione uma empresa para continuar
        </div>
      </div>
    );
  }

  const loading = yearsLoading || objectivesLoading;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ações</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie todas as ações vinculadas aos resultados-chave
          </p>
        </div>
      </div>

      {/* Year Selector */}
      <OKRYearSelector />

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Filtrar por Objetivo</Label>
          <Select value={selectedObjectiveId} onValueChange={setSelectedObjectiveId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Objetivos</SelectItem>
              {objectives.map((obj) => (
                <SelectItem key={obj.id} value={obj.id}>
                  {obj.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Filtrar por Status</Label>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="in_progress">Em Andamento</SelectItem>
              <SelectItem value="completed">Concluída</SelectItem>
              <SelectItem value="cancelled">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          Carregando ações...
        </div>
      ) : !currentYear ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            Nenhum ano OKR foi criado ainda
          </p>
        </div>
      ) : objectives.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            Crie objetivos e KRs primeiro para poder criar ações
          </p>
        </div>
      ) : filteredActions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            Nenhuma ação encontrada com os filtros selecionados
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredActions.map((action) => (
            <Card key={action.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {action.status === "completed" ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className={cn(
                      "font-semibold",
                      action.status === "completed" && "line-through text-muted-foreground"
                    )}>
                      {action.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <span>KR: {action.kr.title}</span>
                      <span>•</span>
                      <span>{action.objective.title}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={getPriorityColor(action.priority)}>
                      {action.priority}
                    </Badge>
                    <div className={cn(
                      "px-2 py-1 rounded-full text-xs text-white",
                      getStatusColor(action.status)
                    )}>
                      {getStatusLabel(action.status)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              {action.description && (
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                  {action.due_date && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Prazo: {new Date(action.due_date).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                  {action.assigned_user && (
                    <p className="text-xs text-muted-foreground">
                      Responsável: {action.assigned_user.first_name} {action.assigned_user.last_name}
                    </p>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
