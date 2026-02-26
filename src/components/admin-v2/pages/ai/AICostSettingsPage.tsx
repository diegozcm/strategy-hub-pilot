import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Settings, Save, RefreshCw, History } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useModelPricing, ModelPricing, usePricingHistory } from "@/hooks/admin/useAIUsageStats";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const AICostSettingsPage = () => {
  const { data: pricing = [], isLoading } = useModelPricing();
  const { data: history = [] } = usePricingHistory();
  const [edits, setEdits] = useState<Record<string, Partial<ModelPricing>>>({});
  const [saving, setSaving] = useState(false);
  const [updatingRate, setUpdatingRate] = useState(false);
  const queryClient = useQueryClient();

  const getVal = (model: string, field: keyof ModelPricing) => {
    if (edits[model] && edits[model][field] !== undefined) return edits[model][field];
    const p = pricing.find((p) => p.model_name === model);
    return p ? p[field] : "";
  };

  const setField = (model: string, field: keyof ModelPricing, value: any) => {
    setEdits((prev) => ({
      ...prev,
      [model]: { ...prev[model], [field]: value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const [model, changes] of Object.entries(edits)) {
        const { error } = await supabase
          .from("ai_model_pricing" as any)
          .update({ ...changes, updated_at: new Date().toISOString() } as any)
          .eq("model_name", model);
        if (error) throw error;
      }
      toast.success("Preços atualizados com sucesso!");
      setEdits({});
      queryClient.invalidateQueries({ queryKey: ["ai-model-pricing"] });
    } catch (err: any) {
      toast.error("Erro ao salvar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRate = async () => {
    setUpdatingRate(true);
    try {
      const { data, error } = await supabase.functions.invoke("update-ai-pricing");
      if (error) throw error;
      toast.success(`Câmbio atualizado! Nova taxa: R$ ${data?.new_rate?.toFixed(4)}`);
      queryClient.invalidateQueries({ queryKey: ["ai-model-pricing"] });
      queryClient.invalidateQueries({ queryKey: ["ai-pricing-history"] });
    } catch (err: any) {
      toast.error("Erro ao atualizar câmbio: " + err.message);
    } finally {
      setUpdatingRate(false);
    }
  };

  if (isLoading) {
    return <div className="p-6 flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  const hasChanges = Object.keys(edits).length > 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="h-6 w-6 text-accent" />
          Custos e Limites
        </h1>
        <div className="flex items-center gap-2">
          <Button onClick={handleUpdateRate} disabled={updatingRate} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${updatingRate ? "animate-spin" : ""}`} />
            {updatingRate ? "Atualizando..." : "Atualizar Câmbio"}
          </Button>
          {hasChanges && (
            <Button onClick={handleSave} disabled={saving} size="sm">
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Preços por Modelo</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Modelo</TableHead>
                <TableHead>Input ($/1M tokens)</TableHead>
                <TableHead>Output ($/1M tokens)</TableHead>
                <TableHead>Taxa USD→BRL</TableHead>
                <TableHead>Atualizado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pricing.map((p) => (
                <TableRow key={p.model_name}>
                  <TableCell className="font-mono text-xs">{p.model_name}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      className="w-24 h-8 text-xs"
                      value={getVal(p.model_name, "input_cost_per_million") as number}
                      onChange={(e) => setField(p.model_name, "input_cost_per_million", parseFloat(e.target.value))}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      className="w-24 h-8 text-xs"
                      value={getVal(p.model_name, "output_cost_per_million") as number}
                      onChange={(e) => setField(p.model_name, "output_cost_per_million", parseFloat(e.target.value))}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      className="w-24 h-8 text-xs"
                      value={getVal(p.model_name, "usd_to_brl_rate") as number}
                      onChange={(e) => setField(p.model_name, "usd_to_brl_rate", parseFloat(e.target.value))}
                    />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(p.updated_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pricing History */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <History className="h-4 w-4" />
              Histórico de Preços
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Input</TableHead>
                  <TableHead>Output</TableHead>
                  <TableHead>Taxa</TableHead>
                  <TableHead>Fonte</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((h: any) => (
                  <TableRow key={h.id}>
                    <TableCell className="font-mono text-xs">{h.model_name}</TableCell>
                    <TableCell className="text-xs">${h.input_cost_per_million}</TableCell>
                    <TableCell className="text-xs">${h.output_cost_per_million}</TableCell>
                    <TableCell className="text-xs">R$ {Number(h.usd_to_brl_rate).toFixed(2)}</TableCell>
                    <TableCell className="text-xs">{h.source}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {h.created_at ? format(new Date(h.created_at), "dd/MM/yy HH:mm", { locale: ptBR }) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AICostSettingsPage;
