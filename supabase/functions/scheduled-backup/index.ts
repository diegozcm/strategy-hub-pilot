import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5'
import { corsHeaders } from '../_shared/cors.ts'

interface BackupSchedule {
  id: string
  schedule_name: string
  backup_type: 'full' | 'incremental' | 'selective' | 'schema-only'
  cron_expression: string
  tables_included?: string[]
  notes?: string
  next_run: string
  last_run?: string
  is_active: boolean
}

interface BackupRequest {
  type: 'full' | 'incremental' | 'selective' | 'schema-only'
  tables?: string[]
  notes: string
  schedule_id: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🕐 Scheduled backup function started')
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get all active schedules that are due for execution
    const { data: schedules, error: schedulesError } = await supabase
      .from('backup_schedules')
      .select('*')
      .eq('is_active', true)
      .lte('next_run', new Date().toISOString())

    if (schedulesError) {
      console.error('❌ Error fetching schedules:', schedulesError)
      throw schedulesError
    }

    if (!schedules || schedules.length === 0) {
      console.log('✅ No schedules due for execution')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No schedules due for execution',
          executed_schedules: 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    console.log(`📋 Found ${schedules.length} schedules due for execution`)

    const executionResults = []

    // Execute each due schedule
    for (const schedule of schedules as BackupSchedule[]) {
      console.log(`🚀 Executing schedule: ${schedule.schedule_name}`)
      
      try {
        // Execute the backup
        const backupResult = await executeScheduledBackup(supabase, schedule)
        
        if (backupResult.success) {
          // Perform backup rotation (keep only 5 most recent)
          await performBackupRotation(supabase, schedule.id)
          
          // Update schedule's last_run and next_run
          await updateScheduleNextRun(supabase, schedule)
          
          console.log(`✅ Schedule ${schedule.schedule_name} executed successfully`)
          executionResults.push({
            schedule_id: schedule.id,
            schedule_name: schedule.schedule_name,
            success: true,
            backup_job_id: backupResult.backup_job_id
          })
        } else {
          console.error(`❌ Schedule ${schedule.schedule_name} failed:`, backupResult.error)
          executionResults.push({
            schedule_id: schedule.id,
            schedule_name: schedule.schedule_name,
            success: false,
            error: backupResult.error
          })
        }
      } catch (error) {
        console.error(`❌ Error executing schedule ${schedule.schedule_name}:`, error)
        executionResults.push({
          schedule_id: schedule.id,
          schedule_name: schedule.schedule_name,
          success: false,
          error: error.message
        })
      }
    }

    const successCount = executionResults.filter(r => r.success).length
    console.log(`🎯 Executed ${successCount}/${schedules.length} schedules successfully`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Executed ${successCount}/${schedules.length} schedules`,
        executed_schedules: schedules.length,
        results: executionResults
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('❌ Scheduled backup function error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

async function executeScheduledBackup(supabase: any, schedule: BackupSchedule) {
  try {
    // Create backup job record
    const { data: backupJob, error: jobError } = await supabase
      .from('backup_jobs')
      .insert({
        admin_user_id: '00000000-0000-0000-0000-000000000000', // System user
        backup_type: schedule.backup_type,
        status: 'pending',
        notes: `Backup automático: ${schedule.schedule_name}`,
        tables_included: schedule.tables_included || []
      })
      .select()
      .single()

    if (jobError) {
      throw new Error(`Failed to create backup job: ${jobError.message}`)
    }

    console.log(`📝 Created backup job: ${backupJob.id}`)

    // Update job status to running
    await supabase
      .from('backup_jobs')
      .update({ 
        status: 'running',
        start_time: new Date().toISOString(),
        processed_tables: 0,
        total_records: 0
      })
      .eq('id', backupJob.id)

    // Get all table names from information_schema
    const { data: allTables, error: tablesError } = await supabase.rpc('get_table_names')
    
    if (tablesError) {
      throw new Error(`Failed to get table names: ${tablesError.message}`)
    }

    // Determine which tables to backup
    let tablesToBackup = []
    if (schedule.backup_type === 'selective' && schedule.tables_included) {
      tablesToBackup = schedule.tables_included
    } else if (schedule.backup_type === 'schema-only') {
      tablesToBackup = allTables // Will only backup schema
    } else {
      // Full or incremental backup
      tablesToBackup = allTables.filter((table: string) => 
        !table.startsWith('_') && 
        table !== 'spatial_ref_sys' &&
        !table.includes('pg_')
      )
    }

    let totalRecords = 0
    let backupData: any = {}

    // Update total tables count
    await supabase
      .from('backup_jobs')
      .update({ total_tables: tablesToBackup.length })
      .eq('id', backupJob.id)

    // Process each table
    for (let i = 0; i < tablesToBackup.length; i++) {
      const tableName = tablesToBackup[i]
      console.log(`📊 Processing table: ${tableName} (${i + 1}/${tablesToBackup.length})`)

      try {
        if (schedule.backup_type === 'schema-only') {
          // For schema-only, we just store table structure info
          backupData[tableName] = { schema_only: true, table_name: tableName }
        } else {
          // Get table data
          const { data: tableData, error: tableError } = await supabase
            .from(tableName)
            .select('*')

          if (tableError) {
            console.warn(`⚠️ Could not backup table ${tableName}: ${tableError.message}`)
            backupData[tableName] = { error: tableError.message }
          } else {
            backupData[tableName] = tableData || []
            totalRecords += (tableData || []).length
          }
        }

        // Update progress
        await supabase
          .from('backup_jobs')
          .update({ 
            processed_tables: i + 1,
            total_records: totalRecords
          })
          .eq('id', backupJob.id)

      } catch (tableError) {
        console.warn(`⚠️ Error processing table ${tableName}:`, tableError)
        backupData[tableName] = { error: tableError.message }
      }
    }

    // Create backup file content
    const backupContent = JSON.stringify({
      metadata: {
        backup_id: backupJob.id,
        backup_type: schedule.backup_type,
        created_at: new Date().toISOString(),
        schedule_name: schedule.schedule_name,
        total_tables: tablesToBackup.length,
        total_records: totalRecords
      },
      data: backupData
    }, null, 2)

    const backupSizeBytes = new TextEncoder().encode(backupContent).length

    // Upload to storage
    const fileName = `scheduled-backup-${schedule.schedule_name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}-${backupJob.id}.json`
    const filePath = `scheduled/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('system-backups')
      .upload(filePath, backupContent, {
        contentType: 'application/json',
        upsert: true
      })

    if (uploadError) {
      throw new Error(`Failed to upload backup: ${uploadError.message}`)
    }

    console.log(`💾 Backup uploaded to: ${filePath}`)

    // Create backup file record
    await supabase
      .from('backup_files')
      .insert({
        backup_job_id: backupJob.id,
        file_name: fileName,
        file_path: filePath,
        file_size_bytes: backupSizeBytes,
        storage_bucket: 'system-backups'
      })

    // Update backup job as completed
    await supabase
      .from('backup_jobs')
      .update({
        status: 'completed',
        end_time: new Date().toISOString(),
        backup_size_bytes: backupSizeBytes,
        compression_ratio: 1.0
      })
      .eq('id', backupJob.id)

    console.log(`✅ Backup completed successfully: ${backupJob.id}`)

    return {
      success: true,
      backup_job_id: backupJob.id,
      file_path: filePath,
      size_bytes: backupSizeBytes
    }

  } catch (error) {
    console.error('❌ Backup execution error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

async function performBackupRotation(supabase: any, scheduleId: string) {
  try {
    console.log(`🔄 Performing backup rotation for schedule: ${scheduleId}`)

    // Get all backup jobs for this schedule, ordered by creation date (newest first)
    const { data: backupJobs, error: jobsError } = await supabase
      .from('backup_jobs')
      .select(`
        id,
        created_at,
        backup_files (
          id,
          file_path,
          storage_bucket
        )
      `)
      .eq('notes', `Backup automático: ${scheduleId}`)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })

    if (jobsError) {
      throw new Error(`Failed to get backup jobs: ${jobsError.message}`)
    }

    if (!backupJobs || backupJobs.length <= 5) {
      console.log(`✅ No rotation needed. Current backups: ${backupJobs?.length || 0}`)
      return
    }

    // Keep only the 5 most recent, delete the rest
    const backupsToDelete = backupJobs.slice(5)
    console.log(`🗑️ Deleting ${backupsToDelete.length} old backups`)

    for (const backup of backupsToDelete) {
      try {
        // Delete from storage
        if (backup.backup_files && backup.backup_files.length > 0) {
          for (const file of backup.backup_files) {
            await supabase.storage
              .from(file.storage_bucket)
              .remove([file.file_path])
            
            console.log(`🗑️ Deleted file: ${file.file_path}`)
          }
        }

        // Delete backup files records
        await supabase
          .from('backup_files')
          .delete()
          .eq('backup_job_id', backup.id)

        // Delete backup job record
        await supabase
          .from('backup_jobs')
          .delete()
          .eq('id', backup.id)

        console.log(`✅ Deleted backup job: ${backup.id}`)

      } catch (deleteError) {
        console.error(`❌ Error deleting backup ${backup.id}:`, deleteError)
      }
    }

    console.log(`✅ Backup rotation completed. Kept 5 most recent backups.`)

  } catch (error) {
    console.error('❌ Backup rotation error:', error)
  }
}

async function updateScheduleNextRun(supabase: any, schedule: BackupSchedule) {
  try {
    // Simple cron parsing - for now just add the interval based on cron expression
    const now = new Date()
    let nextRun = new Date(now)

    // Parse cron expression (minute hour day month dayofweek)
    const cronParts = schedule.cron_expression.split(' ')
    
    if (cronParts.length >= 5) {
      const minute = cronParts[0]
      const hour = cronParts[1]
      const day = cronParts[2]
      const month = cronParts[3]
      const dayOfWeek = cronParts[4]

      // Simple logic for common patterns
      if (minute === '0' && hour === '0' && day === '*') {
        // Daily at midnight
        nextRun.setDate(nextRun.getDate() + 1)
        nextRun.setHours(0, 0, 0, 0)
      } else if (minute === '0' && hour === '*') {
        // Every hour
        nextRun.setHours(nextRun.getHours() + 1)
        nextRun.setMinutes(0, 0, 0)
      } else if (minute === '*') {
        // Every minute
        nextRun.setMinutes(nextRun.getMinutes() + 1)
        nextRun.setSeconds(0, 0)
      } else {
        // Default: add 1 day
        nextRun.setDate(nextRun.getDate() + 1)
      }
    } else {
      // Default: add 1 day
      nextRun.setDate(nextRun.getDate() + 1)
    }

    // Update schedule
    await supabase
      .from('backup_schedules')
      .update({
        last_run: now.toISOString(),
        next_run: nextRun.toISOString(),
        updated_at: now.toISOString()
      })
      .eq('id', schedule.id)

    console.log(`📅 Updated schedule ${schedule.id}: next_run = ${nextRun.toISOString()}`)

  } catch (error) {
    console.error(`❌ Error updating schedule ${schedule.id}:`, error)
  }
}
