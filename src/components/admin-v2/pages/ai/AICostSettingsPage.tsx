import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Settings, Save } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useModelPricing, ModelPricing } from "@/hooks/admin/useAIUsageStats";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const AICostSettingsPage = () => {
  const { data: pricing = [], isLoading } = useModelPricing();
  const [edits, setEdits] = useState<Record<string, Partial<ModelPricing>>>({});
  const [saving, setSaving] = useState(false);
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
        {hasChanges && (
          <Button onClick={handleSave} disabled={saving} size="sm">
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        )}
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AICostSettingsPage;
