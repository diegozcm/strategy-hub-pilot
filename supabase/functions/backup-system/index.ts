import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BackupRequest {
  type: 'full' | 'incremental' | 'selective' | 'schema_only';
  tables?: string[];
  notes?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify admin permission
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role, status')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.role !== 'admin' || profile.status !== 'active') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { type = 'full', tables = [], notes = '' }: BackupRequest = await req.json();

    // Create backup job
    const { data: backupJob, error: jobError } = await supabaseClient
      .from('backup_jobs')
      .insert({
        admin_user_id: user.id,
        backup_type: type,
        tables_included: tables.length > 0 ? tables : null,
        status: 'running',
        start_time: new Date().toISOString(),
        notes: notes
      })
      .select()
      .single();

    if (jobError) {
      console.error('Error creating backup job:', jobError);
      return new Response(JSON.stringify({ error: 'Failed to create backup job' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Starting ${type} backup job ${backupJob.id}`);

    // Determine which tables to backup
    let tablesToBackup: string[] = [];
    
    if (type === 'selective' && tables.length > 0) {
      tablesToBackup = tables;
    } else {
      // Use predefined list of public tables (organized logically)
      const publicTables = [
        // Core system tables
        'companies', 'profiles', 'user_company_relations', 'user_roles', 'user_modules',
        'system_modules', 'system_settings', 'startup_hub_profiles',
        
        // Strategic planning tables
        'golden_circle', 'golden_circle_history', 'swot_analysis', 'swot_history',
        'strategic_plans', 'strategic_pillars', 'strategic_projects', 'strategic_objectives',
        
        // Key results and tracking
        'key_results', 'key_result_values', 'key_results_history',
        
        // Project management
        'project_members', 'project_objective_relations', 'project_kr_relations', 'project_tasks',
        
        // BEEP assessment system
        'beep_categories', 'beep_subcategories', 'beep_maturity_levels', 'beep_questions',
        'beep_assessments', 'beep_answers',
        
        // Mentoring system
        'mentor_startup_relations', 'mentoring_sessions', 'action_items',
        
        // AI system
        'ai_insights', 'ai_recommendations', 'ai_analytics', 'ai_chat_sessions', 
        'ai_chat_messages', 'ai_user_preferences',
        
        // Performance and reviews
        'performance_reviews',
        
        // System administration
        'backup_jobs', 'backup_files', 'backup_schedules', 'backup_restore_logs',
        'database_cleanup_logs', 'admin_impersonation_sessions',
        
        // User management
        'user_module_profiles', 'user_module_roles', 'profile_access_logs'
      ];
      tablesToBackup = publicTables;
    }

    const backupData: any = {
      metadata: {
        backup_id: backupJob.id,
        backup_type: type,
        created_at: new Date().toISOString(),
        created_by: user.id,
        tables_count: tablesToBackup.length
      },
      tables: {}
    };

    let totalRecords = 0;
    let processedTables = 0;

    for (const tableName of tablesToBackup) {
      try {
        console.log(`Backing up table: ${tableName}`);
        
        if (type === 'schema_only') {
          // For schema only, just get table structure
          backupData.tables[tableName] = {
            schema_only: true,
            backed_up_at: new Date().toISOString()
          };
        } else {
          // Get all data from table
          const { data: tableData, error: tableError } = await supabaseClient
            .from(tableName)
            .select('*');

          if (tableError) {
            console.warn(`Error backing up table ${tableName}:`, tableError);
            continue;
          }

          backupData.tables[tableName] = {
            data: tableData || [],
            record_count: tableData?.length || 0,
            backed_up_at: new Date().toISOString()
          };

          totalRecords += tableData?.length || 0;
        }

        processedTables++;

        // Update job progress
        await supabaseClient
          .from('backup_jobs')
          .update({
            processed_tables: processedTables,
            total_tables: tablesToBackup.length,
            total_records: totalRecords
          })
          .eq('id', backupJob.id);

      } catch (error) {
        console.error(`Error backing up table ${tableName}:`, error);
      }
    }

    // Create backup file
    const backupContent = JSON.stringify(backupData, null, 2);
    const backupFileName = `backup_${type}_${new Date().toISOString().split('T')[0]}_${backupJob.id}.json`;
    const backupFilePath = `backups/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${backupFileName}`;

    // Upload to storage
    const { error: uploadError } = await supabaseClient.storage
      .from('system-backups')
      .upload(backupFilePath, backupContent, {
        contentType: 'application/json'
      });

    if (uploadError) {
      console.error('Error uploading backup:', uploadError);
      
      await supabaseClient
        .from('backup_jobs')
        .update({
          status: 'failed',
          end_time: new Date().toISOString(),
          error_message: uploadError.message
        })
        .eq('id', backupJob.id);

      return new Response(JSON.stringify({ 
        error: 'Failed to upload backup file',
        backup_id: backupJob.id 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create backup file record
    await supabaseClient
      .from('backup_files')
      .insert({
        backup_job_id: backupJob.id,
        file_path: backupFilePath,
        file_name: backupFileName,
        file_size_bytes: new Blob([backupContent]).size,
        record_count: totalRecords
      });

    // Complete backup job
    const compressionRatio = new Blob([backupContent]).size / (totalRecords * 100 || 1);
    
    await supabaseClient
      .from('backup_jobs')
      .update({
        status: 'completed',
        end_time: new Date().toISOString(),
        backup_size_bytes: new Blob([backupContent]).size,
        compression_ratio: Number(compressionRatio.toFixed(2))
      })
      .eq('id', backupJob.id);

    console.log(`Backup completed: ${backupJob.id}`);

    return new Response(JSON.stringify({
      success: true,
      backup_id: backupJob.id,
      file_path: backupFilePath,
      file_name: backupFileName,
      tables_processed: processedTables,
      total_records: totalRecords,
      file_size: new Blob([backupContent]).size
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in backup-system function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

serve(handler);