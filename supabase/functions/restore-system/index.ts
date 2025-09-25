// @ts-nocheck
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
        restore_type: targetTables ? 'selective' : 'full',
        tables_restored: tablesToRestore
      })
      .eq('id', restoreLog.id);

    // Create admin client that bypasses RLS for restore operations
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          'x-admin-override': 'true'
        }
      }
    });

    // Restore each table
    for (const tableName of tablesToRestore) {
      console.log(`Restoring table: ${tableName}`);
      
      const tableInfo = backupData.tables[tableName];
      if (!tableInfo || !tableInfo.data || !Array.isArray(tableInfo.data)) {
        console.log(`No data found for table ${tableName}, skipping`);
        continue;
      }

      const tableData = tableInfo.data;
      console.log(`Table ${tableName} has ${tableData.length} records to restore (backup recorded ${tableInfo.record_count} records)`);

      try {
        let recordsProcessed = 0;
        
        if (conflictStrategy === 'replace') {
          // Clear existing data - use proper delete all syntax
          const { error: deleteError, count: deleteCount } = await adminClient
            .from(tableName)
            .delete()
            .gte('created_at', '1900-01-01');
          
          if (deleteError) {
            console.error(`Error clearing table ${tableName}:`, deleteError);
            throw deleteError;
          }
          console.log(`Cleared ${deleteCount || 'all'} existing records from ${tableName}`);
        }

        // Insert data in batches
        const batchSize = 50; // Reduced batch size for better error handling
        for (let i = 0; i < tableData.length; i += batchSize) {
          const batch = tableData.slice(i, i + batchSize);
          
          try {
            let result;
            if (conflictStrategy === 'skip') {
              // Use upsert with on_conflict do nothing
              result = await adminClient
                .from(tableName)
                .upsert(batch, { onConflict: 'id', ignoreDuplicates: true });
            } else {
              // Direct insert or upsert
              result = await adminClient
                .from(tableName)
                .upsert(batch, { onConflict: 'id' });
            }

            if (result.error) {
              console.error(`Error inserting batch ${i}-${i + batch.length} to ${tableName}:`, result.error);
              console.error('Failed batch data sample:', JSON.stringify(batch[0], null, 2));
              
              // Try individual inserts to identify problematic records
              for (const record of batch) {
                try {
                  const singleResult = await adminClient
                    .from(tableName)
                    .upsert([record], { onConflict: 'id' });
                  
                  if (singleResult.error) {
                    console.error(`Failed to insert individual record in ${tableName}:`, singleResult.error);
                    console.error('Problematic record:', JSON.stringify(record, null, 2));
                  } else {
                    recordsProcessed++;
                  }
                } catch (singleError) {
                  console.error(`Exception inserting single record in ${tableName}:`, singleError);
                }
              }
            } else {
              recordsProcessed += batch.length;
              console.log(`Successfully inserted batch ${i}-${i + batch.length} to ${tableName}`);
            }
          } catch (batchError) {
            console.error(`Exception processing batch ${i}-${i + batch.length} for ${tableName}:`, batchError);
          }
        }

        if (recordsProcessed > 0) {
          tablesRestored.push(tableName);
          totalRecordsRestored += recordsProcessed;
          console.log(`Successfully restored ${recordsProcessed}/${tableData.length} records to ${tableName}`);
        } else {
          console.warn(`No records were restored to ${tableName} despite having ${tableData.length} records in backup`);
        }

      } catch (tableError) {
        console.error(`Error restoring table ${tableName}:`, tableError);
        console.error('Table error details:', {
          message: tableError.message,
          hint: tableError.hint,
          details: tableError.details,
          code: tableError.code
        });
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