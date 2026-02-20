import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
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
import {
  Upload,
  Download,
  FileSpreadsheet,
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Plus,
  Replace,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface ImportCompanyDataModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  companyName: string;
  onSuccess: () => void;
}

type ImportMode = "merge" | "replace";
type Step = "upload" | "summary" | "mode" | "confirm" | "progress" | "result";

interface ParsedData {
  tables: Record<string, unknown[]>;
  sourceCompanyName: string;
  sourceCompanyId: string;
  totalRecords: number;
  tablesSummary: Array<{ name: string; count: number }>;
}

interface ImportResult {
  success: boolean;
  total_records: number;
  tables_imported: string[];
  results: Record<string, { inserted: number; errors: string[] }>;
  errors: Array<{ table: string; error: string }>;
}

const TABLE_LABELS: Record<string, string> = {
  companies: "Empresa",
  strategic_plans: "Planos Estratégicos",
  strategic_pillars: "Pilares Estratégicos",
  strategic_objectives: "Objetivos Estratégicos",
  key_results: "Key Results",
  key_result_values: "Valores de KR",
  key_results_history: "Histórico de KRs",
  kr_fca: "FCAs",
  kr_monthly_actions: "Ações Mensais",
  kr_actions_history: "Histórico de Ações",
  kr_status_reports: "Relatórios de Status",
  kr_initiatives: "Iniciativas",
  golden_circle: "Golden Circle",
  golden_circle_history: "Histórico Golden Circle",
  swot_analysis: "Análise SWOT",
  swot_history: "Histórico SWOT",
  vision_alignment: "Alinhamento de Visão",
  vision_alignment_history: "Histórico Alinhamento",
  vision_alignment_objectives: "Objetivos de Alinhamento",
  vision_alignment_removed_dupes: "Duplicatas Removidas",
  governance_meetings: "Reuniões",
  governance_agenda_items: "Itens de Pauta",
  governance_atas: "Atas",
  governance_rules: "Regras de Governança",
  governance_rule_items: "Itens de Regras",
  governance_rule_documents: "Documentos de Regras",
  strategic_projects: "Projetos Estratégicos",
  project_members: "Membros de Projetos",
  project_tasks: "Tarefas de Projetos",
  project_kr_relations: "Relações Projeto-KR",
  project_objective_relations: "Relações Projeto-Objetivo",
  company_module_settings: "Configurações de Módulos",
  beep_assessments: "Avaliações BEEP",
  beep_answers: "Respostas BEEP",
};

