import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// Tables that have company_id directly
const DIRECT_COMPANY_TABLES = [
  "strategic_plans",
  "golden_circle",
  "swot_analysis",
  "vision_alignment",
  "strategic_pillars",
  "governance_meetings",
  "governance_rules",
  "governance_rule_documents",
  "kr_initiatives",
  "strategic_projects",
  "company_module_settings",
  "beep_assessments",
  "vision_alignment_removed_dupes",
];

// Deletion order (children first) for replace mode
const DELETE_ORDER = [
  "kr_actions_history",
  "kr_monthly_actions",
  "kr_fca",
  "kr_status_reports",
  "key_result_values",
  "key_results_history",
  "key_results",
  "strategic_objectives",
  "beep_answers",
  "beep_assessments",
  "governance_rule_items",
  "governance_rules",
  "governance_rule_documents",
  "governance_atas",
  "governance_agenda_items",
  "governance_meetings",
  "project_kr_relations",
  "project_objective_relations",
  "project_tasks",
  "project_members",
  "strategic_projects",
  "kr_initiatives",
  "vision_alignment_objectives",
  "vision_alignment_history",
  "vision_alignment",
  "vision_alignment_removed_dupes",
  "swot_history",
  "swot_analysis",
  "golden_circle_history",
  "golden_circle",
  "strategic_pillars",
  "strategic_plans",
  "company_module_settings",
];

// Insertion order (parents first)
const INSERT_ORDER = [
  "strategic_plans",
  "golden_circle",
  "swot_analysis",
  "vision_alignment",
  "strategic_pillars",
  "company_module_settings",
  "vision_alignment_removed_dupes",
  "golden_circle_history",
  "swot_history",
  "vision_alignment_history",
  "vision_alignment_objectives",
  "strategic_objectives",
  "key_results",
  "key_result_values",
  "key_results_history",
  "kr_fca",
  "kr_status_reports",
  "kr_monthly_actions",
  "kr_actions_history",
  "kr_initiatives",
  "governance_meetings",
  "governance_rules",
  "governance_rule_documents",
  "governance_agenda_items",
  "governance_atas",
  "governance_rule_items",
  "strategic_projects",
  "project_members",
  "project_tasks",
  "project_kr_relations",
  "project_objective_relations",
  "beep_assessments",
  "beep_answers",
];

// Foreign key mapping: for each table, which columns reference which source table's IDs
const FK_MAP: Record<string, Record<string, string>> = {
  strategic_pillars: { plan_id: "strategic_plans" },
  strategic_objectives: { pillar_id: "strategic_pillars", plan_id: "strategic_plans" },
  key_results: { objective_id: "strategic_objectives" },
  key_result_values: { key_result_id: "key_results" },
  key_results_history: { key_result_id: "key_results" },
  kr_fca: { key_result_id: "key_results" },
  kr_status_reports: { key_result_id: "key_results" },
  kr_monthly_actions: { key_result_id: "key_results", fca_id: "kr_fca" },
  kr_actions_history: { action_id: "kr_monthly_actions" },
  kr_initiatives: { key_result_id: "key_results" },
  golden_circle_history: { golden_circle_id: "golden_circle" },
  swot_history: { swot_analysis_id: "swot_analysis" },
  vision_alignment_history: { vision_alignment_id: "vision_alignment" },
  vision_alignment_objectives: { vision_alignment_id: "vision_alignment" },
  governance_agenda_items: { meeting_id: "governance_meetings" },
  governance_atas: { meeting_id: "governance_meetings" },
  governance_rule_items: { governance_rule_id: "governance_rules" },
  project_members: { project_id: "strategic_projects" },
  project_tasks: { project_id: "strategic_projects" },
  project_kr_relations: { project_id: "strategic_projects", key_result_id: "key_results" },
  project_objective_relations: { project_id: "strategic_projects", objective_id: "strategic_objectives" },
  beep_answers: { assessment_id: "beep_assessments" },
};

// User reference columns to nullify
const USER_COLUMNS = [
  "created_by", "updated_by", "changed_by", "owner_id", "recorded_by",
  "assigned_owner_id", "responsible_user_id", "uploaded_by", "approved_by",
  "responsible", "assigned_to",
];

