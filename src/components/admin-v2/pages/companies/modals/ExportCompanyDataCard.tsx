import { useState } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Upload, Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ExportCompanyDataCardProps {
  companyId: string;
  companyName: string;
}

export function ExportCompanyDataCard({ companyId, companyName }: ExportCompanyDataCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setShowConfirm(false);
    setIsExporting(true);

    try {
      const { data, error } = await supabase.functions.invoke("export-company-data", {
        body: { company_id: companyId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (!data?.data || Object.keys(data.data).length === 0) {
        toast.info("Nenhum dado encontrado para exportar.");
        return;
      }

      // Download as JSON — preserves JSONB fields natively
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const safeName = companyName.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 30);
      const fileName = `export_${safeName}_${new Date().toISOString().split("T")[0]}.json`;

      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const tableCount = Object.values(data.data as Record<string, unknown[]>).filter(
        (rows) => Array.isArray(rows) && rows.length > 0
      ).length;

      toast.success(`Exportação concluída! ${data.total_records} registros em ${tableCount} tabelas.`);
    } catch (err: any) {
      console.error("Export error:", err);
      toast.error(err.message || "Erro ao exportar dados da empresa.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <Card
        className={`cursor-pointer hover:bg-muted/50 transition-colors border-cofound-blue-light/30 ${
          isExporting ? "opacity-60 pointer-events-none" : ""
        }`}
        onClick={() => !isExporting && setShowConfirm(true)}
      >
        <CardHeader className="p-4">
          <CardTitle className="text-base flex items-center gap-2">
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin text-cofound-blue-light" />
            ) : (
              <Upload className="h-4 w-4 text-cofound-blue-light" />
            )}
            {isExporting ? "Exportando..." : "Exportar Todos os Dados"}
          </CardTitle>
          <CardDescription>
            {isExporting
              ? "Aguarde enquanto todos os dados são coletados..."
              : "Exportar todos os dados da empresa em formato JSON"}
          </CardDescription>
        </CardHeader>
      </Card>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-cofound-blue-light" />
              Confirmar Exportação de Dados
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Você está prestes a exportar <strong>todos os dados</strong> da empresa{" "}
                <strong>{companyName}</strong>.
              </p>
              <p>
                Isso inclui informações estratégicas, OKRs, projetos, governança, sessões de
                mentoria, dados de IA e mais.
              </p>
              <p className="text-xs text-muted-foreground">
                Esta ação será registrada no log de auditoria do sistema.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleExport}>
              <Upload className="h-4 w-4 mr-2" />
              Confirmar Exportação
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
