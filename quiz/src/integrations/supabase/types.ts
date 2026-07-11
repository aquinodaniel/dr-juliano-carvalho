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
  public: {
    Tables: {
      ab_variants: {
        Row: {
          created_at: string
          headline: string
          label: string
          sub_headline: string
          updated_at: string
          variant: string
        }
        Insert: {
          created_at?: string
          headline: string
          label: string
          sub_headline: string
          updated_at?: string
          variant: string
        }
        Update: {
          created_at?: string
          headline?: string
          label?: string
          sub_headline?: string
          updated_at?: string
          variant?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          answers: Json
          created_at: string
          email: string
          id: string
          name: string
          session_id: string | null
          whatsapp: string
        }
        Insert: {
          answers?: Json
          created_at?: string
          email: string
          id?: string
          name: string
          session_id?: string | null
          whatsapp: string
        }
        Update: {
          answers?: Json
          created_at?: string
          email?: string
          id?: string
          name?: string
          session_id?: string | null
          whatsapp?: string
        }
        Relationships: []
      }
      quiz_clicks: {
        Row: {
          created_at: string
          element_id: string | null
          element_tag: string | null
          element_text: string | null
          id: string
          rel_x: number
          rel_y: number
          screen_id: string
          session_id: string
          step_index: number
          viewport_height: number
          viewport_width: number
          x: number
          y: number
        }
        Insert: {
          created_at?: string
          element_id?: string | null
          element_tag?: string | null
          element_text?: string | null
          id?: string
          rel_x: number
          rel_y: number
          screen_id: string
          session_id: string
          step_index?: number
          viewport_height: number
          viewport_width: number
          x: number
          y: number
        }
        Update: {
          created_at?: string
          element_id?: string | null
          element_tag?: string | null
          element_text?: string | null
          id?: string
          rel_x?: number
          rel_y?: number
          screen_id?: string
          session_id?: string
          step_index?: number
          viewport_height?: number
          viewport_width?: number
          x?: number
          y?: number
        }
        Relationships: []
      }
      quiz_events: {
        Row: {
          created_at: string
          id: string
          lead_id: string | null
          pet_name: string | null
          screen_id: string
          session_id: string
          step_index: number
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id?: string | null
          pet_name?: string | null
          screen_id: string
          session_id: string
          step_index: number
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string | null
          pet_name?: string | null
          screen_id?: string
          session_id?: string
          step_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "quiz_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_screen_time: {
        Row: {
          created_at: string
          duration_ms: number
          id: string
          screen_id: string
          session_id: string
          step_index: number
        }
        Insert: {
          created_at?: string
          duration_ms: number
          id?: string
          screen_id: string
          session_id: string
          step_index?: number
        }
        Update: {
          created_at?: string
          duration_ms?: number
          id?: string
          screen_id?: string
          session_id?: string
          step_index?: number
        }
        Relationships: []
      }
      quiz_scroll_depth: {
        Row: {
          created_at: string
          id: string
          max_scroll_pct: number
          screen_id: string
          session_id: string
          step_index: number
        }
        Insert: {
          created_at?: string
          id?: string
          max_scroll_pct: number
          screen_id: string
          session_id: string
          step_index?: number
        }
        Update: {
          created_at?: string
          id?: string
          max_scroll_pct?: number
          screen_id?: string
          session_id?: string
          step_index?: number
        }
        Relationships: []
      }
      quiz_sessions: {
        Row: {
          completed: boolean
          device_type: string | null
          id: string
          last_seen_at: string
          lead_id: string | null
          referrer: string | null
          session_id: string
          session_token: string | null
          started_at: string
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          variant: string | null
          viewport_height: number | null
          viewport_width: number | null
        }
        Insert: {
          completed?: boolean
          device_type?: string | null
          id?: string
          last_seen_at?: string
          lead_id?: string | null
          referrer?: string | null
          session_id: string
          session_token?: string | null
          started_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          variant?: string | null
          viewport_height?: number | null
          viewport_width?: number | null
        }
        Update: {
          completed?: boolean
          device_type?: string | null
          id?: string
          last_seen_at?: string
          lead_id?: string | null
          referrer?: string | null
          session_id?: string
          session_token?: string | null
          started_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          variant?: string | null
          viewport_height?: number | null
          viewport_width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_sessions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      link_quiz_session_lead: {
        Args: { p_lead_id: string; p_session_id: string; p_token: string }
        Returns: undefined
      }
      touch_quiz_session: {
        Args: { p_session_id: string; p_token: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
