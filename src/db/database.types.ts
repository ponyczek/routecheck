export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  graphql_public: {
    Tables: Record<never, never>;
    Views: Record<never, never>;
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
  public: {
    Tables: {
      companies: {
        Row: {
          created_at: string;
          name: string;
          uuid: string;
        };
        Insert: {
          created_at?: string;
          name: string;
          uuid?: string;
        };
        Update: {
          created_at?: string;
          name?: string;
          uuid?: string;
        };
        Relationships: [];
      };
      driver_vehicle_assignments: {
        Row: {
          company_uuid: string;
          driver_uuid: string;
          end_date: string | null;
          start_date: string;
          uuid: string;
          vehicle_uuid: string;
        };
        Insert: {
          company_uuid: string;
          driver_uuid: string;
          end_date?: string | null;
          start_date: string;
          uuid?: string;
          vehicle_uuid: string;
        };
        Update: {
          company_uuid?: string;
          driver_uuid?: string;
          end_date?: string | null;
          start_date?: string;
          uuid?: string;
          vehicle_uuid?: string;
        };
        Relationships: [
          {
            foreignKeyName: "driver_vehicle_assignments_company_uuid_fkey";
            columns: ["company_uuid"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["uuid"];
          },
          {
            foreignKeyName: "driver_vehicle_assignments_driver_uuid_fkey";
            columns: ["driver_uuid"];
            isOneToOne: false;
            referencedRelation: "drivers";
            referencedColumns: ["uuid"];
          },
          {
            foreignKeyName: "driver_vehicle_assignments_vehicle_uuid_fkey";
            columns: ["vehicle_uuid"];
            isOneToOne: false;
            referencedRelation: "vehicles";
            referencedColumns: ["uuid"];
          },
        ];
      };
      drivers: {
        Row: {
          company_uuid: string;
          created_at: string;
          deleted_at: string | null;
          email: string;
          is_active: boolean;
          name: string;
          timezone: string;
          uuid: string;
        };
        Insert: {
          company_uuid: string;
          created_at?: string;
          deleted_at?: string | null;
          email: string;
          is_active?: boolean;
          name: string;
          timezone?: string;
          uuid?: string;
        };
        Update: {
          company_uuid?: string;
          created_at?: string;
          deleted_at?: string | null;
          email?: string;
          is_active?: boolean;
          name?: string;
          timezone?: string;
          uuid?: string;
        };
        Relationships: [
          {
            foreignKeyName: "drivers_company_uuid_fkey";
            columns: ["company_uuid"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["uuid"];
          },
        ];
      };
      email_logs: {
        Row: {
          company_uuid: string | null;
          error_message: string | null;
          recipient: string;
          sent_at: string;
          status: string;
          subject: string;
          uuid: string;
        };
        Insert: {
          company_uuid?: string | null;
          error_message?: string | null;
          recipient: string;
          sent_at?: string;
          status: string;
          subject: string;
          uuid?: string;
        };
        Update: {
          company_uuid?: string | null;
          error_message?: string | null;
          recipient?: string;
          sent_at?: string;
          status?: string;
          subject?: string;
          uuid?: string;
        };
        Relationships: [
          {
            foreignKeyName: "email_logs_company_uuid_fkey";
            columns: ["company_uuid"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["uuid"];
          },
        ];
      };
      report_ai_results: {
        Row: {
          ai_summary: string | null;
          created_at: string;
          report_date: string;
          report_uuid: string;
          risk_level: Database["public"]["Enums"]["report_risk_level"];
          updated_at: string | null;
        };
        Insert: {
          ai_summary?: string | null;
          created_at?: string;
          report_date: string;
          report_uuid: string;
          risk_level: Database["public"]["Enums"]["report_risk_level"];
          updated_at?: string | null;
        };
        Update: {
          ai_summary?: string | null;
          created_at?: string;
          report_date?: string;
          report_uuid?: string;
          risk_level?: Database["public"]["Enums"]["report_risk_level"];
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "report_ai_results_report_uuid_report_date_fkey";
            columns: ["report_uuid", "report_date"];
            isOneToOne: true;
            referencedRelation: "reports";
            referencedColumns: ["uuid", "report_date"];
          },
        ];
      };
      report_links: {
        Row: {
          company_uuid: string;
          created_at: string;
          driver_uuid: string;
          expires_at: string;
          hashed_token: string;
          used_at: string | null;
          uuid: string;
        };
        Insert: {
          company_uuid: string;
          created_at?: string;
          driver_uuid: string;
          expires_at: string;
          hashed_token: string;
          used_at?: string | null;
          uuid?: string;
        };
        Update: {
          company_uuid?: string;
          created_at?: string;
          driver_uuid?: string;
          expires_at?: string;
          hashed_token?: string;
          used_at?: string | null;
          uuid?: string;
        };
        Relationships: [
          {
            foreignKeyName: "report_links_company_uuid_fkey";
            columns: ["company_uuid"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["uuid"];
          },
          {
            foreignKeyName: "report_links_driver_uuid_fkey";
            columns: ["driver_uuid"];
            isOneToOne: false;
            referencedRelation: "drivers";
            referencedColumns: ["uuid"];
          },
        ];
      };
      report_risk_tags: {
        Row: {
          report_date: string;
          report_uuid: string;
          tag_id: number;
        };
        Insert: {
          report_date: string;
          report_uuid: string;
          tag_id: number;
        };
        Update: {
          report_date?: string;
          report_uuid?: string;
          tag_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "report_risk_tags_report_uuid_report_date_fkey";
            columns: ["report_uuid", "report_date"];
            isOneToOne: false;
            referencedRelation: "reports";
            referencedColumns: ["uuid", "report_date"];
          },
          {
            foreignKeyName: "report_risk_tags_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "risk_tags";
            referencedColumns: ["id"];
          },
        ];
      };
      reports: {
        Row: {
          cargo_damage_description: string | null;
          company_uuid: string;
          created_at: string;
          delay_minutes: number | null;
          delay_reason: string | null;
          driver_uuid: string;
          is_problem: boolean;
          next_day_blockers: string | null;
          occurred_at: string;
          report_date: string;
          risk_level: Database["public"]["Enums"]["report_risk_level"] | null;
          route_status: Database["public"]["Enums"]["report_route_status"];
          search_vector: unknown;
          timezone: string;
          updated_at: string | null;
          uuid: string;
          vehicle_damage_description: string | null;
        };
        Insert: {
          cargo_damage_description?: string | null;
          company_uuid: string;
          created_at?: string;
          delay_minutes?: number | null;
          delay_reason?: string | null;
          driver_uuid: string;
          is_problem: boolean;
          next_day_blockers?: string | null;
          occurred_at?: string;
          report_date: string;
          risk_level?: Database["public"]["Enums"]["report_risk_level"] | null;
          route_status: Database["public"]["Enums"]["report_route_status"];
          search_vector?: unknown;
          timezone: string;
          updated_at?: string | null;
          uuid?: string;
          vehicle_damage_description?: string | null;
        };
        Update: {
          cargo_damage_description?: string | null;
          company_uuid?: string;
          created_at?: string;
          delay_minutes?: number | null;
          delay_reason?: string | null;
          driver_uuid?: string;
          is_problem?: boolean;
          next_day_blockers?: string | null;
          occurred_at?: string;
          report_date?: string;
          risk_level?: Database["public"]["Enums"]["report_risk_level"] | null;
          route_status?: Database["public"]["Enums"]["report_route_status"];
          search_vector?: unknown;
          timezone?: string;
          updated_at?: string | null;
          uuid?: string;
          vehicle_damage_description?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "reports_company_uuid_fkey";
            columns: ["company_uuid"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["uuid"];
          },
          {
            foreignKeyName: "reports_driver_uuid_fkey";
            columns: ["driver_uuid"];
            isOneToOne: false;
            referencedRelation: "drivers";
            referencedColumns: ["uuid"];
          },
        ];
      };
      reports_default: {
        Row: {
          cargo_damage_description: string | null;
          company_uuid: string;
          created_at: string;
          delay_minutes: number | null;
          delay_reason: string | null;
          driver_uuid: string;
          is_problem: boolean;
          next_day_blockers: string | null;
          occurred_at: string;
          report_date: string;
          risk_level: Database["public"]["Enums"]["report_risk_level"] | null;
          route_status: Database["public"]["Enums"]["report_route_status"];
          search_vector: unknown;
          timezone: string;
          updated_at: string | null;
          uuid: string;
          vehicle_damage_description: string | null;
        };
        Insert: {
          cargo_damage_description?: string | null;
          company_uuid: string;
          created_at?: string;
          delay_minutes?: number | null;
          delay_reason?: string | null;
          driver_uuid: string;
          is_problem: boolean;
          next_day_blockers?: string | null;
          occurred_at?: string;
          report_date: string;
          risk_level?: Database["public"]["Enums"]["report_risk_level"] | null;
          route_status: Database["public"]["Enums"]["report_route_status"];
          search_vector?: unknown;
          timezone: string;
          updated_at?: string | null;
          uuid?: string;
          vehicle_damage_description?: string | null;
        };
        Update: {
          cargo_damage_description?: string | null;
          company_uuid?: string;
          created_at?: string;
          delay_minutes?: number | null;
          delay_reason?: string | null;
          driver_uuid?: string;
          is_problem?: boolean;
          next_day_blockers?: string | null;
          occurred_at?: string;
          report_date?: string;
          risk_level?: Database["public"]["Enums"]["report_risk_level"] | null;
          route_status?: Database["public"]["Enums"]["report_route_status"];
          search_vector?: unknown;
          timezone?: string;
          updated_at?: string | null;
          uuid?: string;
          vehicle_damage_description?: string | null;
        };
        Relationships: [];
      };
      risk_tags: {
        Row: {
          id: number;
          tag_name: string;
        };
        Insert: {
          id?: number;
          tag_name: string;
        };
        Update: {
          id?: number;
          tag_name?: string;
        };
        Relationships: [];
      };
      telemetry_events: {
        Row: {
          company_uuid: string | null;
          driver_uuid: string | null;
          event_type: string;
          link_uuid: string | null;
          metadata: Json | null;
          occurred_at: string;
          report_date: string | null;
          report_uuid: string | null;
          uuid: string;
        };
        Insert: {
          company_uuid?: string | null;
          driver_uuid?: string | null;
          event_type: string;
          link_uuid?: string | null;
          metadata?: Json | null;
          occurred_at?: string;
          report_date?: string | null;
          report_uuid?: string | null;
          uuid?: string;
        };
        Update: {
          company_uuid?: string | null;
          driver_uuid?: string | null;
          event_type?: string;
          link_uuid?: string | null;
          metadata?: Json | null;
          occurred_at?: string;
          report_date?: string | null;
          report_uuid?: string | null;
          uuid?: string;
        };
        Relationships: [
          {
            foreignKeyName: "telemetry_events_company_uuid_fkey";
            columns: ["company_uuid"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["uuid"];
          },
          {
            foreignKeyName: "telemetry_events_driver_uuid_fkey";
            columns: ["driver_uuid"];
            isOneToOne: false;
            referencedRelation: "drivers";
            referencedColumns: ["uuid"];
          },
          {
            foreignKeyName: "telemetry_events_link_uuid_fkey";
            columns: ["link_uuid"];
            isOneToOne: false;
            referencedRelation: "report_links";
            referencedColumns: ["uuid"];
          },
          {
            foreignKeyName: "telemetry_events_report_uuid_report_date_fkey";
            columns: ["report_uuid", "report_date"];
            isOneToOne: false;
            referencedRelation: "reports";
            referencedColumns: ["uuid", "report_date"];
          },
        ];
      };
      telemetry_events_default: {
        Row: {
          company_uuid: string | null;
          driver_uuid: string | null;
          event_type: string;
          link_uuid: string | null;
          metadata: Json | null;
          occurred_at: string;
          report_date: string | null;
          report_uuid: string | null;
          uuid: string;
        };
        Insert: {
          company_uuid?: string | null;
          driver_uuid?: string | null;
          event_type: string;
          link_uuid?: string | null;
          metadata?: Json | null;
          occurred_at?: string;
          report_date?: string | null;
          report_uuid?: string | null;
          uuid?: string;
        };
        Update: {
          company_uuid?: string | null;
          driver_uuid?: string | null;
          event_type?: string;
          link_uuid?: string | null;
          metadata?: Json | null;
          occurred_at?: string;
          report_date?: string | null;
          report_uuid?: string | null;
          uuid?: string;
        };
        Relationships: [];
      };
      users: {
        Row: {
          company_uuid: string;
          created_at: string;
          uuid: string;
        };
        Insert: {
          company_uuid: string;
          created_at?: string;
          uuid: string;
        };
        Update: {
          company_uuid?: string;
          created_at?: string;
          uuid?: string;
        };
        Relationships: [
          {
            foreignKeyName: "users_company_uuid_fkey";
            columns: ["company_uuid"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["uuid"];
          },
        ];
      };
      vehicles: {
        Row: {
          company_uuid: string;
          created_at: string;
          deleted_at: string | null;
          is_active: boolean;
          registration_number: string;
          uuid: string;
          vin: string | null;
        };
        Insert: {
          company_uuid: string;
          created_at?: string;
          deleted_at?: string | null;
          is_active?: boolean;
          registration_number: string;
          uuid?: string;
          vin?: string | null;
        };
        Update: {
          company_uuid?: string;
          created_at?: string;
          deleted_at?: string | null;
          is_active?: boolean;
          registration_number?: string;
          uuid?: string;
          vin?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "vehicles_company_uuid_fkey";
            columns: ["company_uuid"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["uuid"];
          },
        ];
      };
    };
    Views: Record<never, never>;
    Functions: {
      get_user_company_uuid: { Args: never; Returns: string };
    };
    Enums: {
      report_risk_level: "NONE" | "LOW" | "MEDIUM" | "HIGH";
      report_route_status: "COMPLETED" | "PARTIALLY_COMPLETED" | "CANCELLED";
    };
    CompositeTypes: Record<never, never>;
  };
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      report_risk_level: ["NONE", "LOW", "MEDIUM", "HIGH"],
      report_route_status: ["COMPLETED", "PARTIALLY_COMPLETED", "CANCELLED"],
    },
  },
} as const;
