import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

interface Discrepancy {
  table: string;
  field: string;
  source_id: string;
  source_value: unknown;
  imported_value: unknown;
  status: "match" | "mismatch" | "missing";
}

// Critical JSONB fields to validate per table
const JSONB_FIELDS: Record<string, string[]> = {
  key_results: ["monthly_targets", "monthly_actual"],
  swot_analysis: ["strengths", "weaknesses", "opportunities", "threats"],
  company_module_settings: ["settings"],
};

// Fields to compare for key_results (most critical)
const KR_COMPARE_FIELDS = [
  "title", "target_value", "current_value", "unit", "weight",
  "monthly_targets", "monthly_actual", "yearly_target", "yearly_actual",
  "ytd_target", "ytd_actual", "frequency", "aggregation_type",
  "target_direction", "start_month", "end_month", "description",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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
    const { data: isAdmin } = await supabaseAuth.rpc("is_system_admin", { _user_id: userId });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { company_id, source_data } = await req.json();

    if (!company_id || !source_data) {
      return new Response(JSON.stringify({ error: "company_id and source_data are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sa = createClient(supabaseUrl, supabaseServiceKey);
    const discrepancies: Discrepancy[] = [];
    let totalFieldsChecked = 0;
    let matches = 0;
    let mismatches = 0;
    let missing = 0;
    let tablesChecked = 0;

    // ═══ Validate key_results (most critical) ═══
    const sourceKRs = source_data.key_results;
    if (sourceKRs && Array.isArray(sourceKRs) && sourceKRs.length > 0) {
      tablesChecked++;
      console.log(`🔍 Validating key_results: ${sourceKRs.length} source records`);

      // Fetch all KRs for this company via objectives -> pillars -> plans
      const { data: plans } = await sa
        .from("strategic_plans")
        .select("id")
        .eq("company_id", company_id);

      const planIds = plans?.map(p => p.id) || [];

      let importedKRs: any[] = [];
      if (planIds.length > 0) {
        const { data: pillars } = await sa
          .from("strategic_pillars")
          .select("id")
          .in("plan_id", planIds);

        const pillarIds = pillars?.map(p => p.id) || [];

        if (pillarIds.length > 0) {
          const { data: objectives } = await sa
            .from("strategic_objectives")
            .select("id")
            .in("pillar_id", pillarIds);

          const objectiveIds = objectives?.map(o => o.id) || [];

          if (objectiveIds.length > 0) {
            // Fetch all KRs in batches to avoid 1000 limit
            for (let i = 0; i < objectiveIds.length; i += 50) {
              const batch = objectiveIds.slice(i, i + 50);
              const { data: krs } = await sa
                .from("key_results")
                .select("*")
                .in("objective_id", batch);
              if (krs) importedKRs.push(...krs);
            }
          }
        }
      }

      console.log(`🔍 Found ${importedKRs.length} imported KRs in database`);

      // Match by title (since IDs are remapped during import)
      for (const sourceKR of sourceKRs) {
        const importedKR = importedKRs.find(kr => kr.title === sourceKR.title);

        if (!importedKR) {
          missing++;
          totalFieldsChecked++;
          discrepancies.push({
            table: "key_results",
            field: "record",
            source_id: sourceKR.id,
            source_value: sourceKR.title,
            imported_value: null,
            status: "missing",
          });
          continue;
        }

        // Compare critical fields
        for (const field of KR_COMPARE_FIELDS) {
          totalFieldsChecked++;
          const sourceVal = sourceKR[field];
          const importedVal = importedKR[field];

          // Deep compare for objects
          const sourceStr = JSON.stringify(sourceVal ?? null);
          const importedStr = JSON.stringify(importedVal ?? null);

          if (sourceStr === importedStr) {
            matches++;
          } else {
            mismatches++;
            discrepancies.push({
              table: "key_results",
              field,
              source_id: sourceKR.id,
              source_value: sourceVal,
              imported_value: importedVal,
              status: "mismatch",
            });
          }
        }
      }
    }

    // ═══ Validate other tables with JSONB fields ═══
    for (const [table, jsonbFields] of Object.entries(JSONB_FIELDS)) {
      if (table === "key_results") continue; // Already handled above
      const sourceRows = source_data[table];
      if (!sourceRows || !Array.isArray(sourceRows) || sourceRows.length === 0) continue;

      tablesChecked++;

      const { data: importedRows } = await sa
        .from(table)
        .select("*")
        .eq("company_id", company_id);

      if (!importedRows || importedRows.length === 0) {
        missing += sourceRows.length;
        totalFieldsChecked += sourceRows.length;
        for (const row of sourceRows) {
          discrepancies.push({
            table,
            field: "record",
            source_id: row.id,
            source_value: `${sourceRows.length} records`,
            imported_value: null,
            status: "missing",
          });
        }
        continue;
      }

      // Check JSONB fields specifically
      for (const row of sourceRows) {
        for (const field of jsonbFields) {
          totalFieldsChecked++;
          const sourceVal = row[field];
          // Find matching imported row (by matching other identifying fields)
          const imported = importedRows.find((ir: any) => {
            // Try to match by non-id fields
            if (table === "swot_analysis") return true; // Usually 1 per company
            if (table === "company_module_settings") return ir.module_slug === row.module_slug;
            return false;
          });

          if (!imported) {
            missing++;
            discrepancies.push({
              table,
              field,
              source_id: row.id,
              source_value: sourceVal,
              imported_value: null,
              status: "missing",
            });
          } else {
            const importedVal = imported[field];
            const sourceStr = JSON.stringify(sourceVal ?? null);
            const importedStr = JSON.stringify(importedVal ?? null);

            if (sourceStr === importedStr) {
              matches++;
            } else {
              mismatches++;
              discrepancies.push({
                table,
                field,
                source_id: row.id,
                source_value: sourceVal,
                imported_value: importedVal,
                status: "mismatch",
              });
            }
          }
        }
      }
    }

    // ═══ Simple count check for other tables ═══
    const countCheckTables = [
      "strategic_plans", "strategic_pillars", "strategic_objectives",
      "kr_fca", "kr_initiatives", "kr_monthly_actions",
      "governance_meetings", "governance_atas",
    ];

    for (const table of countCheckTables) {
      const sourceRows = source_data[table];
      if (!sourceRows || !Array.isArray(sourceRows) || sourceRows.length === 0) continue;

      tablesChecked++;
      totalFieldsChecked++;

      // Count imported records
      let importedCount = 0;
      try {
        const { count } = await sa
          .from(table)
          .select("id", { count: "exact", head: true })
          .eq("company_id", company_id);
        importedCount = count || 0;
      } catch {
        // Table might not have company_id directly
        importedCount = -1;
      }

      if (importedCount >= 0 && importedCount !== sourceRows.length) {
        mismatches++;
        discrepancies.push({
          table,
          field: "record_count",
          source_id: "all",
          source_value: sourceRows.length,
          imported_value: importedCount,
          status: "mismatch",
        });
      } else if (importedCount >= 0) {
        matches++;
      }
    }

    const valid = mismatches === 0 && missing === 0;

    console.log(`🔍 Validation complete: ${valid ? "✅ VALID" : "❌ DISCREPANCIES FOUND"}`);
    console.log(`   Fields checked: ${totalFieldsChecked}, Matches: ${matches}, Mismatches: ${mismatches}, Missing: ${missing}`);

    return new Response(
      JSON.stringify({
        valid,
        tables_checked: tablesChecked,
        discrepancies: discrepancies.slice(0, 100), // Limit to 100 for readability
        total_discrepancies: discrepancies.length,
        summary: {
          total_fields_checked: totalFieldsChecked,
          matches,
          mismatches,
          missing,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Validation error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