export function ImportCompanyDataModal({
  open,
  onOpenChange,
  companyId,
  companyName,
  onSuccess,
}: ImportCompanyDataModalProps) {
  const [step, setStep] = useState<Step>("upload");
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>("merge");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setStep("upload");
    setParsedData(null);
    setImportMode("merge");
    setShowConfirmDialog(false);
    setIsImporting(false);
    setProgressPercent(0);
    setProgressMessage("");
    setImportResult(null);
  }, []);

  const handleClose = () => {
    if (!isImporting) {
      resetState();
      onOpenChange(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".xlsx")) {
      toast.error("Apenas arquivos .xlsx são aceitos.");
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });

      const tables: Record<string, unknown[]> = {};
      let totalRecords = 0;
      const tablesSummary: Array<{ name: string; count: number }> = [];

      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet) as Array<Record<string, unknown>>;
        if (rows.length > 0) {
          // Deserialize JSON strings back to objects/arrays
          const deserializedRows = rows.map((row) => {
            const newRow: Record<string, unknown> = {};
            for (const [key, value] of Object.entries(row)) {
              if (typeof value === "string") {
                const trimmed = value.trim();
                if (
                  (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
                  (trimmed.startsWith("[") && trimmed.endsWith("]"))
                ) {
                  try {
                    newRow[key] = JSON.parse(trimmed);
                  } catch {
                    newRow[key] = value;
                  }
                } else {
                  newRow[key] = value;
                }
              } else {
                newRow[key] = value;
              }
            }
            return newRow;
          });
          tables[sheetName] = deserializedRows;
          totalRecords += deserializedRows.length;
          tablesSummary.push({ name: sheetName, count: deserializedRows.length });
        }
      }

      // Extract source company info
      const companyRows = tables.companies as Array<Record<string, unknown>> | undefined;
      const sourceCompanyName = (companyRows?.[0]?.name as string) || "Desconhecida";
      const sourceCompanyId = (companyRows?.[0]?.id as string) || "unknown";

      setParsedData({
        tables,
        sourceCompanyName,
        sourceCompanyId,
        totalRecords,
        tablesSummary: tablesSummary.sort((a, b) => b.count - a.count),
      });
      setStep("summary");
    } catch (err) {
      console.error("Error parsing XLSX:", err);
      toast.error("Erro ao ler o arquivo XLSX.");
    }
  };

  const handleStartImport = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmImport = async () => {
    setShowConfirmDialog(false);
    setStep("progress");
    setIsImporting(true);
    setProgressPercent(10);
    setProgressMessage("Enviando dados para o servidor...");

    try {
      setProgressPercent(30);
      setProgressMessage("Processando importação...");

      const { data, error } = await supabase.functions.invoke("import-company-data", {
        body: {
          company_id: companyId,
          mode: importMode,
          data: parsedData!.tables,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setProgressPercent(100);
      setProgressMessage("Importação concluída!");
      setImportResult(data as ImportResult);

      // Short delay before showing results
      await new Promise((r) => setTimeout(r, 500));
      setStep("result");
      setIsImporting(false);
      onSuccess();
    } catch (err: any) {
      console.error("Import error:", err);
      setIsImporting(false);
      setImportResult({
        success: false,
        total_records: 0,
        tables_imported: [],
        results: {},
        errors: [{ table: "general", error: err.message || "Erro desconhecido" }],
      });
      setStep("result");
    }
  };

  const renderUploadStep = () => (
    <div className="space-y-6 py-4">
      <div
        className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-lg font-medium">Selecione um arquivo XLSX</p>
        <p className="text-sm text-muted-foreground mt-1">
          Arquivo gerado pela exportação de dados de empresa
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );

  const renderSummaryStep = () => {
    if (!parsedData) return null;
    return (
      <div className="space-y-4 py-4">
        <div className="p-4 rounded-lg bg-muted/50 space-y-2">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-cofound-blue-light" />
            <span className="font-medium">Empresa de origem:</span>
            <span>{parsedData.sourceCompanyName}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Total de registros:</span>
            <Badge variant="secondary">{parsedData.totalRecords}</Badge>
          </div>
        </div>

        <div className="max-h-60 overflow-y-auto space-y-1">
          {parsedData.tablesSummary.map(({ name, count }) => (
            <div key={name} className="flex items-center justify-between py-1.5 px-3 rounded bg-muted/30">
              <span className="text-sm">{TABLE_LABELS[name] || name}</span>
              <Badge variant="outline" className="text-xs">{count}</Badge>
            </div>
          ))}
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={() => { resetState(); }}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <Button variant="cofound" onClick={() => setStep("mode")}>
            Próximo
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  };

  const renderModeStep = () => (
    <div className="space-y-6 py-4">
      <p className="text-sm text-muted-foreground">
        Escolha como os dados serão importados para <strong>{companyName}</strong>:
      </p>

      <RadioGroup
        value={importMode}
        onValueChange={(v) => setImportMode(v as ImportMode)}
        className="space-y-4"
      >
        <div className="flex items-start space-x-3 p-4 rounded-lg border border-muted hover:border-primary/50 transition-colors">
          <RadioGroupItem value="merge" id="merge" className="mt-1" />
          <Label htmlFor="merge" className="cursor-pointer space-y-1">
            <div className="flex items-center gap-2 font-medium">
              <Plus className="h-4 w-4 text-cofound-green" />
              Adicionar aos dados existentes
            </div>
            <p className="text-sm text-muted-foreground font-normal">
              Insere os novos registros sem alterar os dados já existentes na empresa destino.
            </p>
          </Label>
        </div>

        <div className="flex items-start space-x-3 p-4 rounded-lg border border-destructive/30 hover:border-destructive/60 transition-colors">
          <RadioGroupItem value="replace" id="replace" className="mt-1" />
          <Label htmlFor="replace" className="cursor-pointer space-y-1">
            <div className="flex items-center gap-2 font-medium">
              <Replace className="h-4 w-4 text-destructive" />
              Substituir todos os dados
            </div>
            <p className="text-sm text-muted-foreground font-normal">
              <strong className="text-destructive">Ação destrutiva:</strong> apaga todos os dados estratégicos e operacionais da empresa antes de inserir os novos.
            </p>
          </Label>
        </div>
      </RadioGroup>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={() => setStep("summary")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <Button variant="cofound" onClick={handleStartImport}>
          Iniciar Importação
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderProgressStep = () => (
    <div className="space-y-6 py-8 text-center">
      <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
      <div className="space-y-2">
        <p className="font-medium">{progressMessage}</p>
        <Progress value={progressPercent} className="w-full" />
        <p className="text-sm text-muted-foreground">{progressPercent}%</p>
      </div>
    </div>
  );

  const renderResultStep = () => {
    if (!importResult) return null;
    const hasErrors = importResult.errors.length > 0;

    return (
      <div className="space-y-4 py-4">
        <div className={`p-4 rounded-lg flex items-center gap-3 ${hasErrors ? "bg-destructive/10" : "bg-cofound-green/10"}`}>
          {hasErrors ? (
            <XCircle className="h-6 w-6 text-destructive" />
          ) : (
            <CheckCircle2 className="h-6 w-6 text-cofound-green" />
          )}
          <div>
            <p className="font-medium">
              {hasErrors ? "Importação concluída com erros" : "Importação concluída com sucesso!"}
            </p>
            <p className="text-sm text-muted-foreground">
              {importResult.total_records} registros importados em {importResult.tables_imported.length} tabelas
            </p>
          </div>
        </div>

        {importResult.tables_imported.length > 0 && (
          <div className="max-h-40 overflow-y-auto space-y-1">
            {Object.entries(importResult.results).map(([table, info]) => (
              info.inserted > 0 && (
                <div key={table} className="flex items-center justify-between py-1.5 px-3 rounded bg-muted/30">
                  <span className="text-sm">{TABLE_LABELS[table] || table}</span>
                  <Badge variant="outline" className="text-xs">{info.inserted}</Badge>
                </div>
              )
            ))}
          </div>
        )}

        {hasErrors && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-destructive">Erros:</p>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {importResult.errors.map((err, i) => (
                <div key={i} className="text-xs p-2 rounded bg-destructive/5 text-destructive">
                  <strong>{err.table}:</strong> {err.error}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4">
          <Button variant="cofound" onClick={handleClose} className="w-full">
            Fechar
          </Button>
        </div>
      </div>
    );
  };

  const stepTitles: Record<Step, string> = {
    upload: "Importar Dados — Upload",
    summary: "Importar Dados — Resumo",
    mode: "Importar Dados — Modo",
    confirm: "Importar Dados",
    progress: "Importando Dados...",
    result: "Resultado da Importação",
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              {stepTitles[step]}
            </DialogTitle>
          </DialogHeader>

          {step === "upload" && renderUploadStep()}
          {step === "summary" && renderSummaryStep()}
          {step === "mode" && renderModeStep()}
          {step === "progress" && renderProgressStep()}
          {step === "result" && renderResultStep()}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className={`h-5 w-5 ${importMode === "replace" ? "text-destructive" : "text-amber-500"}`} />
              Confirmar Importação
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Você está prestes a importar <strong>{parsedData?.totalRecords || 0} registros</strong> de{" "}
                  <strong>{parsedData?.sourceCompanyName}</strong> para <strong>{companyName}</strong>.
                </p>
                {importMode === "replace" ? (
                  <div className="p-3 bg-destructive/10 rounded-lg text-destructive text-sm">
                    <strong>⚠️ ATENÇÃO:</strong> Modo <strong>SUBSTITUIR</strong> selecionado. Todos os dados
                    estratégicos e operacionais existentes em <strong>{companyName}</strong> serão
                    permanentemente apagados antes da importação. Esta ação não pode ser desfeita.
                  </div>
                ) : (
                  <p className="text-sm">
                    Modo <strong>ADICIONAR</strong>: os novos registros serão inseridos sem afetar os dados existentes.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmImport}
              className={importMode === "replace" ? "bg-destructive hover:bg-destructive/90" : ""}
            >
              {importMode === "replace" ? "Confirmar Substituição" : "Confirmar Importação"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
