import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { company_id } = await req.json();

    if (!company_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'company_id é obrigatório',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Recalculating KRs for company: ${company_id}`);
    
    // Get all KRs for this company through strategic plans
    const { data: allKRs, error: fetchError } = await supabaseClient
      .from('key_results')
      .select(`
        id,
        objectives:strategic_objectives!inner(
          id,
          plans:strategic_plans!inner(
            id,
            company_id
          )
        )
      `)
      .eq('objectives.plans.company_id', company_id);

    if (fetchError) {
      console.error('Error fetching KRs:', fetchError);
      throw fetchError;
    }

    const totalKRs = allKRs?.length || 0;
    console.log(`Found ${totalKRs} KRs to recalculate`);

    let successCount = 0;
    let errorCount = 0;

    for (const kr of allKRs || []) {
      const { error } = await supabaseClient.rpc('calculate_kr_metrics', {
        kr_id: kr.id,
      });

      if (error) {
        console.error(`Error calculating KR ${kr.id}:`, error);
        errorCount++;
      } else {
        successCount++;
      }
    }

    console.log(`Recalculation complete: ${successCount} success, ${errorCount} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Recalculado ${successCount} KRs com sucesso, ${errorCount} erros`,
        totalKRs,
        successCount,
        errorCount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
