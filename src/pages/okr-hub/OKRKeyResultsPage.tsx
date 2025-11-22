import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { OKRYearSelector } from "@/components/okr-planning/OKRYearSelector";
import { useOKRYears } from "@/hooks/useOKRYears";
import { useOKRObjectives } from "@/hooks/useOKRObjectives";
import { useOKRPermissions } from "@/hooks/useOKRPermissions";
import { useAuth } from "@/hooks/useMultiTenant";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export function OKRKeyResultsPage() {
  const { company } = useAuth();
  const { years, currentYear, setCurrentYear, loading: yearsLoading } = useOKRYears();
  const { objectives, loading: objectivesLoading, fetchObjectives } = useOKRObjectives();
  const { canCreateKeyResult } = useOKRPermissions();

  const [selectedObjectiveId, setSelectedObjectiveId] = useState<string>("all");
  const [selectedQuarter, setSelectedQuarter] = useState<string>("all");

  useEffect(() => {
    if (currentYear?.id && company?.id) {
      fetchObjectives();
    }
  }, [currentYear?.id, company?.id, fetchObjectives]);

  // Flatten all KRs from all objectives
  const allKRs = objectives.flatMap(obj => 
    (obj.key_results || []).map(kr => ({
      ...kr,
      objective: obj
    }))
  );

  const filteredKRs = allKRs.filter(kr => {
    const matchesObjective = selectedObjectiveId === "all" || kr.objective.id === selectedObjectiveId;
    const matchesQuarter = selectedQuarter === "all" || 
      (selectedQuarter === "none" && !kr.quarter) ||
      kr.quarter?.toString() === selectedQuarter;
    return matchesObjective && matchesQuarter;
  });

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
          <h1 className="text-3xl font-bold">Resultados-chave (KRs)</h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe os resultados-chave de todos os objetivos
          </p>
        </div>
      </div>

      {/* Year Selector */}
      <OKRYearSelector 
        years={years}
        currentYear={currentYear}
        onYearChange={setCurrentYear}
        loading={yearsLoading}
      />

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
          <Label>Filtrar por Trimestre</Label>
          <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Trimestres</SelectItem>
              <SelectItem value="none">Sem Trimestre</SelectItem>
              <SelectItem value="1">Q1 (Jan-Mar)</SelectItem>
              <SelectItem value="2">Q2 (Abr-Jun)</SelectItem>
              <SelectItem value="3">Q3 (Jul-Set)</SelectItem>
              <SelectItem value="4">Q4 (Out-Dez)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          Carregando resultados-chave...
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
            Crie objetivos primeiro para poder criar KRs
          </p>
        </div>
      ) : filteredKRs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            Nenhum resultado-chave encontrado com os filtros selecionados
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredKRs.map((kr) => (
            <Card key={kr.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{kr.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {kr.objective.title}
                    </p>
                  </div>
                  {kr.quarter && (
                    <Badge variant="outline">Q{kr.quarter}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {kr.description && (
                  <p className="text-sm text-muted-foreground">{kr.description}</p>
                )}

                {kr.tracking_type === "numeric" ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Inicial: {kr.initial_value} {kr.unit}</span>
                      <span>Atual: {kr.current_value} {kr.unit}</span>
                      <span>Meta: {kr.target_value} {kr.unit}</span>
                    </div>
                    <Progress value={kr.progress_percentage || 0} />
                    <p className="text-xs text-center text-muted-foreground">
                      {kr.progress_percentage?.toFixed(1)}% concluído
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Checklist</span>
                      <span>{kr.checklist_completed}/{kr.checklist_total} itens</span>
                    </div>
                    <Progress value={kr.progress_percentage || 0} />
                    <p className="text-xs text-center text-muted-foreground">
                      {kr.progress_percentage?.toFixed(1)}% concluído
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Badge variant={kr.status === "on_track" ? "default" : "secondary"}>
                    {kr.status}
                  </Badge>
                  {kr.owner && (
                    <span className="text-xs text-muted-foreground">
                      Owner: {kr.owner.first_name} {kr.owner.last_name}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
