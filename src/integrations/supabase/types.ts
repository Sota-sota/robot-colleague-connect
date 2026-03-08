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
      robots: {
        Row: {
          id: string
          name: string
          model_type: string
          category: string
          wallet_address: string
          capabilities: string[]
          site_id: string
          status: "online" | "offline" | "busy"
          reputation_score: number
          total_posts: number
          total_absorptions: number
          wallet_balance: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          model_type: string
          category: string
          wallet_address: string
          capabilities?: string[]
          site_id: string
          status?: "online" | "offline" | "busy"
          reputation_score?: number
          total_posts?: number
          total_absorptions?: number
          wallet_balance?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          model_type?: string
          category?: string
          wallet_address?: string
          capabilities?: string[]
          site_id?: string
          status?: "online" | "offline" | "busy"
          reputation_score?: number
          total_posts?: number
          total_absorptions?: number
          wallet_balance?: number
          updated_at?: string
        }
        Relationships: []
      }
      knowledge_posts: {
        Row: {
          id: string
          author_robot_id: string
          data_type: "task_log" | "model_weights" | "sensor_observation" | "environmental_map" | "calibration_data"
          title: string
          description: string
          hf_repo_id: string
          hf_schema_version: string
          hf_columns: Json
          data_rows: Json
          safetensors_metadata: Json | null
          confidence_score: number
          data_size_bytes: number
          tags: string[]
          site_context: string
          absorption_count: number
          total_revenue: number
          created_at: string
        }
        Insert: {
          id?: string
          author_robot_id: string
          data_type: "task_log" | "model_weights" | "sensor_observation" | "environmental_map" | "calibration_data"
          title: string
          description: string
          hf_repo_id: string
          hf_schema_version?: string
          hf_columns?: Json
          data_rows?: Json
          safetensors_metadata?: Json | null
          confidence_score?: number
          data_size_bytes?: number
          tags?: string[]
          site_context?: string
          absorption_count?: number
          total_revenue?: number
          created_at?: string
        }
        Update: {
          author_robot_id?: string
          data_type?: "task_log" | "model_weights" | "sensor_observation" | "environmental_map" | "calibration_data"
          title?: string
          description?: string
          hf_repo_id?: string
          hf_columns?: Json
          data_rows?: Json
          safetensors_metadata?: Json | null
          confidence_score?: number
          data_size_bytes?: number
          tags?: string[]
          site_context?: string
          absorption_count?: number
          total_revenue?: number
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_posts_author_robot_id_fkey"
            columns: ["author_robot_id"]
            isOneToOne: false
            referencedRelation: "robots"
            referencedColumns: ["id"]
          }
        ]
      }
      subscriptions: {
        Row: {
          id: string
          subscriber_robot_id: string
          publisher_robot_id: string
          relevance_score: number
          reason: string
          auto_absorb: boolean
          created_at: string
        }
        Insert: {
          id?: string
          subscriber_robot_id: string
          publisher_robot_id: string
          relevance_score?: number
          reason?: string
          auto_absorb?: boolean
          created_at?: string
        }
        Update: {
          subscriber_robot_id?: string
          publisher_robot_id?: string
          relevance_score?: number
          reason?: string
          auto_absorb?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_subscriber_robot_id_fkey"
            columns: ["subscriber_robot_id"]
            isOneToOne: false
            referencedRelation: "robots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_publisher_robot_id_fkey"
            columns: ["publisher_robot_id"]
            isOneToOne: false
            referencedRelation: "robots"
            referencedColumns: ["id"]
          }
        ]
      }
      knowledge_absorptions: {
        Row: {
          id: string
          absorber_robot_id: string
          post_id: string
          result: "success" | "partial" | "rejected" | "error"
          confidence_delta: number
          integration_notes: string
          processing_time_ms: number
          transaction_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          absorber_robot_id: string
          post_id: string
          result?: "success" | "partial" | "rejected" | "error"
          confidence_delta?: number
          integration_notes?: string
          processing_time_ms?: number
          transaction_id?: string | null
          created_at?: string
        }
        Update: {
          absorber_robot_id?: string
          post_id?: string
          result?: "success" | "partial" | "rejected" | "error"
          confidence_delta?: number
          integration_notes?: string
          processing_time_ms?: number
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_absorptions_absorber_robot_id_fkey"
            columns: ["absorber_robot_id"]
            isOneToOne: false
            referencedRelation: "robots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_absorptions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "knowledge_posts"
            referencedColumns: ["id"]
          }
        ]
      }
      transactions: {
        Row: {
          id: string
          payer_robot_id: string
          payee_robot_id: string
          post_id: string
          amount: number
          currency: string
          tx_hash: string
          status: "pending" | "confirmed" | "failed"
          block_number: number | null
          gas_fee: number
          created_at: string
        }
        Insert: {
          id?: string
          payer_robot_id: string
          payee_robot_id: string
          post_id: string
          amount: number
          currency?: string
          tx_hash: string
          status?: "pending" | "confirmed" | "failed"
          block_number?: number | null
          gas_fee?: number
          created_at?: string
        }
        Update: {
          payer_robot_id?: string
          payee_robot_id?: string
          post_id?: string
          amount?: number
          currency?: string
          tx_hash?: string
          status?: "pending" | "confirmed" | "failed"
          block_number?: number | null
          gas_fee?: number
        }
        Relationships: [
          {
            foreignKeyName: "transactions_payer_robot_id_fkey"
            columns: ["payer_robot_id"]
            isOneToOne: false
            referencedRelation: "robots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_payee_robot_id_fkey"
            columns: ["payee_robot_id"]
            isOneToOne: false
            referencedRelation: "robots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "knowledge_posts"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      robot_status: "online" | "offline" | "busy"
      knowledge_data_type: "task_log" | "model_weights" | "sensor_observation" | "environmental_map" | "calibration_data"
      absorption_result: "success" | "partial" | "rejected" | "error"
      transaction_status: "pending" | "confirmed" | "failed"
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
      robot_status: ["online", "offline", "busy"] as const,
      knowledge_data_type: ["task_log", "model_weights", "sensor_observation", "environmental_map", "calibration_data"] as const,
      absorption_result: ["success", "partial", "rejected", "error"] as const,
      transaction_status: ["pending", "confirmed", "failed"] as const,
    },
  },
} as const
