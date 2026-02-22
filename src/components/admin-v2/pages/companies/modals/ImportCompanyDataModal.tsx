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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  Clock,
  SkipForward,
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

interface TableResult {
  total_in_file: number;
  inserted: number;
  skipped: number;
  failed: number;
  errors: Array<{ batch: number; message: string }>;
  skipped_details: Array<{ old_id: string; reason: string }>;
}

interface DeleteLogEntry {
  table: string;
  success: boolean;
  error?: string;
}

interface ImportResult {
  success: boolean;
  total_records: number;
  tables_imported: string[];
  results: Record<string, TableResult>;
  errors: Array<{ table: string; error: string }>;
  delete_log?: DeleteLogEntry[];
  duration_ms?: number;
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
  const [progressLogs, setProgressLogs] = useState<string[]>([]);
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
    setProgressLogs([]);
  }, []);

  const addLog = (msg: string) => {
    setProgressLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleClose = () => {
    if (!isImporting) {
      resetState();
      onOpenChange(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isJson = file.name.endsWith(".json");
    const isXlsx = file.name.endsWith(".xlsx");

    if (!isJson && !isXlsx) {
      toast.error("Apenas arquivos .json ou .xlsx são aceitos.");
      return;
    }

    try {
      const tables: Record<string, unknown[]> = {};
      let totalRecords = 0;
      const tablesSummary: Array<{ name: string; count: number }> = [];
      let sourceCompanyName = "Desconhecida";
      let sourceCompanyId = "unknown";

      if (isJson) {
        const text = await file.text();
        const jsonData = JSON.parse(text);

        // Support both { data: { ... } } (export format) and flat { table: [...] }
        const rawTables = jsonData.data || jsonData;

        for (const [tableName, rows] of Object.entries(rawTables)) {
          if (Array.isArray(rows) && rows.length > 0) {
            tables[tableName] = rows;
            totalRecords += rows.length;
            tablesSummary.push({ name: tableName, count: rows.length });
          }
        }

        sourceCompanyName = jsonData.company_name || (tables.companies as any)?.[0]?.name || "Desconhecida";
        sourceCompanyId = jsonData.source_company_id || (tables.companies as any)?.[0]?.id || "unknown";
      } else {
        // XLSX path with raw: true to preserve stringified JSON
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });

        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(sheet, { raw: true, defval: null }) as Array<Record<string, unknown>>;
          if (rows.length > 0) {
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

        const companyRows = tables.companies as Array<Record<string, unknown>> | undefined;
        sourceCompanyName = (companyRows?.[0]?.name as string) || "Desconhecida";
        sourceCompanyId = (companyRows?.[0]?.id as string) || "unknown";
      }

      setParsedData({
        tables,
        sourceCompanyName,
        sourceCompanyId,
        totalRecords,
        tablesSummary: tablesSummary.sort((a, b) => b.count - a.count),
      });
      setStep("summary");
    } catch (err) {
      console.error("Error parsing file:", err);
      toast.error("Erro ao ler o arquivo. Verifique se o formato está correto.");
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
    setProgressLogs([]);
    setProgressMessage("Preparando importação...");
    addLog("Iniciando processo de importação...");

    try {
      setProgressPercent(20);
      addLog(`Modo: ${importMode === "replace" ? "Substituir" : "Adicionar"}`);
      addLog(`Empresa destino: ${companyName}`);
      addLog(`Registros a processar: ${parsedData?.totalRecords || 0}`);

      setProgressPercent(30);
      setProgressMessage("Enviando dados para o servidor...");
      addLog("Enviando dados para o servidor...");

      const { data, error } = await supabase.functions.invoke("import-company-data", {
        body: {
          company_id: companyId,
          mode: importMode,
          data: parsedData!.tables,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setProgressPercent(90);
      setProgressMessage("Processando resultado...");
      addLog("Resposta recebida do servidor.");

      const result = data as ImportResult;

      // Log server results
      if (result.delete_log && result.delete_log.length > 0) {
        addLog(`Limpeza: ${result.delete_log.filter(d => d.success).length} tabelas limpas com sucesso`);
        const deleteFails = result.delete_log.filter(d => !d.success);
        if (deleteFails.length > 0) {
          addLog(`⚠️ ${deleteFails.length} tabelas falharam na limpeza`);
        }
      }

      for (const [table, info] of Object.entries(result.results)) {
        const label = TABLE_LABELS[table] || table;
        if (info.inserted === info.total_in_file) {
          addLog(`✅ ${label}: ${info.inserted}/${info.total_in_file} registros`);
        } else if (info.inserted > 0) {
          addLog(`⚠️ ${label}: ${info.inserted}/${info.total_in_file} registros (${info.skipped} pulados, ${info.failed} falhas)`);
        } else {
          addLog(`❌ ${label}: 0/${info.total_in_file} registros importados`);
        }
      }

      if (result.duration_ms) {
        addLog(`Duração total: ${(result.duration_ms / 1000).toFixed(1)}s`);
      }

      setProgressPercent(100);
      setProgressMessage("Importação concluída!");
      addLog("Importação concluída!");
      setImportResult(result);

      await new Promise((r) => setTimeout(r, 500));
      setStep("result");
      setIsImporting(false);
      onSuccess();
    } catch (err: any) {
      console.error("Import error:", err);
      addLog(`❌ Erro: ${err.message || "Erro desconhecido"}`);
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
        <p className="text-lg font-medium">Selecione um arquivo JSON ou XLSX</p>
        <p className="text-sm text-muted-foreground mt-1">
          Arquivo gerado pela exportação de dados de empresa
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          💡 Formato <strong>JSON</strong> é recomendado para preservar todos os dados sem perda
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.xlsx"
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
    <div className="space-y-6 py-4">
      <div className="text-center space-y-2">
        <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
        <p className="font-medium">{progressMessage}</p>
        <Progress value={progressPercent} className="w-full" />
        <p className="text-sm text-muted-foreground">{progressPercent}%</p>
      </div>

      {progressLogs.length > 0 && (
        <div className="bg-muted/30 rounded-lg p-3 max-h-40 overflow-y-auto">
          <p className="text-xs font-medium text-muted-foreground mb-2">Log de execução:</p>
          <div className="space-y-0.5">
            {progressLogs.map((log, i) => (
              <p key={i} className="text-xs font-mono text-muted-foreground">{log}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderResultStep = () => {
    if (!importResult) return null;

    const tableEntries = Object.entries(importResult.results);
    const successTables = tableEntries.filter(([, r]) => r.inserted === r.total_in_file && r.total_in_file > 0);
    const partialTables = tableEntries.filter(([, r]) => r.inserted > 0 && r.inserted < r.total_in_file);
    const failedTables = tableEntries.filter(([, r]) => r.inserted === 0 && r.total_in_file > 0);

    const globalErrors = importResult.errors.filter(e => e.table === "general");
    const hasGlobalError = globalErrors.length > 0;

    return (
      <div className="space-y-4 py-4">
        {/* Header summary */}
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          hasGlobalError ? "bg-destructive/10" :
          failedTables.length > 0 || partialTables.length > 0 ? "bg-amber-500/10" :
          "bg-cofound-green/10"
        }`}>
          {hasGlobalError ? (
            <XCircle className="h-6 w-6 text-destructive shrink-0" />
          ) : failedTables.length > 0 || partialTables.length > 0 ? (
            <AlertTriangle className="h-6 w-6 text-amber-500 shrink-0" />
          ) : (
            <CheckCircle2 className="h-6 w-6 text-cofound-green shrink-0" />
          )}
          <div>
            <p className="font-medium">
              {hasGlobalError ? "Falha na importação" :
               failedTables.length > 0 || partialTables.length > 0 ? "Importação concluída com ressalvas" :
               "Importação concluída com sucesso!"}
            </p>
            <p className="text-sm text-muted-foreground">
              {importResult.total_records} registros importados em {importResult.tables_imported.length} tabelas
              {importResult.duration_ms ? ` • ${(importResult.duration_ms / 1000).toFixed(1)}s` : ""}
            </p>
          </div>
        </div>

        {hasGlobalError && (
          <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
            {globalErrors.map((e, i) => (
              <p key={i} className="text-sm text-destructive">{e.error}</p>
            ))}
          </div>
        )}

        {/* Categorized results */}
        <div className="max-h-[45vh] overflow-y-auto space-y-2">
          <Accordion type="multiple" defaultValue={["partial", "failed"]}>
            {/* Success tables */}
            {successTables.length > 0 && (
              <AccordionItem value="success" className="border rounded-lg border-cofound-green/30">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-cofound-green" />
                    <span className="text-sm font-medium">Importados com sucesso</span>
                    <Badge variant="outline" className="text-xs text-cofound-green border-cofound-green/40">
                      {successTables.length}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-3">
                  <div className="space-y-1">
                    {successTables.map(([table, info]) => (
                      <div key={table} className="flex items-center justify-between py-1.5 px-3 rounded bg-cofound-green/5">
                        <span className="text-sm">{TABLE_LABELS[table] || table}</span>
                        <Badge variant="outline" className="text-xs">{info.inserted} registros</Badge>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Partial tables */}
            {partialTables.length > 0 && (
              <AccordionItem value="partial" className="border rounded-lg border-amber-500/30">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-medium">Importados parcialmente</span>
                    <Badge variant="outline" className="text-xs text-amber-600 border-amber-500/40">
                      {partialTables.length}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-3">
                  <div className="space-y-3">
                    {partialTables.map(([table, info]) => (
                      <div key={table} className="space-y-1.5">
                        <div className="flex items-center justify-between px-3 py-1.5 rounded bg-amber-500/5">
                          <span className="text-sm font-medium">{TABLE_LABELS[table] || table}</span>
                          <span className="text-xs text-muted-foreground">
                            {info.inserted}/{info.total_in_file} registros
                            {info.skipped > 0 && <span className="ml-1">• {info.skipped} pulados</span>}
                            {info.failed > 0 && <span className="ml-1 text-destructive">• {info.failed} falhas</span>}
                          </span>
                        </div>
                        {(info.errors.length > 0 || info.skipped_details.length > 0) && (
                          <div className="pl-3 space-y-1">
                            {info.errors.map((err, i) => (
                              <div key={`err-${i}`} className="text-xs p-2 rounded bg-destructive/5 text-destructive">
                                <strong>Batch {err.batch}:</strong> {err.message}
                              </div>
                            ))}
                            {info.skipped_details.length > 0 && (
                              <Accordion type="single" collapsible>
                                <AccordionItem value="skipped" className="border-none">
                                  <AccordionTrigger className="py-1 hover:no-underline">
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <SkipForward className="h-3 w-3" />
                                      {info.skipped_details.length} registros pulados
                                    </span>
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <div className="space-y-0.5 max-h-24 overflow-y-auto">
                                      {info.skipped_details.map((s, i) => (
                                        <p key={i} className="text-xs text-muted-foreground font-mono">
                                          {s.old_id?.substring(0, 8)}… → {s.reason}
                                        </p>
                                      ))}
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              </Accordion>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Failed tables */}
            {failedTables.length > 0 && (
              <AccordionItem value="failed" className="border rounded-lg border-destructive/30">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-destructive" />
                    <span className="text-sm font-medium">Não importados</span>
                    <Badge variant="outline" className="text-xs text-destructive border-destructive/40">
                      {failedTables.length}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-3">
                  <div className="space-y-3">
                    {failedTables.map(([table, info]) => (
                      <div key={table} className="space-y-1.5">
                        <div className="flex items-center justify-between px-3 py-1.5 rounded bg-destructive/5">
                          <span className="text-sm font-medium">{TABLE_LABELS[table] || table}</span>
                          <span className="text-xs text-muted-foreground">
                            0/{info.total_in_file} registros
                          </span>
                        </div>
                        <div className="pl-3 space-y-1">
                          {info.errors.map((err, i) => (
                            <div key={`err-${i}`} className="text-xs p-2 rounded bg-destructive/5 text-destructive">
                              <strong>Batch {err.batch}:</strong> {err.message}
                            </div>
                          ))}
                          {info.skipped_details.length > 0 && info.errors.length === 0 && (
                            <div className="text-xs p-2 rounded bg-amber-500/5 text-amber-700">
                              <strong>Todos pulados:</strong> {info.skipped_details[0]?.reason}
                              {info.skipped_details.length > 1 && ` (+${info.skipped_details.length - 1} outros)`}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>

          {/* Delete log for replace mode */}
          {importResult.delete_log && importResult.delete_log.length > 0 && (
            <Accordion type="single" collapsible>
              <AccordionItem value="delete-log" className="border rounded-lg border-muted">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Log de limpeza (modo substituir)</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-3">
                  <div className="space-y-0.5 max-h-32 overflow-y-auto">
                    {importResult.delete_log.map((entry, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        {entry.success ? (
                          <CheckCircle2 className="h-3 w-3 text-cofound-green shrink-0" />
                        ) : (
                          <XCircle className="h-3 w-3 text-destructive shrink-0" />
                        )}
                        <span className="text-muted-foreground">{TABLE_LABELS[entry.table] || entry.table}</span>
                        {entry.error && <span className="text-destructive">— {entry.error}</span>}
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </div>

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
