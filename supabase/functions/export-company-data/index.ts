import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Validate JWT
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

    // Auth client (user context)
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

    // 2. Verify system admin via RPC
    const { data: isAdmin, error: adminError } = await supabaseAuth.rpc("is_system_admin", {
      _user_id: userId,
    });

    if (adminError || !isAdmin) {
      console.error("Admin check failed:", adminError);
      return new Response(JSON.stringify({ error: "Forbidden: System Admin required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Parse request
    const { company_id } = await req.json();
    if (!company_id) {
      return new Response(JSON.stringify({ error: "company_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Service role client (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify company exists
    const { data: company, error: companyError } = await supabaseAdmin
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

    // 5. Export all tables
    const exportData: Record<string, unknown[]> = {};
    let totalRecords = 0;
    const tablesExported: string[] = [];

    // Helper to fetch and store
    const fetchTable = async (tableName: string, query: any) => {
      const { data, error } = await query;
      if (error) {
        console.error(`Error fetching ${tableName}:`, error.message);
        exportData[tableName] = [];
        return;
      }
      exportData[tableName] = data || [];
      totalRecords += (data || []).length;
      if ((data || []).length > 0) {
        tablesExported.push(tableName);
      }
    };

    // --- Direct company_id tables ---
    await Promise.all([
      fetchTable("companies", supabaseAdmin.from("companies").select("*").eq("id", company_id)),
      fetchTable("user_company_relations", supabaseAdmin.from("user_company_relations").select("*").eq("company_id", company_id)),
      fetchTable("golden_circle", supabaseAdmin.from("golden_circle").select("*").eq("company_id", company_id)),
      fetchTable("swot_analysis", supabaseAdmin.from("swot_analysis").select("*").eq("company_id", company_id)),
      fetchTable("vision_alignment", supabaseAdmin.from("vision_alignment").select("*").eq("company_id", company_id)),
      fetchTable("strategic_plans", supabaseAdmin.from("strategic_plans").select("*").eq("company_id", company_id)),
      fetchTable("beep_assessments", supabaseAdmin.from("beep_assessments").select("*").eq("company_id", company_id)),
      fetchTable("governance_meetings", supabaseAdmin.from("governance_meetings").select("*").eq("company_id", company_id)),
      fetchTable("governance_rules", supabaseAdmin.from("governance_rules").select("*").eq("company_id", company_id)),
      fetchTable("governance_rule_documents", supabaseAdmin.from("governance_rule_documents").select("*").eq("company_id", company_id)),
      fetchTable("ai_chat_sessions", supabaseAdmin.from("ai_chat_sessions").select("*").eq("company_id", company_id)),
      fetchTable("ai_company_settings", supabaseAdmin.from("ai_company_settings").select("*").eq("company_id", company_id)),
      fetchTable("ai_insights", supabaseAdmin.from("ai_insights").select("*").eq("company_id", company_id)),
      fetchTable("kr_initiatives", supabaseAdmin.from("kr_initiatives").select("*").eq("company_id", company_id)),
      fetchTable("strategic_projects", supabaseAdmin.from("strategic_projects").select("*").eq("company_id", company_id)),
      fetchTable("company_module_settings", supabaseAdmin.from("company_module_settings").select("*").eq("company_id", company_id)),
      fetchTable("performance_reviews", supabaseAdmin.from("performance_reviews").select("*").eq("company_id", company_id)),
      fetchTable("mentor_startup_relations", supabaseAdmin.from("mentor_startup_relations").select("*").eq("startup_company_id", company_id)),
    ]);

    // --- Profiles for company users ---
    const userIds = (exportData.user_company_relations || []).map((r: any) => r.user_id);
    if (userIds.length > 0) {
      await fetchTable("profiles", supabaseAdmin.from("profiles").select("*").in("user_id", userIds));
      await fetchTable("user_login_logs", supabaseAdmin.from("user_login_logs").select("*").in("user_id", userIds));
    }

    // --- Golden circle history ---
    const gcIds = (exportData.golden_circle || []).map((r: any) => r.id);
    if (gcIds.length > 0) {
      await fetchTable("golden_circle_history", supabaseAdmin.from("golden_circle_history").select("*").in("golden_circle_id", gcIds));
    }

    // --- SWOT history ---
    const swotIds = (exportData.swot_analysis || []).map((r: any) => r.id);
    if (swotIds.length > 0) {
      await fetchTable("swot_history", supabaseAdmin.from("swot_history").select("*").in("swot_id", swotIds));
    }

    // --- Vision alignment related ---
    const vaIds = (exportData.vision_alignment || []).map((r: any) => r.id);
    if (vaIds.length > 0) {
      await Promise.all([
        fetchTable("vision_alignment_history", supabaseAdmin.from("vision_alignment_history").select("*").in("vision_alignment_id", vaIds)),
        fetchTable("vision_alignment_objectives", supabaseAdmin.from("vision_alignment_objectives").select("*").in("vision_alignment_id", vaIds)),
      ]);
    }

    // --- Strategic plans -> pillars -> objectives -> key_results chain ---
    const planIds = (exportData.strategic_plans || []).map((r: any) => r.id);
    if (planIds.length > 0) {
      await fetchTable("strategic_pillars", supabaseAdmin.from("strategic_pillars").select("*").in("plan_id", planIds));
    }

    const pillarIds = (exportData.strategic_pillars || []).map((r: any) => r.id);
    if (pillarIds.length > 0) {
      await fetchTable("strategic_objectives", supabaseAdmin.from("strategic_objectives").select("*").in("pillar_id", pillarIds));
    }

    const objectiveIds = (exportData.strategic_objectives || []).map((r: any) => r.id);
    if (objectiveIds.length > 0) {
      await fetchTable("key_results", supabaseAdmin.from("key_results").select("*").in("objective_id", objectiveIds));
    }

    const krIds = (exportData.key_results || []).map((r: any) => r.id);
    if (krIds.length > 0) {
      await Promise.all([
        fetchTable("key_result_values", supabaseAdmin.from("key_result_values").select("*").in("key_result_id", krIds)),
        fetchTable("key_results_history", supabaseAdmin.from("key_results_history").select("*").in("key_result_id", krIds)),
        fetchTable("kr_fca", supabaseAdmin.from("kr_fca").select("*").in("key_result_id", krIds)),
        fetchTable("kr_monthly_actions", supabaseAdmin.from("kr_monthly_actions").select("*").in("key_result_id", krIds)),
        fetchTable("kr_status_reports", supabaseAdmin.from("kr_status_reports").select("*").in("key_result_id", krIds)),
      ]);
    }

    // --- KR actions history ---
    const actionIds = (exportData.kr_monthly_actions || []).map((r: any) => r.id);
    if (actionIds.length > 0) {
      await fetchTable("kr_actions_history", supabaseAdmin.from("kr_actions_history").select("*").in("action_id", actionIds));
    }

    // --- Governance sub-tables ---
    const meetingIds = (exportData.governance_meetings || []).map((r: any) => r.id);
    if (meetingIds.length > 0) {
      await Promise.all([
        fetchTable("governance_agenda_items", supabaseAdmin.from("governance_agenda_items").select("*").in("meeting_id", meetingIds)),
        fetchTable("governance_atas", supabaseAdmin.from("governance_atas").select("*").in("meeting_id", meetingIds)),
      ]);
    }

    const ruleIds = (exportData.governance_rules || []).map((r: any) => r.id);
    if (ruleIds.length > 0) {
      await fetchTable("governance_rule_items", supabaseAdmin.from("governance_rule_items").select("*").in("governance_rule_id", ruleIds));
    }

    // --- AI sub-tables ---
    const chatSessionIds = (exportData.ai_chat_sessions || []).map((r: any) => r.id);
    if (chatSessionIds.length > 0) {
      await fetchTable("ai_chat_messages", supabaseAdmin.from("ai_chat_messages").select("*").in("session_id", chatSessionIds));
    }

    const insightIds = (exportData.ai_insights || []).map((r: any) => r.id);
    if (insightIds.length > 0) {
      await fetchTable("ai_recommendations", supabaseAdmin.from("ai_recommendations").select("*").in("insight_id", insightIds));
    }

    // --- Strategic projects sub-tables ---
    const projectIds = (exportData.strategic_projects || []).map((r: any) => r.id);
    if (projectIds.length > 0) {
      await Promise.all([
        fetchTable("project_members", supabaseAdmin.from("project_members").select("*").in("project_id", projectIds)),
        fetchTable("project_tasks", supabaseAdmin.from("project_tasks").select("*").in("project_id", projectIds)),
        fetchTable("project_kr_relations", supabaseAdmin.from("project_kr_relations").select("*").in("project_id", projectIds)),
        fetchTable("project_objective_relations", supabaseAdmin.from("project_objective_relations").select("*").in("project_id", projectIds)),
      ]);
    }

    // --- Mentoring sessions & action items ---
    const mentorRelIds = (exportData.mentor_startup_relations || []).map((r: any) => r.id);
    if (mentorRelIds.length > 0) {
      await fetchTable("mentoring_sessions", supabaseAdmin.from("mentoring_sessions").select("*").in("relation_id", mentorRelIds));
    }

    const sessionIds = (exportData.mentoring_sessions || []).map((r: any) => r.id);
    if (sessionIds.length > 0) {
      await fetchTable("action_items", supabaseAdmin.from("action_items").select("*").in("session_id", sessionIds));
    }

    // --- Beep answers ---
    const assessmentIds = (exportData.beep_assessments || []).map((r: any) => r.id);
    if (assessmentIds.length > 0) {
      await fetchTable("beep_answers", supabaseAdmin.from("beep_answers").select("*").in("assessment_id", assessmentIds));
    }

    // --- Password policies ---
    await fetchTable("password_policies", supabaseAdmin.from("password_policies").select("*").eq("company_id", company_id));

    console.log(`✅ Export complete: ${totalRecords} records across ${tablesExported.length} tables`);

    // 6. Log the export
    await supabaseAdmin.from("company_export_logs").insert({
      company_id,
      admin_user_id: userId,
      export_format: "json",
      tables_exported: tablesExported,
      total_records: totalRecords,
    });

    // 7. Return data
    return new Response(
      JSON.stringify({
        company_name: company.name,
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
