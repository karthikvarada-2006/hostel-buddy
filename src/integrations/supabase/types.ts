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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          attendance_date: string
          created_at: string
          id: string
          is_present: boolean
          marked_by: string | null
          student_id: string
        }
        Insert: {
          attendance_date: string
          created_at?: string
          id?: string
          is_present?: boolean
          marked_by?: string | null
          student_id: string
        }
        Update: {
          attendance_date?: string
          created_at?: string
          id?: string
          is_present?: boolean
          marked_by?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_marked_by_fkey"
            columns: ["marked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      complaints: {
        Row: {
          created_at: string
          description: string
          id: string
          image_url: string | null
          priority: Database["public"]["Enums"]["complaint_priority"] | null
          resolution_notes: string | null
          status: Database["public"]["Enums"]["complaint_status"]
          student_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          image_url?: string | null
          priority?: Database["public"]["Enums"]["complaint_priority"] | null
          resolution_notes?: string | null
          status?: Database["public"]["Enums"]["complaint_status"]
          student_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          priority?: Database["public"]["Enums"]["complaint_priority"] | null
          resolution_notes?: string | null
          status?: Database["public"]["Enums"]["complaint_status"]
          student_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaints_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      food_menu: {
        Row: {
          breakfast: string | null
          created_at: string
          created_by: string | null
          dinner: string | null
          id: string
          lunch: string | null
          menu_date: string
          updated_at: string
        }
        Insert: {
          breakfast?: string | null
          created_at?: string
          created_by?: string | null
          dinner?: string | null
          id?: string
          lunch?: string | null
          menu_date: string
          updated_at?: string
        }
        Update: {
          breakfast?: string | null
          created_at?: string
          created_by?: string | null
          dinner?: string | null
          id?: string
          lunch?: string | null
          menu_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_menu_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notices: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_archived: boolean
          is_important: boolean
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_archived?: boolean
          is_important?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_archived?: boolean
          is_important?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          related_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          related_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          related_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      passes: {
        Row: {
          admin_comment: string | null
          approved_by: string | null
          created_at: string
          destination: string
          from_date: string
          id: string
          pass_type: Database["public"]["Enums"]["pass_type"]
          reason: string
          status: Database["public"]["Enums"]["pass_status"]
          student_id: string
          to_date: string
          updated_at: string
        }
        Insert: {
          admin_comment?: string | null
          approved_by?: string | null
          created_at?: string
          destination: string
          from_date: string
          id?: string
          pass_type: Database["public"]["Enums"]["pass_type"]
          reason: string
          status?: Database["public"]["Enums"]["pass_status"]
          student_id: string
          to_date: string
          updated_at?: string
        }
        Update: {
          admin_comment?: string | null
          approved_by?: string | null
          created_at?: string
          destination?: string
          from_date?: string
          id?: string
          pass_type?: Database["public"]["Enums"]["pass_type"]
          reason?: string
          status?: Database["public"]["Enums"]["pass_status"]
          student_id?: string
          to_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "passes_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "passes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          branch: string | null
          created_at: string
          email: string
          full_name: string
          hostel_name: string | null
          id: string
          jntu_number: string | null
          role: Database["public"]["Enums"]["user_role"]
          room_number: string | null
          updated_at: string
          user_id: string
          year: string | null
        }
        Insert: {
          branch?: string | null
          created_at?: string
          email: string
          full_name: string
          hostel_name?: string | null
          id?: string
          jntu_number?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          room_number?: string | null
          updated_at?: string
          user_id: string
          year?: string | null
        }
        Update: {
          branch?: string | null
          created_at?: string
          email?: string
          full_name?: string
          hostel_name?: string | null
          id?: string
          jntu_number?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          room_number?: string | null
          updated_at?: string
          user_id?: string
          year?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_auth_user: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      get_profile_id: { Args: { user_uuid: string }; Returns: string }
      get_user_role: {
        Args: { user_uuid: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      complaint_priority: "low" | "medium" | "high"
      complaint_status: "pending" | "in_progress" | "resolved"
      pass_status: "pending" | "approved" | "rejected"
      pass_type: "outing" | "home_vacation"
      user_role: "student" | "admin"
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
      complaint_priority: ["low", "medium", "high"],
      complaint_status: ["pending", "in_progress", "resolved"],
      pass_status: ["pending", "approved", "rejected"],
      pass_type: ["outing", "home_vacation"],
      user_role: ["student", "admin"],
    },
  },
} as const
