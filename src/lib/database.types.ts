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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ats_scores: {
        Row: {
          base_resume_id: string | null
          created_at: string
          id: string
          matched_keywords: string[]
          missing_keywords: string[]
          model: string
          overall: number
          prompt_version: string
          scored_resume_id: string | null
          subscores: Json
          suggestions: Json
          tailoring_job_id: string | null
          user_id: string
        }
        Insert: {
          base_resume_id?: string | null
          created_at?: string
          id?: string
          matched_keywords?: string[]
          missing_keywords?: string[]
          model: string
          overall: number
          prompt_version: string
          scored_resume_id?: string | null
          subscores: Json
          suggestions: Json
          tailoring_job_id?: string | null
          user_id: string
        }
        Update: {
          base_resume_id?: string | null
          created_at?: string
          id?: string
          matched_keywords?: string[]
          missing_keywords?: string[]
          model?: string
          overall?: number
          prompt_version?: string
          scored_resume_id?: string | null
          subscores?: Json
          suggestions?: Json
          tailoring_job_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ats_scores_base_resume_id_fkey"
            columns: ["base_resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ats_scores_scored_resume_id_fkey"
            columns: ["scored_resume_id"]
            isOneToOne: false
            referencedRelation: "tailored_resumes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ats_scores_tailoring_job_id_fkey"
            columns: ["tailoring_job_id"]
            isOneToOne: false
            referencedRelation: "tailoring_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          model: string | null
          role: string
          session_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          model?: string | null
          role: string
          session_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          model?: string | null
          role?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string
          id: string
          tailoring_job_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          tailoring_job_id?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          tailoring_job_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_tailoring_job_id_fkey"
            columns: ["tailoring_job_id"]
            isOneToOne: false
            referencedRelation: "tailoring_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      cover_letters: {
        Row: {
          base_resume_id: string | null
          body: string
          company_name: string
          created_at: string
          id: string
          model: string
          prompt_version: string
          role_title: string
          tailoring_job_id: string | null
          tone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          base_resume_id?: string | null
          body: string
          company_name: string
          created_at?: string
          id?: string
          model: string
          prompt_version: string
          role_title: string
          tailoring_job_id?: string | null
          tone: string
          updated_at?: string
          user_id: string
        }
        Update: {
          base_resume_id?: string | null
          body?: string
          company_name?: string
          created_at?: string
          id?: string
          model?: string
          prompt_version?: string
          role_title?: string
          tailoring_job_id?: string | null
          tone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cover_letters_base_resume_id_fkey"
            columns: ["base_resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cover_letters_tailoring_job_id_fkey"
            columns: ["tailoring_job_id"]
            isOneToOne: false
            referencedRelation: "tailoring_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          default_cover_tone: string
          default_resume_length: number
          full_name: string | null
          id: string
          linkedin_url: string | null
          location: string | null
          portfolio_url: string | null
          reduce_motion: boolean
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          default_cover_tone?: string
          default_resume_length?: number
          full_name?: string | null
          id: string
          linkedin_url?: string | null
          location?: string | null
          portfolio_url?: string | null
          reduce_motion?: boolean
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          default_cover_tone?: string
          default_resume_length?: number
          full_name?: string | null
          id?: string
          linkedin_url?: string | null
          location?: string | null
          portfolio_url?: string | null
          reduce_motion?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      resumes: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          label: string
          raw_text: string
          source_kind: string
          source_mime: string | null
          source_storage_path: string | null
          structured: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          raw_text: string
          source_kind: string
          source_mime?: string | null
          source_storage_path?: string | null
          structured: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          raw_text?: string
          source_kind?: string
          source_mime?: string | null
          source_storage_path?: string | null
          structured?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          created_at: string
          email: string | null
          id: string
          kind: string
          message: string
          name: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          kind: string
          message: string
          name?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          kind?: string
          message?: string
          name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      tailored_resumes: {
        Row: {
          base_resume_id: string
          created_at: string
          id: string
          model: string
          prompt_version: string
          rendered_text: string
          structured: Json
          tailoring_job_id: string
          user_id: string
        }
        Insert: {
          base_resume_id: string
          created_at?: string
          id?: string
          model: string
          prompt_version: string
          rendered_text: string
          structured: Json
          tailoring_job_id: string
          user_id: string
        }
        Update: {
          base_resume_id?: string
          created_at?: string
          id?: string
          model?: string
          prompt_version?: string
          rendered_text?: string
          structured?: Json
          tailoring_job_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tailored_resumes_base_resume_id_fkey"
            columns: ["base_resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tailored_resumes_tailoring_job_id_fkey"
            columns: ["tailoring_job_id"]
            isOneToOne: false
            referencedRelation: "tailoring_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      tailoring_jobs: {
        Row: {
          ats_score_id: string | null
          base_resume_id: string
          company_name: string | null
          completed_at: string | null
          cover_letter_id: string | null
          created_at: string
          error_message: string | null
          id: string
          job_description: string
          role_title: string | null
          status: Database["public"]["Enums"]["tailoring_status"]
          tailored_resume_id: string | null
          user_id: string
        }
        Insert: {
          ats_score_id?: string | null
          base_resume_id: string
          company_name?: string | null
          completed_at?: string | null
          cover_letter_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          job_description: string
          role_title?: string | null
          status?: Database["public"]["Enums"]["tailoring_status"]
          tailored_resume_id?: string | null
          user_id: string
        }
        Update: {
          ats_score_id?: string | null
          base_resume_id?: string
          company_name?: string | null
          completed_at?: string | null
          cover_letter_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          job_description?: string
          role_title?: string | null
          status?: Database["public"]["Enums"]["tailoring_status"]
          tailored_resume_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tailoring_jobs_ats_score_fk"
            columns: ["ats_score_id"]
            isOneToOne: false
            referencedRelation: "ats_scores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tailoring_jobs_base_resume_id_fkey"
            columns: ["base_resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tailoring_jobs_cover_letter_fk"
            columns: ["cover_letter_id"]
            isOneToOne: false
            referencedRelation: "cover_letters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tailoring_jobs_tailored_resume_fk"
            columns: ["tailored_resume_id"]
            isOneToOne: false
            referencedRelation: "tailored_resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist_signups: {
        Row: {
          created_at: string
          email: string
          id: string
          tier_requested: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          tier_requested: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          tier_requested?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      tailoring_status: "pending" | "running" | "succeeded" | "failed"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      tailoring_status: ["pending", "running", "succeeded", "failed"],
    },
  },
} as const
