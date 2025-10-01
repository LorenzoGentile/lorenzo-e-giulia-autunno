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
      additional_guests: {
        Row: {
          dietary_restrictions: string | null
          id: string
          name: string
          rsvp_id: string
          table_id: string | null
        }
        Insert: {
          dietary_restrictions?: string | null
          id?: string
          name: string
          rsvp_id: string
          table_id?: string | null
        }
        Update: {
          dietary_restrictions?: string | null
          id?: string
          name?: string
          rsvp_id?: string
          table_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "additional_guests_rsvp_id_fkey"
            columns: ["rsvp_id"]
            isOneToOne: false
            referencedRelation: "rsvp_responses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "additional_guests_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "wedding_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      invited_guests: {
        Row: {
          created_at: string
          email: string
          id: string
          invite_code: string
          name: string
          reminder_count: number | null
          reminder_sent_at: string | null
          table_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          invite_code: string
          name: string
          reminder_count?: number | null
          reminder_sent_at?: string | null
          table_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          invite_code?: string
          name?: string
          reminder_count?: number | null
          reminder_sent_at?: string | null
          table_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invited_guests_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "wedding_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      photo_comments: {
        Row: {
          comment_text: string
          created_at: string | null
          guest_id: string
          id: string
          photo_id: string
        }
        Insert: {
          comment_text: string
          created_at?: string | null
          guest_id: string
          id?: string
          photo_id: string
        }
        Update: {
          comment_text?: string
          created_at?: string | null
          guest_id?: string
          id?: string
          photo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "photo_comments_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "invited_guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_comments_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "wedding_photos"
            referencedColumns: ["id"]
          },
        ]
      }
      photo_reactions: {
        Row: {
          created_at: string | null
          guest_id: string
          id: string
          photo_id: string
          reaction_type: string
        }
        Insert: {
          created_at?: string | null
          guest_id: string
          id?: string
          photo_id: string
          reaction_type?: string
        }
        Update: {
          created_at?: string | null
          guest_id?: string
          id?: string
          photo_id?: string
          reaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "photo_reactions_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "invited_guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_reactions_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "wedding_photos"
            referencedColumns: ["id"]
          },
        ]
      }
      rsvp_responses: {
        Row: {
          attending: boolean
          created_at: string
          dietary_restrictions: string | null
          guest_id: string
          id: string
          message: string | null
          reminder_count: number | null
          reminder_sent_at: string | null
          updated_at: string
        }
        Insert: {
          attending: boolean
          created_at?: string
          dietary_restrictions?: string | null
          guest_id: string
          id?: string
          message?: string | null
          reminder_count?: number | null
          reminder_sent_at?: string | null
          updated_at?: string
        }
        Update: {
          attending?: boolean
          created_at?: string
          dietary_restrictions?: string | null
          guest_id?: string
          id?: string
          message?: string | null
          reminder_count?: number | null
          reminder_sent_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rsvp_responses_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: true
            referencedRelation: "invited_guests"
            referencedColumns: ["id"]
          },
        ]
      }
      shuttle_preferences: {
        Row: {
          created_at: string
          guest_id: string
          id: string
          interested: boolean
          number_of_people: number | null
          outbound_alternative_location: string | null
          outbound_location: string | null
          outbound_time: string | null
          outbound_wanted: boolean | null
          return_time: string | null
          return_wanted: boolean | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          guest_id: string
          id?: string
          interested: boolean
          number_of_people?: number | null
          outbound_alternative_location?: string | null
          outbound_location?: string | null
          outbound_time?: string | null
          outbound_wanted?: boolean | null
          return_time?: string | null
          return_wanted?: boolean | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          guest_id?: string
          id?: string
          interested?: boolean
          number_of_people?: number | null
          outbound_alternative_location?: string | null
          outbound_location?: string | null
          outbound_time?: string | null
          outbound_wanted?: boolean | null
          return_time?: string | null
          return_wanted?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shuttle_preferences_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: true
            referencedRelation: "invited_guests"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wedding_photos: {
        Row: {
          caption: string | null
          created_at: string
          guest_id: string
          id: string
          image_url: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          guest_id: string
          id?: string
          image_url: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          guest_id?: string
          id?: string
          image_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "wedding_photos_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "invited_guests"
            referencedColumns: ["id"]
          },
        ]
      }
      wedding_tables: {
        Row: {
          capacity: number
          created_at: string
          id: string
          table_name: string | null
          table_number: number
          updated_at: string
          x_position: number | null
          y_position: number | null
        }
        Insert: {
          capacity?: number
          created_at?: string
          id?: string
          table_name?: string | null
          table_number: number
          updated_at?: string
          x_position?: number | null
          y_position?: number | null
        }
        Update: {
          capacity?: number
          created_at?: string
          id?: string
          table_name?: string | null
          table_number?: number
          updated_at?: string
          x_position?: number | null
          y_position?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
