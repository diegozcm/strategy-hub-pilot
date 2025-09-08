import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CleanupRequest {
  category: string
  companyId?: string
  userId?: string
  beforeDate?: string
  notes?: string
}

interface CleanupResult {
  success: boolean
  message: string
  results: Record<string, number>
  error?: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { category, companyId, userId, beforeDate, notes }: CleanupRequest = await req.json()

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify the user token and get user info
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Database cleanup requested by user ${user.id} for category: ${category}`)

    let result: CleanupResult
    let logEntry = {
      admin_user_id: user.id,
      cleanup_category: category,
      filter_criteria: {
        companyId: companyId || null,
        userId: userId || null,
        beforeDate: beforeDate || null
      },
      notes: notes || null,
      records_deleted: 0,
      success: false,
      error_details: null
    }

    // Execute the appropriate cleanup function based on category
    switch (category) {
      case 'mentoring': {
        const { data, error } = await supabase.rpc('cleanup_mentoring_data', {
          _admin_id: user.id,
          _company_id: companyId || null,
          _before_date: beforeDate || null
        })

        if (error) throw error

        const cleanupData = data?.[0]
        if (cleanupData?.success) {
          result = {
            success: true,
            message: cleanupData.message,
            results: {
              sessions: cleanupData.deleted_sessions || 0,
              relations: cleanupData.deleted_relations || 0,
              actions: cleanupData.deleted_actions || 0
            }
          }
          logEntry.records_deleted = (cleanupData.deleted_sessions || 0) + 
                                   (cleanupData.deleted_relations || 0) + 
                                   (cleanupData.deleted_actions || 0)
          logEntry.success = true
        } else {
          throw new Error(cleanupData?.message || 'Falha na limpeza de dados')
        }
        break
      }

      case 'strategic': {
        const { data, error } = await supabase.rpc('cleanup_strategic_data', {
          _admin_id: user.id,
          _company_id: companyId || null
        })

        if (error) throw error

        const cleanupData = data?.[0]
        if (cleanupData?.success) {
          result = {
            success: true,
            message: cleanupData.message,
            results: {
              plans: cleanupData.deleted_plans || 0,
              pillars: cleanupData.deleted_pillars || 0,
              objectives: cleanupData.deleted_objectives || 0,
              projects: cleanupData.deleted_projects || 0
            }
          }
          logEntry.records_deleted = (cleanupData.deleted_plans || 0) + 
                                   (cleanupData.deleted_pillars || 0) + 
                                   (cleanupData.deleted_objectives || 0) + 
                                   (cleanupData.deleted_projects || 0)
          logEntry.success = true
        } else {
          throw new Error(cleanupData?.message || 'Falha na limpeza de dados')
        }
        break
      }

      case 'metrics': {
        const { data, error } = await supabase.rpc('cleanup_metrics_data', {
          _admin_id: user.id,
          _company_id: companyId || null
        })

        if (error) throw error

        const cleanupData = data?.[0]
        if (cleanupData?.success) {
          result = {
            success: true,
            message: cleanupData.message,
            results: {
              history: cleanupData.deleted_history || 0,
              values: cleanupData.deleted_values || 0,
              results: cleanupData.deleted_results || 0
            }
          }
          logEntry.records_deleted = (cleanupData.deleted_history || 0) + 
                                   (cleanupData.deleted_values || 0) + 
                                   (cleanupData.deleted_results || 0)
          logEntry.success = true
        } else {
          throw new Error(cleanupData?.message || 'Falha na limpeza de dados')
        }
        break
      }

      case 'analyses': {
        const { data, error } = await supabase.rpc('cleanup_analyses_data', {
          _admin_id: user.id,
          _company_id: companyId || null
        })

        if (error) throw error

        const cleanupData = data?.[0]
        if (cleanupData?.success) {
          result = {
            success: true,
            message: cleanupData.message,
            results: {
              gcHistory: cleanupData.deleted_gc_history || 0,
              goldenCircle: cleanupData.deleted_gc || 0,
              swotHistory: cleanupData.deleted_swot_history || 0,
              swot: cleanupData.deleted_swot || 0
            }
          }
          logEntry.records_deleted = (cleanupData.deleted_gc_history || 0) + 
                                   (cleanupData.deleted_gc || 0) + 
                                   (cleanupData.deleted_swot_history || 0) + 
                                   (cleanupData.deleted_swot || 0)
          logEntry.success = true
        } else {
          throw new Error(cleanupData?.message || 'Falha na limpeza de dados')
        }
        break
      }

      case 'beep': {
        const { data, error } = await supabase.rpc('cleanup_beep_data', {
          _admin_id: user.id,
          _company_id: companyId || null
        })

        if (error) throw error

        const cleanupData = data?.[0]
        if (cleanupData?.success) {
          result = {
            success: true,
            message: cleanupData.message,
            results: {
              answers: cleanupData.deleted_answers || 0,
              assessments: cleanupData.deleted_assessments || 0
            }
          }
          logEntry.records_deleted = (cleanupData.deleted_answers || 0) + 
                                   (cleanupData.deleted_assessments || 0)
          logEntry.success = true
        } else {
          throw new Error(cleanupData?.message || 'Falha na limpeza de dados')
        }
        break
      }

      case 'ai': {
        const { data, error } = await supabase.rpc('cleanup_ai_data', {
          _admin_id: user.id,
          _user_id: userId || null
        })

        if (error) throw error

        const cleanupData = data?.[0]
        if (cleanupData?.success) {
          result = {
            success: true,
            message: cleanupData.message,
            results: {
              messages: cleanupData.deleted_messages || 0,
              sessions: cleanupData.deleted_sessions || 0,
              insights: cleanupData.deleted_insights || 0,
              recommendations: cleanupData.deleted_recommendations || 0,
              analytics: cleanupData.deleted_analytics || 0
            }
          }
          logEntry.records_deleted = (cleanupData.deleted_messages || 0) + 
                                   (cleanupData.deleted_sessions || 0) + 
                                   (cleanupData.deleted_insights || 0) + 
                                   (cleanupData.deleted_recommendations || 0) + 
                                   (cleanupData.deleted_analytics || 0)
          logEntry.success = true
        } else {
          throw new Error(cleanupData?.message || 'Falha na limpeza de dados')
        }
        break
      }

      case 'performance': {
        const { data, error } = await supabase.rpc('cleanup_performance_data', {
          _admin_id: user.id,
          _user_id: userId || null
        })

        if (error) throw error

        const cleanupData = data?.[0]
        if (cleanupData?.success) {
          result = {
            success: true,
            message: cleanupData.message,
            results: {
              reviews: cleanupData.deleted_reviews || 0
            }
          }
          logEntry.records_deleted = cleanupData.deleted_reviews || 0
          logEntry.success = true
        } else {
          throw new Error(cleanupData?.message || 'Falha na limpeza de dados')
        }
        break
      }

      default:
        throw new Error(`Categoria de limpeza não suportada: ${category}`)
    }

    // Log the cleanup operation
    const { error: logError } = await supabase
      .from('database_cleanup_logs')
      .insert(logEntry)

    if (logError) {
      console.error('Error logging cleanup operation:', logError)
      // Don't fail the operation just because logging failed
    }

    console.log(`Cleanup completed successfully: ${JSON.stringify(result)}`)

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Database cleanup error:', error)
    
    const errorResult: CleanupResult = {
      success: false,
      message: 'Erro interno do servidor',
      results: {},
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }

    return new Response(
      JSON.stringify(errorResult),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})