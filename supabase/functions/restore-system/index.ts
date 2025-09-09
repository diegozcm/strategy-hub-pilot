import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5'
import { corsHeaders } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface RestoreRequest {
  backupJobId: string
  targetTables?: string[]
  conflictStrategy: 'replace' | 'skip' | 'merge'
  createBackupBeforeRestore: boolean
  notes?: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header is required');
    }

    // Set the user context for RLS
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    // Verify user is admin
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role, status')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin' || profile.status !== 'active') {
      throw new Error('Access denied. Admin role required.');
    }

    const restoreRequest: RestoreRequest = await req.json();
    const { backupJobId, targetTables, conflictStrategy, createBackupBeforeRestore, notes } = restoreRequest;

    console.log(`Starting restore job for backup ${backupJobId}`);

    // Get backup job info
    const { data: backupJob, error: backupJobError } = await supabaseClient
      .from('backup_jobs')
      .select('*, backup_files(*)')
      .eq('id', backupJobId)
      .single();

    if (backupJobError || !backupJob) {
      throw new Error('Backup job not found');
    }

    if (backupJob.status !== 'completed') {
      throw new Error('Can only restore from completed backups');
    }

    const backupFile = backupJob.backup_files?.[0];
    if (!backupFile) {
      throw new Error('No backup file found for this job');
    }

    // Create restore log entry
    const { data: restoreLog, error: restoreLogError } = await supabaseClient
      .from('backup_restore_logs')
      .insert({
        backup_job_id: backupJobId,
        admin_user_id: user.id,
        restore_type: targetTables ? 'selective' : 'full',
        status: 'pending',
        notes: notes || `Restore from backup created at ${new Date(backupJob.created_at).toLocaleString()}`,
        start_time: new Date().toISOString()
      })
      .select()
      .single();

    if (restoreLogError) {
      throw new Error(`Failed to create restore log: ${restoreLogError.message}`);
    }

    console.log(`Created restore log ${restoreLog.id}`);

    // Optional: Create backup before restore
    if (createBackupBeforeRestore) {
      console.log('Creating safety backup before restore...');
      
      const { data: safetyBackup } = await supabaseClient.functions.invoke('backup-system', {
        body: {
          type: 'full',
          notes: `Safety backup before restore of ${backupJobId}`
        }
      });

      console.log('Safety backup created:', safetyBackup?.backup_id);
    }

    // Download backup file from storage
    const { data: fileData, error: downloadError } = await supabaseClient.storage
      .from('system-backups')
      .download(backupFile.file_path);

    if (downloadError || !fileData) {
      await supabaseClient
        .from('backup_restore_logs')
        .update({
          status: 'failed',
          end_time: new Date().toISOString(),
          error_message: `Failed to download backup file: ${downloadError?.message}`
        })
        .eq('id', restoreLog.id);

      throw new Error('Failed to download backup file');
    }

    // Parse backup data
    const backupText = await fileData.text();
    const backupData = JSON.parse(backupText);

    if (!backupData.tables || typeof backupData.tables !== 'object') {
      throw new Error('Invalid backup file format');
    }

    // Determine tables to restore
    const tablesToRestore = targetTables || Object.keys(backupData.tables);
    const tablesRestored: string[] = [];
    let totalRecordsRestored = 0;

    console.log(`Restoring ${tablesToRestore.length} tables with strategy: ${conflictStrategy}`);

    // Update restore log with progress
    await supabaseClient
      .from('backup_restore_logs')
      .update({
        status: 'in_progress',
        tables_restored: tablesToRestore
      })
      .eq('id', restoreLog.id);

    // Restore each table
    for (const tableName of tablesToRestore) {
      console.log(`Restoring table: ${tableName}`);
      
      const tableData = backupData.tables[tableName];
      if (!tableData || !Array.isArray(tableData)) {
        console.log(`No data found for table ${tableName}, skipping`);
        continue;
      }

      try {
        if (conflictStrategy === 'replace') {
          // Clear existing data
          await supabaseClient.from(tableName).delete().neq('id', '00000000-0000-0000-0000-000000000000');
          console.log(`Cleared existing data from ${tableName}`);
        }

        // Insert data in batches
        const batchSize = 100;
        for (let i = 0; i < tableData.length; i += batchSize) {
          const batch = tableData.slice(i, i + batchSize);
          
          if (conflictStrategy === 'skip') {
            // Use upsert with on_conflict do nothing
            const { error: insertError } = await supabaseClient
              .from(tableName)
              .upsert(batch, { onConflict: 'id', ignoreDuplicates: true });

            if (insertError) {
              console.warn(`Error inserting batch to ${tableName}:`, insertError.message);
            }
          } else {
            // Direct insert or upsert
            const { error: insertError } = await supabaseClient
              .from(tableName)
              .upsert(batch, { onConflict: 'id' });

            if (insertError) {
              console.warn(`Error inserting batch to ${tableName}:`, insertError.message);
            }
          }
        }

        tablesRestored.push(tableName);
        totalRecordsRestored += tableData.length;
        console.log(`Restored ${tableData.length} records to ${tableName}`);

      } catch (tableError) {
        console.error(`Error restoring table ${tableName}:`, tableError);
        // Continue with other tables
      }
    }

    // Update restore log as completed
    await supabaseClient
      .from('backup_restore_logs')
      .update({
        status: 'completed',
        end_time: new Date().toISOString(),
        records_restored: totalRecordsRestored,
        tables_restored: tablesRestored
      })
      .eq('id', restoreLog.id);

    console.log(`Restore completed: ${totalRecordsRestored} records in ${tablesRestored.length} tables`);

    return new Response(
      JSON.stringify({
        success: true,
        restore_log_id: restoreLog.id,
        tables_restored: tablesRestored,
        records_restored: totalRecordsRestored,
        message: `Successfully restored ${totalRecordsRestored} records from ${tablesRestored.length} tables`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Restore error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});