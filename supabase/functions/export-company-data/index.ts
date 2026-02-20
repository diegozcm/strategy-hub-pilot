import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const PAGE_SIZE = 1000;

async function fetchAllRows(
  supabaseAdmin: ReturnType<typeof createClient>,
  tableName: string,
  filterColumn: string,
  filterValue: string | string[],
  filterType: "eq" | "in" = "eq"
): Promise<unknown[]> {
  const allRows: unknown[] = [];
  let from = 0;

  while (true) {
    let query = supabaseAdmin
      .from(tableName)
      .select("*")
      .range(from, from + PAGE_SIZE - 1);

    if (filterType === "eq") {
      query = query.eq(filterColumn, filterValue as string);
    } else {
      query = query.in(filterColumn, filterValue as string[]);
    }

    const { data, error } = await query;

    if (error) {
      console.error(`Error fetching ${tableName} (page ${from}):`, error.message);
      break;
    }

    if (!data || data.length === 0) break;
    allRows.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return allRows;
}

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

    const { company_id } = await req.json();
    if (!company_id) {
      return new Response(JSON.stringify({ error: "company_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sa = createClient(supabaseUrl, supabaseServiceKey);

    const { data: company, error: companyError } = await sa
      .from("companies")
      .select("*")
      .eq("id", company_id)
      .single();

    if (companyError || !company) {
      return new Response(JSON.stringify({ error: "Company not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`📦 Starting export for company: ${company.name} (${company_id})`);

    const exportData: Record<string, unknown[]> = {};
    let totalRecords = 0;
    const tablesExported: string[] = [];

    const fetch = async (table: string, col: string, val: string | string[], type: "eq" | "in" = "eq") => {
      const rows = await fetchAllRows(sa, table, col, val, type);
      exportData[table] = rows;
      totalRecords += rows.length;
      if (rows.length > 0) tablesExported.push(table);
    };

    const ids = (table: string, col = "id"): string[] =>
      (exportData[table] || []).map((r: any) => r[col]).filter(Boolean);

    // ── Direct company_id tables ──
    await Promise.all([
      fetch("companies", "id", company_id),
      fetch("golden_circle", "company_id", company_id),
      fetch("swot_analysis", "company_id", company_id),
      fetch("vision_alignment", "company_id", company_id),
      fetch("strategic_plans", "company_id", company_id),
      fetch("beep_assessments", "company_id", company_id),
      fetch("governance_meetings", "company_id", company_id),
      fetch("governance_rules", "company_id", company_id),
      fetch("governance_rule_documents", "company_id", company_id),
      fetch("kr_initiatives", "company_id", company_id),
      fetch("strategic_projects", "company_id", company_id),
      fetch("company_module_settings", "company_id", company_id),
      fetch("performance_reviews", "company_id", company_id),
      fetch("vision_alignment_removed_dupes", "company_id", company_id),
    ]);

    // ── Golden circle history ──
    const gcIds = ids("golden_circle");
    if (gcIds.length > 0) {
      await fetch("golden_circle_history", "golden_circle_id", gcIds, "in");
    }

    // ── SWOT history ──
    const swotIds = ids("swot_analysis");
    if (swotIds.length > 0) {
      await fetch("swot_history", "swot_id", swotIds, "in");
    }

    // ── Vision alignment related ──
    const vaIds = ids("vision_alignment");
    if (vaIds.length > 0) {
      await Promise.all([
        fetch("vision_alignment_history", "vision_alignment_id", vaIds, "in"),
        fetch("vision_alignment_objectives", "vision_alignment_id", vaIds, "in"),
      ]);
    }

    // ── Strategic chain: plans → pillars → objectives → key_results ──
    const planIds = ids("strategic_plans");
    if (planIds.length > 0) {
      await fetch("strategic_pillars", "plan_id", planIds, "in");
    }

    const pillarIds = ids("strategic_pillars");
    if (pillarIds.length > 0) {
      await fetch("strategic_objectives", "pillar_id", pillarIds, "in");
    }

    const objectiveIds = ids("strategic_objectives");
    if (objectiveIds.length > 0) {
      await fetch("key_results", "objective_id", objectiveIds, "in");
    }

    const krIds = ids("key_results");
    if (krIds.length > 0) {
      await Promise.all([
        fetch("key_result_values", "key_result_id", krIds, "in"),
        fetch("key_results_history", "key_result_id", krIds, "in"),
        fetch("kr_fca", "key_result_id", krIds, "in"),
        fetch("kr_monthly_actions", "key_result_id", krIds, "in"),
        fetch("kr_status_reports", "key_result_id", krIds, "in"),
      ]);
    }

    // ── KR actions history ──
    const actionIds = ids("kr_monthly_actions");
    if (actionIds.length > 0) {
      await fetch("kr_actions_history", "action_id", actionIds, "in");
    }

    // ── Governance sub-tables ──
    const meetingIds = ids("governance_meetings");
    if (meetingIds.length > 0) {
      await Promise.all([
        fetch("governance_agenda_items", "meeting_id", meetingIds, "in"),
        fetch("governance_atas", "meeting_id", meetingIds, "in"),
      ]);
    }

    const ruleIds = ids("governance_rules");
    if (ruleIds.length > 0) {
      await fetch("governance_rule_items", "governance_rule_id", ruleIds, "in");
    }

    // ── Strategic projects sub-tables ──
    const projectIds = ids("strategic_projects");
    if (projectIds.length > 0) {
      await Promise.all([
        fetch("project_members", "project_id", projectIds, "in"),
        fetch("project_tasks", "project_id", projectIds, "in"),
        fetch("project_kr_relations", "project_id", projectIds, "in"),
        fetch("project_objective_relations", "project_id", projectIds, "in"),
      ]);
    }

    // ── Beep answers ──
    const assessmentIds = ids("beep_assessments");
    if (assessmentIds.length > 0) {
      await fetch("beep_answers", "assessment_id", assessmentIds, "in");
    }

    console.log(`✅ Export complete: ${totalRecords} records across ${tablesExported.length} tables`);

    await sa.from("company_export_logs").insert({
      company_id,
      admin_user_id: userId,
      export_format: "json",
      tables_exported: tablesExported,
      total_records: totalRecords,
    });

    return new Response(
      JSON.stringify({
        version: "1.0",
        company_name: company.name,
        source_company_id: company_id,
        exported_at: new Date().toISOString(),
        total_records: totalRecords,
        tables_exported: tablesExported,
        data: exportData,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Export error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
