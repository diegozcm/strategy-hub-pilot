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

    const { kr_id, recalculate_all } = await req.json();

    if (recalculate_all) {
      console.log('Recalculating all key results...');
      
      const { data: allKRs, error: fetchError } = await supabaseClient
        .from('key_results')
        .select('id');

      if (fetchError) throw fetchError;

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

      return new Response(
        JSON.stringify({
          success: true,
          message: `Recalculated ${successCount} key results successfully, ${errorCount} errors`,
          successCount,
          errorCount,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (kr_id) {
      console.log(`Recalculating key result: ${kr_id}`);

      const { error } = await supabaseClient.rpc('calculate_kr_metrics', {
        kr_id,
      });

      if (error) throw error;

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Key result metrics recalculated successfully',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing kr_id or recalculate_all parameter',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
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
