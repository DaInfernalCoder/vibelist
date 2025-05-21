export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      customization_settings: {
        Row: {
          created_at: string
          custom_fields: Json | null
          email_template: string | null
          id: string
          logo_url: string | null
          redirect_url: string | null
          show_referral: boolean | null
          show_social_proof: boolean | null
          theme_color: string | null
          updated_at: string
          waitlist_id: string
        }
        Insert: {
          created_at?: string
          custom_fields?: Json | null
          email_template?: string | null
          id?: string
          logo_url?: string | null
          redirect_url?: string | null
          show_referral?: boolean | null
          show_social_proof?: boolean | null
          theme_color?: string | null
          updated_at?: string
          waitlist_id: string
        }
        Update: {
          created_at?: string
          custom_fields?: Json | null
          email_template?: string | null
          id?: string
          logo_url?: string | null
          redirect_url?: string | null
          show_referral?: boolean | null
          show_social_proof?: boolean | null
          theme_color?: string | null
          updated_at?: string
          waitlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customization_settings_waitlist_id_fkey"
            columns: ["waitlist_id"]
            isOneToOne: true
            referencedRelation: "waitlists"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          name: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          name?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      waitlist_analytics: {
        Row: {
          daily_signups: Json | null
          id: string
          last_calculated: string | null
          referral_sources: Json | null
          total_signups: number | null
          waitlist_id: string
        }
        Insert: {
          daily_signups?: Json | null
          id?: string
          last_calculated?: string | null
          referral_sources?: Json | null
          total_signups?: number | null
          waitlist_id: string
        }
        Update: {
          daily_signups?: Json | null
          id?: string
          last_calculated?: string | null
          referral_sources?: Json | null
          total_signups?: number | null
          waitlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_analytics_waitlist_id_fkey"
            columns: ["waitlist_id"]
            isOneToOne: true
            referencedRelation: "waitlists"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist_signups: {
        Row: {
          email: string
          id: string
          name: string | null
          referral_code: string | null
          referral_source: string | null
          signup_time: string
          status: string
          waitlist_id: string
        }
        Insert: {
          email: string
          id?: string
          name?: string | null
          referral_code?: string | null
          referral_source?: string | null
          signup_time?: string
          status?: string
          waitlist_id: string
        }
        Update: {
          email?: string
          id?: string
          name?: string | null
          referral_code?: string | null
          referral_source?: string | null
          signup_time?: string
          status?: string
          waitlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_signups_waitlist_id_fkey"
            columns: ["waitlist_id"]
            isOneToOne: false
            referencedRelation: "waitlists"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist_templates: {
        Row: {
          created_at: string
          id: string
          name: string
          template_data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          template_data: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          template_data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      waitlists: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          owner_id: string
          published: boolean | null
          status: string
          updated_at: string
          url_slug: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          owner_id: string
          published?: boolean | null
          status?: string
          updated_at?: string
          url_slug?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
          published?: boolean | null
          status?: string
          updated_at?: string
          url_slug?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "waitlists_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_daily_signups: {
        Args: { p_waitlist_id: string }
        Returns: Json
      }
      calculate_referral_sources: {
        Args: { p_waitlist_id: string }
        Returns: Json
      }
      ensure_unique_slug: {
        Args: { p_base_slug: string }
        Returns: string
      }
      generate_slug_from_name: {
        Args: { p_name: string }
        Returns: string
      }
      get_waitlist_analytics: {
        Args: { p_waitlist_id: string }
        Returns: {
          total_signups: number
          daily_signups: Json
          referral_sources: Json
          last_calculated: string
        }[]
      }
      get_waitlist_signup_count: {
        Args: { p_waitlist_id: string }
        Returns: number
      }
      update_waitlist_analytics: {
        Args: { p_waitlist_id: string }
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