function generateUUID(): string {
  return crypto.randomUUID();
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Auth check
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    const { data: isAdmin, error: adminError } = await supabaseAuth.rpc("is_system_admin", {
      _user_id: userId,
    });

    if (adminError || !isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: System Admin required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { company_id, mode, data: importData } = await req.json();

    if (!company_id || !mode || !importData) {
      return new Response(JSON.stringify({ error: "company_id, mode, and data are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (mode !== "merge" && mode !== "replace") {
      return new Response(JSON.stringify({ error: "mode must be 'merge' or 'replace'" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sa = createClient(supabaseUrl, supabaseServiceKey);

    // Validate company exists
    const { data: company, error: companyError } = await sa
      .from("companies")
      .select("id, name")
      .eq("id", company_id)
      .single();

    if (companyError || !company) {
      return new Response(JSON.stringify({ error: "Target company not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`📥 Starting import (${mode}) for company: ${company.name} (${company_id})`);

    // Extract source company info
    const sourceCompanyData = importData.companies?.[0] || null;
    const sourceCompanyName = sourceCompanyData?.name || "Unknown";
    const sourceCompanyId = sourceCompanyData?.id || "unknown";

    const results: Record<string, TableResult> = {};
    const idMaps: Record<string, Map<string, string>> = {};
    let totalRecords = 0;
    const allErrors: Array<{ table: string; error: string }> = [];
    const deleteLog: DeleteLogEntry[] = [];

    // ═══ REPLACE MODE: Delete existing data ═══
    if (mode === "replace") {
      console.log("🗑️ Replace mode: deleting existing data...");

      for (const table of DELETE_ORDER) {
        try {
          if (DIRECT_COMPANY_TABLES.includes(table) || table === "strategic_plans") {
            const { error } = await sa.from(table).delete().eq("company_id", company_id);
            if (error) {
              console.error(`Delete ${table}: ${error.message}`);
              allErrors.push({ table, error: `Delete failed: ${error.message}` });
              deleteLog.push({ table, success: false, error: error.message });
            } else {
              console.log(`🗑️ Deleted from ${table}`);
              deleteLog.push({ table, success: true });
            }
          }
        } catch (e) {
          console.error(`Delete ${table} exception:`, e.message);
          allErrors.push({ table, error: `Delete exception: ${e.message}` });
          deleteLog.push({ table, success: false, error: e.message });
        }
      }
    }

    // ═══ INSERT DATA ═══
    for (const table of INSERT_ORDER) {
      const rows = importData[table];
      if (!rows || !Array.isArray(rows) || rows.length === 0) continue;

      // Skip 'companies' table
      if (table === "companies") continue;

      const tableIdMap = new Map<string, string>();
      idMaps[table] = tableIdMap;

      const tableResult: TableResult = {
        total_in_file: rows.length,
        inserted: 0,
        skipped: 0,
        failed: 0,
        errors: [],
        skipped_details: [],
      };

      console.log(`📋 Processing ${table}: ${rows.length} rows`);

      // Process in batches of 50
      const BATCH_SIZE = 50;
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);
        const batchIndex = Math.floor(i / BATCH_SIZE);
        const processedBatch: Record<string, unknown>[] = [];
        const skippedInBatch: Array<{ old_id: string; reason: string }> = [];

        for (const row of batch) {
          const newRow = { ...row } as Record<string, unknown>;

          // Generate new ID and track mapping
          const oldId = newRow.id as string;
          const newId = generateUUID();
          tableIdMap.set(oldId, newId);
          newRow.id = newId;

          // Replace company_id with target
          if ("company_id" in newRow) {
            newRow.company_id = company_id;
          }

          // Remap foreign keys using idMaps
          const fkConfig = FK_MAP[table];
          let skipRow = false;
          if (fkConfig) {
            for (const [fkCol, sourceTable] of Object.entries(fkConfig)) {
              const oldFkValue = newRow[fkCol] as string;
              if (oldFkValue && idMaps[sourceTable]) {
                const newFkValue = idMaps[sourceTable].get(oldFkValue);
                if (newFkValue) {
                  newRow[fkCol] = newFkValue;
                } else {
                  const reason = `FK ${fkCol}=${oldFkValue} não encontrada em ${sourceTable}`;
                  console.warn(`⚠️ ${table}: ${reason}`);
                  skippedInBatch.push({ old_id: oldId, reason });
                  skipRow = true;
                  break;
                }
              } else if (oldFkValue && !idMaps[sourceTable]) {
                const reason = `Tabela referenciada ${sourceTable} não foi importada`;
                console.warn(`⚠️ ${table}: ${reason} (FK ${fkCol}=${oldFkValue})`);
                skippedInBatch.push({ old_id: oldId, reason });
                skipRow = true;
                break;
              }
            }
          }

          if (skipRow) continue;

          // Set user reference columns to importing admin's ID
          for (const col of USER_COLUMNS) {
            if (col in newRow && newRow[col]) {
              newRow[col] = userId;
            }
          }

          processedBatch.push(newRow);
        }

        // Track skipped rows
        if (skippedInBatch.length > 0) {
          tableResult.skipped += skippedInBatch.length;
          tableResult.skipped_details.push(...skippedInBatch);
        }

        // Insert the batch
        if (processedBatch.length > 0) {
          try {
            const { error } = await sa.from(table).insert(processedBatch);
            if (error) {
              console.error(`❌ Insert ${table} batch ${batchIndex}: ${error.message}`);
              tableResult.failed += processedBatch.length;
              tableResult.errors.push({ batch: batchIndex, message: error.message });
            } else {
              tableResult.inserted += processedBatch.length;
            }
          } catch (e) {
            console.error(`❌ Insert ${table} exception batch ${batchIndex}:`, e.message);
            tableResult.failed += processedBatch.length;
            tableResult.errors.push({ batch: batchIndex, message: e.message });
          }
        }
      }

      results[table] = tableResult;
      totalRecords += tableResult.inserted;

      if (tableResult.errors.length > 0) {
        allErrors.push(...tableResult.errors.map(e => ({ table, error: `Batch ${e.batch}: ${e.message}` })));
      }

      const status = tableResult.inserted === tableResult.total_in_file
        ? "✅" : tableResult.inserted > 0 ? "⚠️" : "❌";
      console.log(`${status} ${table}: ${tableResult.inserted}/${tableResult.total_in_file} inserted, ${tableResult.skipped} skipped, ${tableResult.failed} failed`);
    }

    // ═══ Update company data if present in source ═══
    if (sourceCompanyData && mode === "replace") {
      const updateFields: Record<string, unknown> = {};
      const allowedFields = ["mission", "vision", "values"];
      for (const field of allowedFields) {
        if (sourceCompanyData[field] !== undefined) {
          updateFields[field] = sourceCompanyData[field];
        }
      }
      if (Object.keys(updateFields).length > 0) {
        const { error } = await sa.from("companies").update(updateFields).eq("id", company_id);
        if (error) {
          console.error(`Update company: ${error.message}`);
          allErrors.push({ table: "companies", error: `Update: ${error.message}` });
        } else {
          console.log("✅ Company mission/vision/values updated");
        }
      }
    }

    // ═══ Log import ═══
    const tablesImported = Object.entries(results)
      .filter(([, v]) => v.inserted > 0)
      .map(([k]) => k);

    await sa.from("company_import_logs").insert({
      company_id,
      admin_user_id: userId,
      import_mode: mode,
      source_company_name: sourceCompanyName,
      source_company_id: sourceCompanyId,
      tables_imported: tablesImported,
      total_records: totalRecords,
      errors: allErrors.length > 0 ? allErrors : [],
    });

    const durationMs = Date.now() - startTime;
    console.log(`📥 Import complete in ${durationMs}ms: ${totalRecords} records across ${tablesImported.length} tables, ${allErrors.length} errors`);

    return new Response(
      JSON.stringify({
        success: allErrors.length === 0,
        total_records: totalRecords,
        tables_imported: tablesImported,
        results,
        errors: allErrors,
        delete_log: deleteLog,
        duration_ms: durationMs,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const durationMs = Date.now() - startTime;
    console.error("Import error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message, duration_ms: durationMs }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
