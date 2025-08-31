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
          created_at: string | null
          id: string
          session_title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          session_title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          session_title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_insights: {
        Row: {
          actionable: boolean | null
          category: string
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
          company_id: string | null
          completed_at: string | null
          created_at: string | null
          final_score: number | null
          id: string
          maturity_level:
            | Database["public"]["Enums"]["beep_maturity_level"]
            | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          final_score?: number | null
          id?: string
          maturity_level?:
            | Database["public"]["Enums"]["beep_maturity_level"]
            | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          final_score?: number | null
          id?: string
          maturity_level?:
            | Database["public"]["Enums"]["beep_maturity_level"]
            | null
          status?: string | null
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
          status: string
          target_value: number
          title: string
          unit: string
          updated_at: string
          yearly_actual: number | null
          yearly_target: number | null
        }
        Insert: {
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
          status?: string
          target_value: number
          title: string
          unit?: string
          updated_at?: string
          yearly_actual?: number | null
          yearly_target?: number | null
        }
        Update: {
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
          status?: string
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
      mentoring_tips: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          is_public: boolean
          mentor_id: string
          priority: string
          startup_company_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          id?: string
          is_public?: boolean
          mentor_id: string
          priority?: string
          startup_company_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          is_public?: boolean
          mentor_id?: string
          priority?: string
          startup_company_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentoring_tips_startup_company_id_fkey"
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
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          company_id: string | null
          created_at: string | null
          current_module_id: string | null
          department: string | null
          email: string | null
          first_name: string | null
          hire_date: string | null
          id: string
          last_name: string | null
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
          current_module_id?: string | null
          department?: string | null
          email?: string | null
          first_name?: string | null
          hire_date?: string | null
          id?: string
          last_name?: string | null
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
          current_module_id?: string | null
          department?: string | null
          email?: string | null
          first_name?: string | null
          hire_date?: string | null
          id?: string
          last_name?: string | null
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
      end_impersonation: {
        Args: { _admin_id: string }
        Returns: boolean
      }
      get_current_user_role: {
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
    }
    Enums: {
      app_role: "admin" | "manager" | "member"
      beep_maturity_level:
        | "idealizando"
        | "validando_problemas_solucoes"
        | "iniciando_negocio"
        | "validando_mercado"
        | "evoluindo"
      company_type: "regular" | "startup"
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
      beep_maturity_level: [
        "idealizando",
        "validando_problemas_solucoes",
        "iniciando_negocio",
        "validando_mercado",
        "evoluindo",
      ],
      company_type: ["regular", "startup"],
      startup_hub_profile_type: ["startup", "mentor"],
    },
  },
} as const
