import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, session_id, user_id } = await req.json();

    if (!openAIApiKey) {
      throw new Error('OpenAI API key não configurada');
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get context data for the AI
    const [indicatorsRes, projectsRes, objectivesRes] = await Promise.all([
      supabase.from('indicators').select('*').limit(5),
      supabase.from('strategic_projects').select('*').limit(5),
      supabase.from('strategic_objectives').select('*').limit(5)
    ]);

    const contextData = {
      indicators: indicatorsRes.data || [],
      projects: projectsRes.data || [],
      objectives: objectivesRes.data || []
    };

    // Prepare context for AI
    let contextPrompt = `Você é um assistente de IA especializado em estratégia organizacional e análise de dados. 
    Você tem acesso aos seguintes dados atuais da organização:

    INDICADORES (${contextData.indicators.length} total):
    ${contextData.indicators.map(ind => 
      `- ${ind.name}: ${ind.current_value}/${ind.target_value} ${ind.unit} (${Math.round((ind.current_value/ind.target_value)*100)}% da meta)`
    ).join('\n')}

    PROJETOS (${contextData.projects.length} total):
    ${contextData.projects.map(proj => 
      `- ${proj.name}: ${proj.status} (${proj.progress || 0}% concluído)`
    ).join('\n')}

    OBJETIVOS ESTRATÉGICOS (${contextData.objectives.length} total):
    ${contextData.objectives.map(obj => 
      `- ${obj.title}: ${obj.status} (${obj.progress || 0}% concluído)`
    ).join('\n')}

    Instruções:
    - Responda em português brasileiro
    - Seja preciso e baseie suas respostas nos dados fornecidos
    - Ofereça insights práticos e acionáveis
    - Use formatação markdown quando apropriado
    - Se não tiver dados suficientes, seja honesto sobre as limitações
    - Sugira próximas ações quando relevante`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: contextPrompt
          },
          { 
            role: 'user', 
            content: message 
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Log the interaction for analytics
    await supabase.from('ai_analytics').insert([{
      user_id: user_id,
      event_type: 'chat_message',
      event_data: {
        session_id: session_id,
        user_message: message,
        ai_response: aiResponse,
        timestamp: new Date().toISOString()
      }
    }]);

    return new Response(JSON.stringify({ 
      response: aiResponse,
      success: true 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-chat function:', error);
    
    // Return a helpful fallback response
    const fallbackResponse = `Desculpe, estou com dificuldades técnicas no momento. 
    
Enquanto isso, posso sugerir algumas ações:
- Verifique o dashboard para ver o status geral
- Revise os indicadores na página de KPIs
- Consulte o progresso dos projetos
- Analise os relatórios disponíveis

Tente novamente em alguns instantes ou entre em contato com o suporte técnico.`;

    return new Response(JSON.stringify({ 
      response: fallbackResponse,
      success: false,
      error: error.message 
    }), {
      status: 200, // Return 200 so the UI can handle the error gracefully
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});