import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('AI Chat function called');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, session_id, user_id, company_id } = await req.json();
    console.log('Request params:', { message: message?.substring(0, 100), session_id, user_id, company_id });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get AI settings for the company
    let aiSettings = null;
    if (company_id) {
      const { data: settingsData } = await supabase
        .from('ai_company_settings')
        .select('*')
        .eq('company_id', company_id)
        .single();
      aiSettings = settingsData;
    }

    // Use default settings if none found
    const model = aiSettings?.model || 'gpt-4o-mini';
    const temperature = aiSettings?.temperature || 0.7;
    const maxTokens = aiSettings?.max_tokens || 1000;
    const systemPrompt = aiSettings?.system_prompt || 'Você é um assistente especializado em análise estratégica e gestão empresarial. Forneça insights precisos e acionáveis.';

    console.log('Using AI settings:', { model, temperature, maxTokens });

    console.log('Fetching context data...');
    
    // Fetch context data from Supabase
    const [keyResultsResponse, projectsResponse, objectivesResponse] = await Promise.all([
      supabase.from('key_results').select('title, description, current_value, target_value').limit(10),
      supabase.from('strategic_projects').select('name, description, status, progress').limit(10),
      supabase.from('strategic_objectives').select('title, description').limit(10)
    ]);

    console.log('Context data fetched:', {
      keyResults: keyResultsResponse.data?.length || 0,
      projects: projectsResponse.data?.length || 0,
      objectives: objectivesResponse.data?.length || 0
    });

    const contextData = {
      keyResults: keyResultsResponse.data || [],
      projects: projectsResponse.data || [],
      objectives: objectivesResponse.data || []
    };

    // Create a comprehensive prompt with context
    const contextPrompt = `${systemPrompt}

Use os seguintes dados da empresa para fornecer insights precisos e acionáveis:

RESULTADOS CHAVE:
${contextData.keyResults.map(kr => `- ${kr.title}: ${kr.current_value}/${kr.target_value} (${kr.description})`).join('\n')}

PROJETOS ESTRATÉGICOS:
${contextData.projects.map(p => `- ${p.name}: ${p.status} - Progress: ${p.progress}% (${p.description})`).join('\n')}

OBJETIVOS ESTRATÉGICOS:
${contextData.objectives.map(o => `- ${o.title}: ${o.description}`).join('\n')}

Forneça respostas específicas baseadas nestes dados. Se não houver dados relevantes, sugira ações para melhorar a gestão estratégica.`;

    // Try different models if the configured one fails
    const modelsToTry = [
      model,
      'gpt-3.5-turbo', // Fallback option
      'gpt-4o', // Another fallback
    ].filter((m, i, arr) => arr.indexOf(m) === i); // Remove duplicates

    let aiResponse = null;
    let modelUsed = null;
    let tokensUsed = 0;

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Try models in sequence
    for (const tryModel of modelsToTry) {
      try {
        console.log(`Trying model: ${tryModel}`);
        
        // Prepare request body based on model
        const requestBody: any = {
          model: tryModel,
          messages: [
            { role: 'system', content: contextPrompt },
            { role: 'user', content: message }
          ],
        };

        // Add parameters based on model capabilities
        if (tryModel.includes('gpt-3.5') || tryModel === 'gpt-4o' || tryModel === 'gpt-4o-mini') {
          requestBody.temperature = temperature;
          requestBody.max_tokens = maxTokens;
        } else {
          // For newer models that might not support temperature
          requestBody.max_completion_tokens = maxTokens;
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Model ${tryModel} failed:`, errorText);
          
          // If it's a 403 or model_not_found error, try the next model
          if (response.status === 403 || errorText.includes('model_not_found')) {
            continue;
          }
          
          throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        aiResponse = data.choices[0].message.content;
        modelUsed = tryModel;
        tokensUsed = data.usage?.total_tokens || 0;
        console.log(`Success with model: ${tryModel}`);
        break;

      } catch (error) {
        console.error(`Error with model ${tryModel}:`, error);
        // Continue to next model
      }
    }

    // If all models failed, generate a context-aware fallback response
    if (!aiResponse) {
      console.log('All models failed, generating context-aware fallback');
      
      let contextSummary = "Com base nos dados disponíveis:\n\n";
      
      if (contextData.keyResults.length > 0) {
        contextSummary += "📊 **Resultados Chave:**\n";
        contextData.keyResults.slice(0, 3).forEach(kr => {
          const progress = kr.target_value > 0 ? Math.round((kr.current_value / kr.target_value) * 100) : 0;
          contextSummary += `• ${kr.title}: ${progress}% concluído\n`;
        });
        contextSummary += "\n";
      }

      if (contextData.projects.length > 0) {
        contextSummary += "🎯 **Projetos Estratégicos:**\n";
        contextData.projects.slice(0, 3).forEach(p => {
          contextSummary += `• ${p.name}: ${p.status} (${p.progress}%)\n`;
        });
        contextSummary += "\n";
      }

      if (contextData.objectives.length > 0) {
        contextSummary += "🎯 **Objetivos Ativos:**\n";
        contextData.objectives.slice(0, 2).forEach(o => {
          contextSummary += `• ${o.title}\n`;
        });
        contextSummary += "\n";
      }

      contextSummary += `**Sobre sua pergunta:** "${message}"\n\n`;
      contextSummary += "Desculpe, estou com dificuldades técnicas no momento, mas posso sugerir:\n\n";
      contextSummary += "• Revisar o progresso dos indicadores no dashboard\n";
      contextSummary += "• Analisar os projetos que precisam de atenção\n";
      contextSummary += "• Consultar os relatórios detalhados disponíveis\n\n";
      contextSummary += "Tente novamente em alguns instantes.";

      aiResponse = contextSummary;
      modelUsed = 'context-fallback';
    }

    console.log('AI response generated successfully');

    // Log the interaction to analytics
    try {
      await supabase.from('ai_analytics').insert({
        user_id: user_id,
        session_id: session_id,
        prompt: message,
        response: aiResponse,
        model_used: modelUsed,
        tokens_used: tokensUsed,
        response_time_ms: Date.now() - Date.now(), // This should be calculated properly
        success: true
      });
      console.log('Analytics logged successfully');
    } catch (analyticsError) {
      console.error('Error logging analytics:', analyticsError);
      // Don't fail the main request due to analytics error
    }

    return new Response(JSON.stringify({ 
      response: aiResponse,
      success: true,
      model_used: modelUsed
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-chat function:', error);
    
    // Return a context-aware fallback response
    const fallbackResponse = `Desculpe, estou com dificuldades técnicas no momento. 
    
Enquanto isso, posso sugerir algumas ações baseadas no que sei sobre sua empresa:
• Revisar o dashboard para acompanhar o status geral
• Verificar o progresso dos projetos estratégicos
• Analisar os indicadores de performance (KPIs)
• Consultar os relatórios disponíveis para insights

Tente novamente em alguns instantes ou entre em contato com o suporte técnico.`;

    // Try to log the error to analytics
    try {
      const { user_id, session_id } = await req.json().catch(() => ({}));
      if (user_id && session_id) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        await supabase.from('ai_analytics').insert({
          user_id: user_id,
          session_id: session_id,
          prompt: 'Error occurred',
          response: fallbackResponse,
          model_used: 'error-fallback',
          tokens_used: 0,
          response_time_ms: 0,
          success: false,
          error_message: error.message
        });
      }
    } catch (analyticsError) {
      console.error('Error logging error analytics:', analyticsError);
    }

    return new Response(JSON.stringify({ 
      response: fallbackResponse,
      success: true,
      model_used: 'error-fallback'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});