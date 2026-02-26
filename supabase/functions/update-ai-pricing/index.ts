import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let body: any = {};
    try { body = await req.json(); } catch (_) {}

    // If price_updates provided, update model prices
    if (body.price_updates && Array.isArray(body.price_updates)) {
      for (const pu of body.price_updates) {
        if (!pu.model_name) continue;
        const updateData: any = { updated_at: new Date().toISOString() };
        if (pu.input_cost_per_million !== undefined) updateData.input_cost_per_million = pu.input_cost_per_million;
        if (pu.output_cost_per_million !== undefined) updateData.output_cost_per_million = pu.output_cost_per_million;
        await supabase.from("ai_model_pricing").update(updateData).eq("model_name", pu.model_name);
      }
    }

    // 1. Fetch current USD/BRL rate - try multiple sources
    let newRateValue: number | null = null;
    
    try {
      const rateRes = await fetch("https://economia.awesomeapi.com.br/json/last/USD-BRL");
      if (rateRes.ok) {
        const rateData = await rateRes.json();
        newRateValue = parseFloat(rateData.USDBRL.bid);
      }
    } catch (_) { /* fallback below */ }

    if (!newRateValue) {
      try {
        const rateRes2 = await fetch("https://open.er-api.com/v6/latest/USD");
        if (rateRes2.ok) {
          const rateData2 = await rateRes2.json();
          newRateValue = rateData2.rates?.BRL;
        }
      } catch (_) { /* use manual fallback */ }
    }

    if (!newRateValue) {
      throw new Error("Could not fetch exchange rate from any source");
    }

    const newRate = newRateValue;

    // 2. Get current pricing
    const { data: currentPricing, error: fetchErr } = await supabase
      .from("ai_model_pricing")
      .select("*");
    if (fetchErr) throw fetchErr;

    // 3. Archive current prices to history
    for (const p of currentPricing || []) {
      await supabase.from("ai_pricing_history").insert({
        model_name: p.model_name,
        input_cost_per_million: p.input_cost_per_million,
        output_cost_per_million: p.output_cost_per_million,
        usd_to_brl_rate: p.usd_to_brl_rate,
        effective_from: p.updated_at?.split("T")[0] || new Date().toISOString().split("T")[0],
        effective_until: new Date().toISOString().split("T")[0],
        source: "auto_exchange",
      });
    }

    // 4. Update all models with new rate
    const { error: updateErr } = await supabase
      .from("ai_model_pricing")
      .update({
        usd_to_brl_rate: newRate,
        updated_at: new Date().toISOString(),
      })
      .neq("model_name", "");

    if (updateErr) throw updateErr;

    return new Response(
      JSON.stringify({
        success: true,
        new_rate: newRate,
        models_updated: currentPricing?.length || 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
