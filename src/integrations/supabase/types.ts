export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      action_items: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          priority: string
          session_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          session_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          session_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_action_items_session"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "mentoring_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_impersonation_sessions: {
        Row: {
          admin_user_id: string
          created_at: string
          ended_at: string | null
          id: string
          impersonated_user_id: string
          is_active: boolean
          started_at: string
          updated_at: string
        }
        Insert: {
          admin_user_id: string
          created_at?: string
          ended_at?: string | null
          id?: string
          impersonated_user_id: string
          is_active?: boolean
          started_at?: string
          updated_at?: string
        }
        Update: {
          admin_user_id?: string
          created_at?: string
          ended_at?: string | null
          id?: string
          impersonated_user_id?: string
          is_active?: boolean
          started_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_analytics: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_chat_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          message_type: string | null
          metadata: Json | null
          role: string
          session_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          message_type?: string | null
          metadata?: Json | null
          role: string
          session_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          message_type?: string | null
          metadata?: Json | null
          role?: string
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ai_chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_chat_sessions: {
        Row: {
          company_id: string | null
          created_at: string | null
          id: string
          session_title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          session_title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          session_title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_company_settings: {
        Row: {
          agent_profile: string
          company_id: string
          created_at: string
          created_by: string
          id: string
          max_tokens: number
          model: string
          system_prompt: string | null
          temperature: number
          updated_at: string
          updated_by: string
          voice_enabled: boolean
          voice_id: string | null
          voice_model: string | null
          web_search_enabled: boolean
        }
        Insert: {
          agent_profile?: string
          company_id: string
          created_at?: string
          created_by: string
          id?: string
          max_tokens?: number
          model?: string
          system_prompt?: string | null
          temperature?: number
          updated_at?: string
          updated_by: string
          voice_enabled?: boolean
          voice_id?: string | null
          voice_model?: string | null
          web_search_enabled?: boolean
        }
        Update: {
          agent_profile?: string
          company_id?: string
          created_at?: string
          created_by?: string
          id?: string
          max_tokens?: number
          model?: string
          system_prompt?: string | null
          temperature?: number
          updated_at?: string
          updated_by?: string
          voice_enabled?: boolean
          voice_id?: string | null
          voice_model?: string | null
          web_search_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "ai_company_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_insights: {
        Row: {
          actionable: boolean | null
          category: string
          company_id: string | null
          confidence_score: number | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string | null
          description: string | null
          id: string
          insight_type: string
          metadata: Json | null
          related_entity_id: string | null
          related_entity_type: string | null
          severity: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actionable?: boolean | null
          category: string
          company_id?: string | null
          confidence_score?: number | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          insight_type: string
          metadata?: Json | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          severity?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actionable?: boolean | null
          category?: string
          company_id?: string | null
          confidence_score?: number | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          insight_type?: string
          metadata?: Json | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          severity?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_recommendations: {
        Row: {
          action_type: string
          assigned_to: string | null
          created_at: string | null
          deadline: string | null
          description: string | null
          effort_required: string | null
          estimated_impact: string | null
          feedback: string | null
          id: string
          insight_id: string | null
          priority: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          action_type: string
          assigned_to?: string | null
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          effort_required?: string | null
          estimated_impact?: string | null
          feedback?: string | null
          id?: string
          insight_id?: string | null
          priority?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          action_type?: string
          assigned_to?: string | null
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          effort_required?: string | null
          estimated_impact?: string | null
          feedback?: string | null
          id?: string
          insight_id?: string | null
          priority?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_recommendations_insight_id_fkey"
            columns: ["insight_id"]
            isOneToOne: false
            referencedRelation: "ai_insights"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_user_preferences: {
        Row: {
          auto_dismiss_low_priority: boolean | null
          created_at: string | null
          id: string
          insight_categories: string[] | null
          min_confidence_score: number | null
          notification_frequency: string | null
          preferences: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_dismiss_low_priority?: boolean | null
          created_at?: string | null
          id?: string
          insight_categories?: string[] | null
          min_confidence_score?: number | null
          notification_frequency?: string | null
          preferences?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_dismiss_low_priority?: boolean | null
          created_at?: string | null
          id?: string
          insight_categories?: string[] | null
          min_confidence_score?: number | null
          notification_frequency?: string | null
          preferences?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      backup_files: {
        Row: {
          backup_job_id: string
          checksum: string | null
          created_at: string
          file_name: string
          file_path: string
          file_size_bytes: number
          id: string
          record_count: number | null
          table_name: string | null
        }
        Insert: {
          backup_job_id: string
          checksum?: string | null
          created_at?: string
          file_name: string
          file_path: string
          file_size_bytes: number
          id?: string
          record_count?: number | null
          table_name?: string | null
        }
        Update: {
          backup_job_id?: string
          checksum?: string | null
          created_at?: string
          file_name?: string
          file_path?: string
          file_size_bytes?: number
          id?: string
          record_count?: number | null
          table_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "backup_files_backup_job_id_fkey"
            columns: ["backup_job_id"]
            isOneToOne: false
            referencedRelation: "backup_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      backup_jobs: {
        Row: {
          admin_user_id: string
          backup_size_bytes: number | null
          backup_type: Database["public"]["Enums"]["backup_type"]
          compression_ratio: number | null
          created_at: string
          end_time: string | null
          error_message: string | null
          id: string
          notes: string | null
          processed_tables: number | null
          start_time: string | null
          status: Database["public"]["Enums"]["backup_status"]
          tables_included: string[] | null
          total_records: number | null
          total_tables: number | null
          updated_at: string
        }
        Insert: {
          admin_user_id: string
          backup_size_bytes?: number | null
          backup_type?: Database["public"]["Enums"]["backup_type"]
          compression_ratio?: number | null
          created_at?: string
          end_time?: string | null
          error_message?: string | null
          id?: string
          notes?: string | null
          processed_tables?: number | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["backup_status"]
          tables_included?: string[] | null
          total_records?: number | null
          total_tables?: number | null
          updated_at?: string
        }
        Update: {
          admin_user_id?: string
          backup_size_bytes?: number | null
          backup_type?: Database["public"]["Enums"]["backup_type"]
          compression_ratio?: number | null
          created_at?: string
          end_time?: string | null
          error_message?: string | null
          id?: string
          notes?: string | null
          processed_tables?: number | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["backup_status"]
          tables_included?: string[] | null
          total_records?: number | null
          total_tables?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      backup_restore_logs: {
        Row: {
          admin_user_id: string
          backup_job_id: string
          created_at: string
          end_time: string | null
          error_message: string | null
          id: string
          notes: string | null
          records_restored: number | null
          restore_type: string
          start_time: string | null
          status: Database["public"]["Enums"]["restore_status"]
          tables_restored: string[] | null
        }
        Insert: {
          admin_user_id: string
          backup_job_id: string
          created_at?: string
          end_time?: string | null
          error_message?: string | null
          id?: string
          notes?: string | null
          records_restored?: number | null
          restore_type: string
          start_time?: string | null
          status?: Database["public"]["Enums"]["restore_status"]
          tables_restored?: string[] | null
        }
        Update: {
          admin_user_id?: string
          backup_job_id?: string
          created_at?: string
          end_time?: string | null
          error_message?: string | null
          id?: string
          notes?: string | null
          records_restored?: number | null
          restore_type?: string
          start_time?: string | null
          status?: Database["public"]["Enums"]["restore_status"]
          tables_restored?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "backup_restore_logs_backup_job_id_fkey"
            columns: ["backup_job_id"]
            isOneToOne: false
            referencedRelation: "backup_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      backup_schedules: {
        Row: {
          admin_user_id: string
          backup_type: Database["public"]["Enums"]["backup_type"]
          created_at: string
          cron_expression: string
          id: string
          is_active: boolean
          last_run: string | null
          next_run: string | null
          retention_days: number
          schedule_name: string
          tables_included: string[] | null
          updated_at: string
        }
        Insert: {
          admin_user_id: string
          backup_type?: Database["public"]["Enums"]["backup_type"]
          created_at?: string
          cron_expression: string
          id?: string
          is_active?: boolean
          last_run?: string | null
          next_run?: string | null
          retention_days?: number
          schedule_name: string
          tables_included?: string[] | null
          updated_at?: string
        }
        Update: {
          admin_user_id?: string
          backup_type?: Database["public"]["Enums"]["backup_type"]
          created_at?: string
          cron_expression?: string
          id?: string
          is_active?: boolean
          last_run?: string | null
          next_run?: string | null
          retention_days?: number
          schedule_name?: string
          tables_included?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      beep_answers: {
        Row: {
          answer_value: number
          assessment_id: string
          created_at: string | null
          id: string
          question_id: string
          updated_at: string | null
        }
        Insert: {
          answer_value: number
          assessment_id: string
          created_at?: string | null
          id?: string
          question_id: string
          updated_at?: string | null
        }
        Update: {
          answer_value?: number
          assessment_id?: string
          created_at?: string | null
          id?: string
          question_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "beep_answers_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "beep_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beep_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "beep_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      beep_assessments: {
        Row: {
          answered_questions: number | null
          company_id: string | null
          completed_at: string | null
          created_at: string | null
          current_category_id: string | null
          current_question_index: number | null
          final_score: number | null
          id: string
          last_answer_at: string | null
          maturity_level:
            | Database["public"]["Enums"]["beep_maturity_level"]
            | null
          progress_percentage: number | null
          status: string | null
          total_questions: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          answered_questions?: number | null
          company_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          current_category_id?: string | null
          current_question_index?: number | null
          final_score?: number | null
          id?: string
          last_answer_at?: string | null
          maturity_level?:
            | Database["public"]["Enums"]["beep_maturity_level"]
            | null
          progress_percentage?: number | null
          status?: string | null
          total_questions?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          answered_questions?: number | null
          company_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          current_category_id?: string | null
          current_question_index?: number | null
          final_score?: number | null
          id?: string
          last_answer_at?: string | null
          maturity_level?:
            | Database["public"]["Enums"]["beep_maturity_level"]
            | null
          progress_percentage?: number | null
          status?: string | null
          total_questions?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "beep_assessments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      beep_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          order_index: number
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          order_index: number
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          order_index?: number
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      beep_maturity_levels: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          level: Database["public"]["Enums"]["beep_maturity_level"]
          max_score: number
          min_score: number
          name: string
          order_index: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          level: Database["public"]["Enums"]["beep_maturity_level"]
          max_score: number
          min_score: number
          name: string
          order_index: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          level?: Database["public"]["Enums"]["beep_maturity_level"]
          max_score?: number
          min_score?: number
          name?: string
          order_index?: number
        }
        Relationships: []
      }
      beep_questions: {
        Row: {
          created_at: string | null
          id: string
          order_index: number
          question_text: string
          subcategory_id: string
          updated_at: string | null
          weight: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_index: number
          question_text: string
          subcategory_id: string
          updated_at?: string | null
          weight?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          order_index?: number
          question_text?: string
          subcategory_id?: string
          updated_at?: string | null
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "beep_questions_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "beep_subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      beep_subcategories: {
        Row: {
          category_id: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          order_index: number
          slug: string
          updated_at: string | null
        }
        Insert: {
          category_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          order_index: number
          slug: string
          updated_at?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          order_index?: number
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "beep_subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "beep_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          company_type: Database["public"]["Enums"]["company_type"] | null
          created_at: string
          id: string
          logo_url: string | null
          mission: string | null
          name: string
          owner_id: string
          status: string | null
          updated_at: string
          values: string[] | null
          vision: string | null
        }
        Insert: {
          company_type?: Database["public"]["Enums"]["company_type"] | null
          created_at?: string
          id?: string
          logo_url?: string | null
          mission?: string | null
          name: string
          owner_id: string
          status?: string | null
          updated_at?: string
          values?: string[] | null
          vision?: string | null
        }
        Update: {
          company_type?: Database["public"]["Enums"]["company_type"] | null
          created_at?: string
          id?: string
          logo_url?: string | null
          mission?: string | null
          name?: string
          owner_id?: string
          status?: string | null
          updated_at?: string
          values?: string[] | null
          vision?: string | null
        }
        Relationships: []
      }
      database_cleanup_logs: {
        Row: {
          admin_user_id: string
          cleanup_category: string
          error_details: string | null
          executed_at: string
          filter_criteria: Json | null
          id: string
          notes: string | null
          records_deleted: number
          success: boolean
        }
        Insert: {
          admin_user_id: string
          cleanup_category: string
          error_details?: string | null
          executed_at?: string
          filter_criteria?: Json | null
          id?: string
          notes?: string | null
          records_deleted?: number
          success?: boolean
        }
        Update: {
          admin_user_id?: string
          cleanup_category?: string
          error_details?: string | null
          executed_at?: string
          filter_criteria?: Json | null
          id?: string
          notes?: string | null
          records_deleted?: number
          success?: boolean
        }
        Relationships: []
      }
      golden_circle: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          how_question: string | null
          id: string
          updated_at: string
          updated_by: string
          what_question: string | null
          why_question: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          how_question?: string | null
          id?: string
          updated_at?: string
          updated_by: string
          what_question?: string | null
          why_question?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          how_question?: string | null
          id?: string
          updated_at?: string
          updated_by?: string
          what_question?: string | null
          why_question?: string | null
        }
        Relationships: []
      }
      golden_circle_history: {
        Row: {
          change_reason: string | null
          changed_at: string
          changed_by: string
          golden_circle_id: string
          id: string
          previous_how: string | null
          previous_what: string | null
          previous_why: string | null
        }
        Insert: {
          change_reason?: string | null
          changed_at?: string
          changed_by: string
          golden_circle_id: string
          id?: string
          previous_how?: string | null
          previous_what?: string | null
          previous_why?: string | null
        }
        Update: {
          change_reason?: string | null
          changed_at?: string
          changed_by?: string
          golden_circle_id?: string
          id?: string
          previous_how?: string | null
          previous_what?: string | null
          previous_why?: string | null
        }
        Relationships: []
      }
      key_result_values: {
        Row: {
          comments: string | null
          created_at: string | null
          id: string
          key_result_id: string | null
          period_date: string
          recorded_by: string
          value: number
        }
        Insert: {
          comments?: string | null
          created_at?: string | null
          id?: string
          key_result_id?: string | null
          period_date: string
          recorded_by: string
          value: number
        }
        Update: {
          comments?: string | null
          created_at?: string | null
          id?: string
          key_result_id?: string | null
          period_date?: string
          recorded_by?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "key_result_values_key_result_id_fkey"
            columns: ["key_result_id"]
            isOneToOne: false
            referencedRelation: "key_results"
            referencedColumns: ["id"]
          },
        ]
      }
      key_results: {
        Row: {
          aggregation_type: string | null
          category: string | null
          created_at: string
          current_value: number | null
          deadline: string | null
          description: string | null
          due_date: string | null
          frequency: string | null
          id: string
          last_updated: string | null
          metric_type: string | null
          monthly_actual: Json | null
          monthly_targets: Json | null
          objective_id: string
          owner_id: string
          priority: string | null
          responsible: string | null
          target_value: number
          title: string
          unit: string
          updated_at: string
          yearly_actual: number | null
          yearly_target: number | null
        }
        Insert: {
          aggregation_type?: string | null
          category?: string | null
          created_at?: string
          current_value?: number | null
          deadline?: string | null
          description?: string | null
          due_date?: string | null
          frequency?: string | null
          id?: string
          last_updated?: string | null
          metric_type?: string | null
          monthly_actual?: Json | null
          monthly_targets?: Json | null
          objective_id: string
          owner_id: string
          priority?: string | null
          responsible?: string | null
          target_value: number
          title: string
          unit?: string
          updated_at?: string
          yearly_actual?: number | null
          yearly_target?: number | null
        }
        Update: {
          aggregation_type?: string | null
          category?: string | null
          created_at?: string
          current_value?: number | null
          deadline?: string | null
          description?: string | null
          due_date?: string | null
          frequency?: string | null
          id?: string
          last_updated?: string | null
          metric_type?: string | null
          monthly_actual?: Json | null
          monthly_targets?: Json | null
          objective_id?: string
          owner_id?: string
          priority?: string | null
          responsible?: string | null
          target_value?: number
          title?: string
          unit?: string
          updated_at?: string
          yearly_actual?: number | null
          yearly_target?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "key_results_objective_id_fkey"
            columns: ["objective_id"]
            isOneToOne: false
            referencedRelation: "strategic_objectives"
            referencedColumns: ["id"]
          },
        ]
      }
      key_results_history: {
        Row: {
          change_reason: string | null
          changed_at: string
          changed_by: string
          created_at: string
          id: string
          key_result_id: string
          previous_current_value: number | null
          previous_description: string | null
          previous_monthly_actual: Json | null
          previous_monthly_targets: Json | null
          previous_target_value: number | null
          previous_title: string | null
          previous_yearly_actual: number | null
          previous_yearly_target: number | null
          updated_at: string
        }
        Insert: {
          change_reason?: string | null
          changed_at?: string
          changed_by: string
          created_at?: string
          id?: string
          key_result_id: string
          previous_current_value?: number | null
          previous_description?: string | null
          previous_monthly_actual?: Json | null
          previous_monthly_targets?: Json | null
          previous_target_value?: number | null
          previous_title?: string | null
          previous_yearly_actual?: number | null
          previous_yearly_target?: number | null
          updated_at?: string
        }
        Update: {
          change_reason?: string | null
          changed_at?: string
          changed_by?: string
          created_at?: string
          id?: string
          key_result_id?: string
          previous_current_value?: number | null
          previous_description?: string | null
          previous_monthly_actual?: Json | null
          previous_monthly_targets?: Json | null
          previous_target_value?: number | null
          previous_title?: string | null
          previous_yearly_actual?: number | null
          previous_yearly_target?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      kr_actions_history: {
        Row: {
          action_id: string
          change_reason: string | null
          change_type: string
          changed_at: string | null
          changed_by: string
          id: string
          new_data: Json | null
          previous_data: Json | null
        }
        Insert: {
          action_id: string
          change_reason?: string | null
          change_type: string
          changed_at?: string | null
          changed_by: string
          id?: string
          new_data?: Json | null
          previous_data?: Json | null
        }
        Update: {
          action_id?: string
          change_reason?: string | null
          change_type?: string
          changed_at?: string | null
          changed_by?: string
          id?: string
          new_data?: Json | null
          previous_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "kr_actions_history_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "kr_monthly_actions"
            referencedColumns: ["id"]
          },
        ]
      }
      kr_fca: {
        Row: {
          cause: string
          created_at: string
          created_by: string
          description: string | null
          fact: string
          id: string
          key_result_id: string
          priority: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          cause: string
          created_at?: string
          created_by: string
          description?: string | null
          fact: string
          id?: string
          key_result_id: string
          priority?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          cause?: string
          created_at?: string
          created_by?: string
          description?: string | null
          fact?: string
          id?: string
          key_result_id?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kr_fca_key_result_id_fkey"
            columns: ["key_result_id"]
            isOneToOne: false
            referencedRelation: "key_results"
            referencedColumns: ["id"]
          },
        ]
      }
      kr_initiatives: {
        Row: {
          budget: number | null
          company_id: string
          completion_notes: string | null
          created_at: string
          created_by: string
          description: string | null
          end_date: string
          id: string
          key_result_id: string
          priority: string
          progress_percentage: number | null
          responsible: string | null
          start_date: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          budget?: number | null
          company_id: string
          completion_notes?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          end_date: string
          id?: string
          key_result_id: string
          priority?: string
          progress_percentage?: number | null
          responsible?: string | null
          start_date: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          budget?: number | null
          company_id?: string
          completion_notes?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string
          id?: string
          key_result_id?: string
          priority?: string
          progress_percentage?: number | null
          responsible?: string | null
          start_date?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      kr_monthly_actions: {
        Row: {
          action_description: string | null
          action_title: string
          actual_value: number | null
          completion_percentage: number | null
          created_at: string | null
          created_by: string
          end_date: string | null
          evidence_links: string[] | null
          fca_id: string
          id: string
          key_result_id: string
          month_year: string
          notes: string | null
          planned_value: number | null
          priority: string | null
          responsible: string | null
          start_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          action_description?: string | null
          action_title: string
          actual_value?: number | null
          completion_percentage?: number | null
          created_at?: string | null
          created_by: string
          end_date?: string | null
          evidence_links?: string[] | null
          fca_id: string
          id?: string
          key_result_id: string
          month_year: string
          notes?: string | null
          planned_value?: number | null
          priority?: string | null
          responsible?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          action_description?: string | null
          action_title?: string
          actual_value?: number | null
          completion_percentage?: number | null
          created_at?: string | null
          created_by?: string
          end_date?: string | null
          evidence_links?: string[] | null
          fca_id?: string
          id?: string
          key_result_id?: string
          month_year?: string
          notes?: string | null
          planned_value?: number | null
          priority?: string | null
          responsible?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_kr_monthly_actions_fca_id"
            columns: ["fca_id"]
            isOneToOne: false
            referencedRelation: "kr_fca"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_kr_monthly_actions_fca_kr_composite"
            columns: ["fca_id", "key_result_id"]
            isOneToOne: false
            referencedRelation: "kr_fca"
            referencedColumns: ["id", "key_result_id"]
          },
          {
            foreignKeyName: "kr_monthly_actions_key_result_id_fkey"
            columns: ["key_result_id"]
            isOneToOne: false
            referencedRelation: "key_results"
            referencedColumns: ["id"]
          },
        ]
      }
      kr_status_reports: {
        Row: {
          achievements: string | null
          challenges: string | null
          created_at: string
          created_by: string
          id: string
          key_result_id: string
          next_steps: string | null
          report_date: string
          status_summary: string
          updated_at: string
        }
        Insert: {
          achievements?: string | null
          challenges?: string | null
          created_at?: string
          created_by: string
          id?: string
          key_result_id: string
          next_steps?: string | null
          report_date?: string
          status_summary: string
          updated_at?: string
        }
        Update: {
          achievements?: string | null
          challenges?: string | null
          created_at?: string
          created_by?: string
          id?: string
          key_result_id?: string
          next_steps?: string | null
          report_date?: string
          status_summary?: string
          updated_at?: string
        }
        Relationships: []
      }
      landing_page_content: {
        Row: {
          content_key: string
          content_type: string
          content_value: string | null
          created_at: string
          created_by: string
          display_order: number | null
          id: string
          is_active: boolean | null
          section_name: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          content_key: string
          content_type: string
          content_value?: string | null
          created_at?: string
          created_by: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          section_name: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          content_key?: string
          content_type?: string
          content_value?: string | null
          created_at?: string
          created_by?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          section_name?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: []
      }
      mentor_startup_relations: {
        Row: {
          assigned_at: string
          assigned_by: string
          created_at: string
          id: string
          mentor_id: string
          startup_company_id: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          created_at?: string
          id?: string
          mentor_id: string
          startup_company_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          created_at?: string
          id?: string
          mentor_id?: string
          startup_company_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_startup_relations_startup_company_id_fkey"
            columns: ["startup_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      mentoring_sessions: {
        Row: {
          beep_related_items: Json | null
          created_at: string
          duration: number | null
          follow_up_date: string | null
          id: string
          mentor_id: string
          notes: string | null
          session_date: string
          session_type: string
          startup_company_id: string
          status: string
          updated_at: string
        }
        Insert: {
          beep_related_items?: Json | null
          created_at?: string
          duration?: number | null
          follow_up_date?: string | null
          id?: string
          mentor_id: string
          notes?: string | null
          session_date: string
          session_type?: string
          startup_company_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          beep_related_items?: Json | null
          created_at?: string
          duration?: number | null
          follow_up_date?: string | null
          id?: string
          mentor_id?: string
          notes?: string | null
          session_date?: string
          session_type?: string
          startup_company_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_mentoring_sessions_company"
            columns: ["startup_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_reviews: {
        Row: {
          collaboration_rating: number | null
          comments: string | null
          created_at: string | null
          goals_achievement: number | null
          goals_next_period: string | null
          id: string
          improvement_areas: string | null
          overall_rating: number | null
          review_period_end: string
          review_period_start: string
          reviewer_id: string
          status: string | null
          strengths: string | null
          technical_skills: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          collaboration_rating?: number | null
          comments?: string | null
          created_at?: string | null
          goals_achievement?: number | null
          goals_next_period?: string | null
          id?: string
          improvement_areas?: string | null
          overall_rating?: number | null
          review_period_end: string
          review_period_start: string
          reviewer_id: string
          status?: string | null
          strengths?: string | null
          technical_skills?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          collaboration_rating?: number | null
          comments?: string | null
          created_at?: string | null
          goals_achievement?: number | null
          goals_next_period?: string | null
          id?: string
          improvement_areas?: string | null
          overall_rating?: number | null
          review_period_end?: string
          review_period_start?: string
          reviewer_id?: string
          status?: string | null
          strengths?: string | null
          technical_skills?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profile_access_logs: {
        Row: {
          access_type: string
          accessed_at: string
          accessed_user_id: string
          accessing_user_id: string
          id: string
          ip_address: unknown | null
          user_agent: string | null
        }
        Insert: {
          access_type: string
          accessed_at?: string
          accessed_user_id: string
          accessing_user_id: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
        }
        Update: {
          access_type?: string
          accessed_at?: string
          accessed_user_id?: string
          accessing_user_id?: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          company_id: string | null
          created_at: string | null
          created_by_admin: string | null
          current_module_id: string | null
          department: string | null
          email: string | null
          first_login_at: string | null
          first_name: string | null
          hire_date: string | null
          id: string
          last_name: string | null
          must_change_password: boolean | null
          password_changed_at: string | null
          phone: string | null
          position: string | null
          role: Database["public"]["Enums"]["app_role"] | null
          skills: string[] | null
          status: string | null
          theme_preference: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by_admin?: string | null
          current_module_id?: string | null
          department?: string | null
          email?: string | null
          first_login_at?: string | null
          first_name?: string | null
          hire_date?: string | null
          id?: string
          last_name?: string | null
          must_change_password?: boolean | null
          password_changed_at?: string | null
          phone?: string | null
          position?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          skills?: string[] | null
          status?: string | null
          theme_preference?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by_admin?: string | null
          current_module_id?: string | null
          department?: string | null
          email?: string | null
          first_login_at?: string | null
          first_name?: string | null
          hire_date?: string | null
          id?: string
          last_name?: string | null
          must_change_password?: boolean | null
          password_changed_at?: string | null
          phone?: string | null
          position?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          skills?: string[] | null
          status?: string | null
          theme_preference?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_current_module_id_fkey"
            columns: ["current_module_id"]
            isOneToOne: false
            referencedRelation: "system_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      project_kr_relations: {
        Row: {
          created_at: string
          id: string
          kr_id: string
          project_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kr_id: string
          project_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kr_id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_kr_relations_kr_id_fkey"
            columns: ["kr_id"]
            isOneToOne: false
            referencedRelation: "key_results"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_kr_relations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "strategic_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          allocation_percentage: number | null
          created_at: string | null
          end_date: string | null
          id: string
          project_id: string | null
          role: string | null
          start_date: string | null
          user_id: string
        }
        Insert: {
          allocation_percentage?: number | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          project_id?: string | null
          role?: string | null
          start_date?: string | null
          user_id: string
        }
        Update: {
          allocation_percentage?: number | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          project_id?: string | null
          role?: string | null
          start_date?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "strategic_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_objective_relations: {
        Row: {
          created_at: string
          id: string
          objective_id: string
          project_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          objective_id: string
          project_id: string
        }
        Update: {
          created_at?: string
          id?: string
          objective_id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_objective_relations_objective_id_fkey"
            columns: ["objective_id"]
            isOneToOne: false
            referencedRelation: "strategic_objectives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_objective_relations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "strategic_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tasks: {
        Row: {
          actual_hours: number | null
          assignee_id: string
          created_at: string
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          priority: string | null
          project_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          actual_hours?: number | null
          assignee_id: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          priority?: string | null
          project_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          actual_hours?: number | null
          assignee_id?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          priority?: string | null
          project_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "strategic_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      startup_hub_profiles: {
        Row: {
          areas_of_expertise: string[] | null
          bio: string | null
          created_at: string
          id: string
          status: string
          type: Database["public"]["Enums"]["startup_hub_profile_type"]
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          areas_of_expertise?: string[] | null
          bio?: string | null
          created_at?: string
          id?: string
          status?: string
          type: Database["public"]["Enums"]["startup_hub_profile_type"]
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          areas_of_expertise?: string[] | null
          bio?: string | null
          created_at?: string
          id?: string
          status?: string
          type?: Database["public"]["Enums"]["startup_hub_profile_type"]
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      strategic_objectives: {
        Row: {
          created_at: string
          deadline: string | null
          description: string | null
          id: string
          monthly_actual: Json | null
          monthly_targets: Json | null
          owner_id: string
          pillar_id: string
          plan_id: string
          progress: number | null
          responsible: string | null
          status: string
          target_date: string | null
          title: string
          updated_at: string
          weight: number | null
          yearly_actual: number | null
          yearly_target: number | null
        }
        Insert: {
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          monthly_actual?: Json | null
          monthly_targets?: Json | null
          owner_id: string
          pillar_id: string
          plan_id: string
          progress?: number | null
          responsible?: string | null
          status?: string
          target_date?: string | null
          title: string
          updated_at?: string
          weight?: number | null
          yearly_actual?: number | null
          yearly_target?: number | null
        }
        Update: {
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          monthly_actual?: Json | null
          monthly_targets?: Json | null
          owner_id?: string
          pillar_id?: string
          plan_id?: string
          progress?: number | null
          responsible?: string | null
          status?: string
          target_date?: string | null
          title?: string
          updated_at?: string
          weight?: number | null
          yearly_actual?: number | null
          yearly_target?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "strategic_objectives_pillar_id_fkey"
            columns: ["pillar_id"]
            isOneToOne: false
            referencedRelation: "strategic_pillars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategic_objectives_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "strategic_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      strategic_pillars: {
        Row: {
          color: string | null
          company_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          order_index: number | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          order_index?: number | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          order_index?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategic_pillars_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      strategic_plans: {
        Row: {
          company_id: string
          created_at: string
          id: string
          mission: string | null
          name: string
          period_end: string
          period_start: string
          status: string
          updated_at: string
          vision: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          mission?: string | null
          name: string
          period_end: string
          period_start: string
          status?: string
          updated_at?: string
          vision?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          mission?: string | null
          name?: string
          period_end?: string
          period_start?: string
          status?: string
          updated_at?: string
          vision?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "strategic_plans_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      strategic_projects: {
        Row: {
          budget: number | null
          company_id: string | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          name: string
          owner_id: string
          plan_id: string | null
          priority: string | null
          progress: number | null
          responsible: string | null
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          budget?: number | null
          company_id?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          owner_id: string
          plan_id?: string | null
          priority?: string | null
          progress?: number | null
          responsible?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          budget?: number | null
          company_id?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          owner_id?: string
          plan_id?: string | null
          priority?: string | null
          progress?: number | null
          responsible?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategic_projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategic_projects_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "strategic_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      swot_analysis: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          id: string
          opportunities: string | null
          strengths: string | null
          threats: string | null
          updated_at: string
          updated_by: string
          weaknesses: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          id?: string
          opportunities?: string | null
          strengths?: string | null
          threats?: string | null
          updated_at?: string
          updated_by: string
          weaknesses?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          id?: string
          opportunities?: string | null
          strengths?: string | null
          threats?: string | null
          updated_at?: string
          updated_by?: string
          weaknesses?: string | null
        }
        Relationships: []
      }
      swot_history: {
        Row: {
          change_reason: string | null
          changed_at: string
          changed_by: string
          id: string
          previous_opportunities: string | null
          previous_strengths: string | null
          previous_threats: string | null
          previous_weaknesses: string | null
          swot_analysis_id: string
        }
        Insert: {
          change_reason?: string | null
          changed_at?: string
          changed_by: string
          id?: string
          previous_opportunities?: string | null
          previous_strengths?: string | null
          previous_threats?: string | null
          previous_weaknesses?: string | null
          swot_analysis_id: string
        }
        Update: {
          change_reason?: string | null
          changed_at?: string
          changed_by?: string
          id?: string
          previous_opportunities?: string | null
          previous_strengths?: string | null
          previous_threats?: string | null
          previous_weaknesses?: string | null
          swot_analysis_id?: string
        }
        Relationships: []
      }
      system_modules: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json | null
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json | null
        }
        Relationships: []
      }
      user_company_relations: {
        Row: {
          company_id: string
          created_at: string
          id: string
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_company_relations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_module_profiles: {
        Row: {
          created_at: string
          id: string
          module_id: string
          profile_data: Json
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          module_id: string
          profile_data?: Json
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          module_id?: string
          profile_data?: Json
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_module_roles: {
        Row: {
          active: boolean
          created_at: string
          id: string
          module_id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          module_id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          module_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_module_roles_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "system_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      user_modules: {
        Row: {
          active: boolean
          created_at: string
          granted_at: string
          granted_by: string | null
          id: string
          module_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          module_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          module_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_modules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "system_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vision_alignment: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          id: string
          shared_commitments: string | null
          shared_objectives: string | null
          shared_resources: string | null
          shared_risks: string | null
          updated_at: string
          updated_by: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          id?: string
          shared_commitments?: string | null
          shared_objectives?: string | null
          shared_resources?: string | null
          shared_risks?: string | null
          updated_at?: string
          updated_by: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          id?: string
          shared_commitments?: string | null
          shared_objectives?: string | null
          shared_resources?: string | null
          shared_risks?: string | null
          updated_at?: string
          updated_by?: string
        }
        Relationships: []
      }
      vision_alignment_history: {
        Row: {
          change_reason: string | null
          changed_at: string
          changed_by: string
          id: string
          previous_shared_commitments: string | null
          previous_shared_objectives: string | null
          previous_shared_resources: string | null
          previous_shared_risks: string | null
          vision_alignment_id: string
        }
        Insert: {
          change_reason?: string | null
          changed_at?: string
          changed_by: string
          id?: string
          previous_shared_commitments?: string | null
          previous_shared_objectives?: string | null
          previous_shared_resources?: string | null
          previous_shared_risks?: string | null
          vision_alignment_id: string
        }
        Update: {
          change_reason?: string | null
          changed_at?: string
          changed_by?: string
          id?: string
          previous_shared_commitments?: string | null
          previous_shared_objectives?: string | null
          previous_shared_resources?: string | null
          previous_shared_risks?: string | null
          vision_alignment_id?: string
        }
        Relationships: []
      }
      vision_alignment_objectives: {
        Row: {
          color: string | null
          created_at: string
          created_by: string
          description: string | null
          dimension: string
          id: string
          order_index: number
          title: string
          updated_at: string
          updated_by: string
          vision_alignment_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          dimension: string
          id?: string
          order_index?: number
          title: string
          updated_at?: string
          updated_by: string
          vision_alignment_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          dimension?: string
          id?: string
          order_index?: number
          title?: string
          updated_at?: string
          updated_by?: string
          vision_alignment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_vision_alignment_objectives_vision_alignment"
            columns: ["vision_alignment_id"]
            isOneToOne: false
            referencedRelation: "vision_alignment"
            referencedColumns: ["id"]
          },
        ]
      }
      vision_alignment_removed_dupes: {
        Row: {
          company_id: string | null
          created_at: string | null
          created_by: string | null
          id: string | null
          shared_commitments: string | null
          shared_objectives: string | null
          shared_resources: string | null
          shared_risks: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string | null
          shared_commitments?: string | null
          shared_objectives?: string | null
          shared_resources?: string | null
          shared_risks?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string | null
          shared_commitments?: string | null
          shared_objectives?: string | null
          shared_resources?: string | null
          shared_risks?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_user: {
        Args: { _admin_id: string; _user_id: string }
        Returns: boolean
      }
      analyze_user_data: {
        Args: { target_user_id: string }
        Returns: Json
      }
      analyze_user_relations: {
        Args: { _user_id: string }
        Returns: Json
      }
      assign_user_to_company: {
        Args: { _admin_id: string; _company_id: string; _user_id: string }
        Returns: boolean
      }
      assign_user_to_company_v2: {
        Args: {
          _admin_id: string
          _company_id: string
          _role?: string
          _user_id: string
        }
        Returns: boolean
      }
      calculate_achievement_percentage: {
        Args: { actual: number; target: number }
        Returns: number
      }
      can_delete_company: {
        Args: { _company_id: string }
        Returns: boolean
      }
      check_startup_integrity: {
        Args: { _company_id: string }
        Returns: {
          has_company: boolean
          has_profile: boolean
          has_relation: boolean
          is_complete: boolean
          issues: string[]
        }[]
      }
      cleanup_ai_data: {
        Args: { _admin_id: string; _user_id?: string }
        Returns: {
          deleted_analytics: number
          deleted_insights: number
          deleted_messages: number
          deleted_recommendations: number
          deleted_sessions: number
          message: string
          success: boolean
        }[]
      }
      cleanup_analyses_data: {
        Args: { _admin_id: string; _company_id?: string }
        Returns: {
          deleted_gc: number
          deleted_gc_history: number
          deleted_swot: number
          deleted_swot_history: number
          message: string
          success: boolean
        }[]
      }
      cleanup_beep_data: {
        Args: { _admin_id: string; _company_id?: string }
        Returns: {
          deleted_answers: number
          deleted_assessments: number
          message: string
          success: boolean
        }[]
      }
      cleanup_mentoring_data: {
        Args: { _admin_id: string; _before_date?: string; _company_id?: string }
        Returns: {
          deleted_actions: number
          deleted_relations: number
          deleted_sessions: number
          message: string
          success: boolean
        }[]
      }
      cleanup_metrics_data: {
        Args: { _admin_id: string; _company_id?: string }
        Returns: {
          deleted_history: number
          deleted_results: number
          deleted_values: number
          message: string
          success: boolean
        }[]
      }
      cleanup_performance_data: {
        Args: { _admin_id: string; _user_id?: string }
        Returns: {
          deleted_reviews: number
          message: string
          success: boolean
        }[]
      }
      cleanup_strategic_data: {
        Args: { _admin_id: string; _company_id?: string }
        Returns: {
          deleted_objectives: number
          deleted_pillars: number
          deleted_plans: number
          deleted_projects: number
          message: string
          success: boolean
        }[]
      }
      configure_user_modules: {
        Args: {
          _admin_id: string
          _module_ids: string[]
          _module_roles?: Json
          _startup_hub_options?: Json
          _user_id: string
        }
        Returns: {
          debug_log: string
          message: string
          success: boolean
        }[]
      }
      configure_user_profile: {
        Args: {
          _admin_id: string
          _company_id?: string
          _department?: string
          _email: string
          _first_name: string
          _last_name: string
          _phone?: string
          _position?: string
          _role?: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: {
          debug_log: string
          message: string
          success: boolean
        }[]
      }
      confirm_user_email: {
        Args: { _admin_id: string; _user_id: string }
        Returns: boolean
      }
      create_missing_profiles: {
        Args: Record<PropertyKey, never>
        Returns: {
          action: string
          missing_email: string
          missing_user_id: string
        }[]
      }
      create_startup_company: {
        Args: {
          _logo_url?: string
          _mission?: string
          _name: string
          _owner_id?: string
          _values?: string[]
          _vision?: string
        }
        Returns: {
          company_id: string
          message: string
          success: boolean
        }[]
      }
      create_startup_company_debug: {
        Args: {
          _logo_url?: string
          _mission?: string
          _name: string
          _owner_id?: string
          _values?: string[]
          _vision?: string
        }
        Returns: {
          company_id: string
          message: string
          step_log: string
          success: boolean
        }[]
      }
      create_startup_company_v2: {
        Args: {
          _logo_url?: string
          _mission?: string
          _name: string
          _owner_id?: string
          _values?: string[]
          _vision?: string
        }
        Returns: {
          company_id: string
          message: string
          step_log: string
          success: boolean
        }[]
      }
      deactivate_user: {
        Args: { _admin_id: string; _user_id: string }
        Returns: boolean
      }
      debug_auth_context: {
        Args: Record<PropertyKey, never>
        Returns: {
          current_user_id: string
          profile_company_id: string
          profile_exists: boolean
          session_exists: boolean
          user_company_relations_count: number
        }[]
      }
      end_impersonation: {
        Args: { _admin_id: string }
        Returns: boolean
      }
      find_compatible_replacement_users: {
        Args: { _admin_id: string; _user_id: string }
        Returns: {
          compatibility_details: Json
          compatibility_score: number
          email: string
          first_name: string
          last_name: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }[]
      }
      generate_temporary_password: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_monthly_objective_achievement: {
        Args: { objective_id: string; target_month: string }
        Returns: {
          monthly_actual: number
          monthly_percentage: number
          monthly_target: number
          objective_title: string
          yearly_actual: number
          yearly_percentage: number
          yearly_target: number
        }[]
      }
      get_table_names: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
      get_user_company_id: {
        Args: { _user_id: string }
        Returns: string
      }
      get_user_module_roles: {
        Args: { _user_id: string }
        Returns: {
          module_id: string
          roles: Database["public"]["Enums"]["app_role"][]
        }[]
      }
      get_user_modules: {
        Args: { _user_id: string }
        Returns: {
          description: string
          icon: string
          module_id: string
          name: string
          slug: string
        }[]
      }
      get_user_startup_company: {
        Args: { _user_id: string }
        Returns: {
          company_values: string[]
          created_at: string
          id: string
          logo_url: string
          mission: string
          name: string
          updated_at: string
          vision: string
          website: string
        }[]
      }
      grant_module_access: {
        Args: { _admin_id: string; _module_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
      is_system_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
      repair_startup: {
        Args: { _company_id: string }
        Returns: {
          actions_taken: string[]
          message: string
          success: boolean
        }[]
      }
      revoke_module_access: {
        Args: { _admin_id: string; _module_id: string; _user_id: string }
        Returns: boolean
      }
      safe_delete_user: {
        Args: { _admin_id: string; _user_id: string }
        Returns: boolean
      }
      safe_delete_user_with_replacement: {
        Args: {
          _admin_id: string
          _replacement_user_id: string
          _user_id: string
        }
        Returns: Json
      }
      set_user_module_roles: {
        Args: {
          _admin_id: string
          _module_id: string
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      start_impersonation: {
        Args: { _admin_id: string; _target_user_id: string }
        Returns: string
      }
      switch_user_module: {
        Args: { _module_id: string; _user_id: string }
        Returns: boolean
      }
      unassign_user_from_company: {
        Args: { _admin_id: string; _user_id: string }
        Returns: boolean
      }
      unassign_user_from_company_v2: {
        Args: { _admin_id: string; _company_id: string; _user_id: string }
        Returns: boolean
      }
      update_user_role: {
        Args: {
          _admin_id: string
          _new_role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      user_has_company_access: {
        Args: { _target_user_id: string }
        Returns: boolean
      }
      validate_fca_for_action: {
        Args: { _fca_id: string; _key_result_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "member"
      backup_status:
        | "pending"
        | "running"
        | "completed"
        | "failed"
        | "cancelled"
      backup_type: "full" | "incremental" | "selective" | "schema_only"
      beep_maturity_level:
        | "idealizando"
        | "validando_problemas_solucoes"
        | "iniciando_negocio"
        | "validando_mercado"
        | "evoluindo"
      company_type: "regular" | "startup"
      restore_status:
        | "pending"
        | "running"
        | "completed"
        | "failed"
        | "cancelled"
      startup_hub_profile_type: "startup" | "mentor"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "manager", "member"],
      backup_status: ["pending", "running", "completed", "failed", "cancelled"],
      backup_type: ["full", "incremental", "selective", "schema_only"],
      beep_maturity_level: [
        "idealizando",
        "validando_problemas_solucoes",
        "iniciando_negocio",
        "validando_mercado",
        "evoluindo",
      ],
      company_type: ["regular", "startup"],
      restore_status: [
        "pending",
        "running",
        "completed",
        "failed",
        "cancelled",
      ],
      startup_hub_profile_type: ["startup", "mentor"],
    },
  },
} as const
