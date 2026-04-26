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
    PostgrestVersion: "13.0.5"
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
      admin_notes: {
        Row: {
          author_email: string
          business_id: string
          content: string
          created_at: string
          id: string
        }
        Insert: {
          author_email: string
          business_id: string
          content: string
          created_at?: string
          id?: string
        }
        Update: {
          author_email?: string
          business_id?: string
          content?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_notes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "admin_business_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_notes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_plan_changes: {
        Row: {
          business_id: string
          changed_by_email: string
          created_at: string
          id: string
          new_plan_id: string | null
          old_plan_id: string | null
          reason: string | null
        }
        Insert: {
          business_id: string
          changed_by_email: string
          created_at?: string
          id?: string
          new_plan_id?: string | null
          old_plan_id?: string | null
          reason?: string | null
        }
        Update: {
          business_id?: string
          changed_by_email?: string
          created_at?: string
          id?: string
          new_plan_id?: string | null
          old_plan_id?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_plan_changes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "admin_business_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_plan_changes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_plan_changes_new_plan_id_fkey"
            columns: ["new_plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_plan_changes_old_plan_id_fkey"
            columns: ["old_plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_tags: {
        Row: {
          business_id: string
          created_at: string
          id: string
          tag: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          tag: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_tags_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "admin_business_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_tags_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          business_id: string | null
          created_at: string | null
          details: Json | null
          event_type: string
          id: string
          severity: string | null
          user_id: string | null
        }
        Insert: {
          business_id?: string | null
          created_at?: string | null
          details?: Json | null
          event_type: string
          id?: string
          severity?: string | null
          user_id?: string | null
        }
        Update: {
          business_id?: string | null
          created_at?: string | null
          details?: Json | null
          event_type?: string
          id?: string
          severity?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "admin_business_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string | null
          business_id: string
          city: string | null
          created_at: string
          id: string
          is_active: boolean
          metadata: Json | null
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          business_id: string
          city?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          business_id?: string
          city?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "branches_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "admin_business_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branches_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          address: string | null
          business_type: string | null
          city: string | null
          coin_image_url: string | null
          coin_name: string
          created_at: string | null
          description: string | null
          id: string
          is_free_forever: boolean
          join_code: string | null
          logo_url: string | null
          loyalty_mode: string
          max_points_per_transaction: number | null
          min_purchase: number | null
          min_purchase_for_points: number | null
          name: string
          owner_email: string | null
          owner_id: string
          pesos_per_point: number | null
          phone: string | null
          points_expiry_days: number | null
          points_per_purchase: number | null
          pos_mode: string | null
          pos_onboarded: boolean
          qr_code_url: string | null
          referral_reward_points: number
          slug: string
          subscription_status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          business_type?: string | null
          city?: string | null
          coin_image_url?: string | null
          coin_name?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_free_forever?: boolean
          join_code?: string | null
          logo_url?: string | null
          loyalty_mode?: string
          max_points_per_transaction?: number | null
          min_purchase?: number | null
          min_purchase_for_points?: number | null
          name: string
          owner_email?: string | null
          owner_id: string
          pesos_per_point?: number | null
          phone?: string | null
          points_expiry_days?: number | null
          points_per_purchase?: number | null
          pos_mode?: string | null
          pos_onboarded?: boolean
          qr_code_url?: string | null
          referral_reward_points?: number
          slug: string
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          business_type?: string | null
          city?: string | null
          coin_image_url?: string | null
          coin_name?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_free_forever?: boolean
          join_code?: string | null
          logo_url?: string | null
          loyalty_mode?: string
          max_points_per_transaction?: number | null
          min_purchase?: number | null
          min_purchase_for_points?: number | null
          name?: string
          owner_email?: string | null
          owner_id?: string
          pesos_per_point?: number | null
          phone?: string | null
          points_expiry_days?: number | null
          points_per_purchase?: number | null
          pos_mode?: string | null
          pos_onboarded?: boolean
          qr_code_url?: string | null
          referral_reward_points?: number
          slug?: string
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string | null
        }
        Relationships: []
      }
      customer_businesses: {
        Row: {
          business_id: string
          customer_id: string
          followed_at: string | null
          id: string
          points: number
        }
        Insert: {
          business_id: string
          customer_id: string
          followed_at?: string | null
          id?: string
          points?: number
        }
        Update: {
          business_id?: string
          customer_id?: string
          followed_at?: string | null
          id?: string
          points?: number
        }
        Relationships: [
          {
            foreignKeyName: "customer_businesses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "admin_business_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_businesses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_businesses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          age: number | null
          created_at: string | null
          created_by_business_id: string | null
          created_by_staff_id: string | null
          email: string | null
          email_sent_at: string | null
          email_sent_count: number | null
          failed_pin_attempts: number
          full_name: string | null
          id: string
          is_verified: boolean
          last_visit: string | null
          lifetime_points: number | null
          phone: string | null
          pin_hash: string | null
          pin_locked_until: string | null
          qr_code_url: string | null
          tier: string | null
          total_points: number | null
          user_id: string | null
          verification_method: string | null
          verified_at: string | null
        }
        Insert: {
          age?: number | null
          created_at?: string | null
          created_by_business_id?: string | null
          created_by_staff_id?: string | null
          email?: string | null
          email_sent_at?: string | null
          email_sent_count?: number | null
          failed_pin_attempts?: number
          full_name?: string | null
          id?: string
          is_verified?: boolean
          last_visit?: string | null
          lifetime_points?: number | null
          phone?: string | null
          pin_hash?: string | null
          pin_locked_until?: string | null
          qr_code_url?: string | null
          tier?: string | null
          total_points?: number | null
          user_id?: string | null
          verification_method?: string | null
          verified_at?: string | null
        }
        Update: {
          age?: number | null
          created_at?: string | null
          created_by_business_id?: string | null
          created_by_staff_id?: string | null
          email?: string | null
          email_sent_at?: string | null
          email_sent_count?: number | null
          failed_pin_attempts?: number
          full_name?: string | null
          id?: string
          is_verified?: boolean
          last_visit?: string | null
          lifetime_points?: number | null
          phone?: string | null
          pin_hash?: string | null
          pin_locked_until?: string | null
          qr_code_url?: string | null
          tier?: string | null
          total_points?: number | null
          user_id?: string | null
          verification_method?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_created_by_business_id_fkey"
            columns: ["created_by_business_id"]
            isOneToOne: false
            referencedRelation: "admin_business_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_created_by_business_id_fkey"
            columns: ["created_by_business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_created_by_staff_id_fkey"
            columns: ["created_by_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      email_queue: {
        Row: {
          attempts: number | null
          created_at: string | null
          external_id: string | null
          id: string
          last_error: string | null
          max_attempts: number | null
          next_retry_at: string | null
          sent_at: string | null
          status: string | null
          subject: string
          template_data: Json
          template_id: string
          to_email: string
          to_name: string | null
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          external_id?: string | null
          id?: string
          last_error?: string | null
          max_attempts?: number | null
          next_retry_at?: string | null
          sent_at?: string | null
          status?: string | null
          subject: string
          template_data: Json
          template_id: string
          to_email: string
          to_name?: string | null
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          external_id?: string | null
          id?: string
          last_error?: string | null
          max_attempts?: number | null
          next_retry_at?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string
          template_data?: Json
          template_id?: string
          to_email?: string
          to_name?: string | null
        }
        Relationships: []
      }
      impersonation_logs: {
        Row: {
          admin_email: string
          admin_user_id: string | null
          created_at: string
          details: Json | null
          event: string
          id: string
          ip_address: unknown
          session_id: string | null
          target_email: string
          target_role: string
          target_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          admin_email: string
          admin_user_id?: string | null
          created_at?: string
          details?: Json | null
          event: string
          id?: string
          ip_address?: unknown
          session_id?: string | null
          target_email: string
          target_role: string
          target_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          admin_email?: string
          admin_user_id?: string | null
          created_at?: string
          details?: Json | null
          event?: string
          id?: string
          ip_address?: unknown
          session_id?: string | null
          target_email?: string
          target_role?: string
          target_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "impersonation_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "impersonation_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      impersonation_sessions: {
        Row: {
          activated_at: string | null
          admin_email: string
          admin_user_id: string
          created_at: string
          ended_at: string | null
          expires_at: string
          id: string
          ip_address: unknown
          magic_otp: string
          mode: string
          opaque_token_hash: string
          reason: string | null
          target_email: string
          target_role: string
          target_user_id: string
          user_agent: string | null
        }
        Insert: {
          activated_at?: string | null
          admin_email: string
          admin_user_id: string
          created_at?: string
          ended_at?: string | null
          expires_at: string
          id?: string
          ip_address?: unknown
          magic_otp: string
          mode?: string
          opaque_token_hash: string
          reason?: string | null
          target_email: string
          target_role: string
          target_user_id: string
          user_agent?: string | null
        }
        Update: {
          activated_at?: string | null
          admin_email?: string
          admin_user_id?: string
          created_at?: string
          ended_at?: string | null
          expires_at?: string
          id?: string
          ip_address?: unknown
          magic_otp?: string
          mode?: string
          opaque_token_hash?: string
          reason?: string | null
          target_email?: string
          target_role?: string
          target_user_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      instruments: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id?: never
          name: string
        }
        Update: {
          id?: never
          name?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount_due_centavos: number
          amount_paid_centavos: number
          business_id: string
          created_at: string
          currency: string
          due_date: string | null
          id: string
          paid_at: string | null
          period_end: string | null
          period_start: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subscription_id: string | null
        }
        Insert: {
          amount_due_centavos: number
          amount_paid_centavos?: number
          business_id: string
          created_at?: string
          currency?: string
          due_date?: string | null
          id?: string
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subscription_id?: string | null
        }
        Update: {
          amount_due_centavos?: number
          amount_paid_centavos?: number
          business_id?: string
          created_at?: string
          currency?: string
          due_date?: string | null
          id?: string
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "admin_business_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      manual_invoice_payments: {
        Row: {
          amount_centavos: number
          created_at: string
          id: string
          invoice_id: string
          notes: string | null
          payment_date: string
          payment_method: string | null
          recorded_by_email: string
          reference_number: string | null
        }
        Insert: {
          amount_centavos: number
          created_at?: string
          id?: string
          invoice_id: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          recorded_by_email: string
          reference_number?: string | null
        }
        Update: {
          amount_centavos?: number
          created_at?: string
          id?: string
          invoice_id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          recorded_by_email?: string
          reference_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "manual_invoice_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "manual_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      manual_invoices: {
        Row: {
          amount_centavos: number
          amount_paid_centavos: number
          business_id: string
          created_at: string
          created_by_email: string
          currency: string
          description: string | null
          due_date: string | null
          id: string
          invoice_number: string
          notes: string | null
          paid_at: string | null
          period_end: string | null
          period_start: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount_centavos: number
          amount_paid_centavos?: number
          business_id: string
          created_at?: string
          created_by_email: string
          currency?: string
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_number: string
          notes?: string | null
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount_centavos?: number
          amount_paid_centavos?: number
          business_id?: string
          created_at?: string
          created_by_email?: string
          currency?: string
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          notes?: string | null
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "manual_invoices_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "admin_business_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manual_invoices_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          business_id: string
          created_at: string
          customer_id: string
          data: Json | null
          id: string
          is_read: boolean
          title: string
          type: string
        }
        Insert: {
          body: string
          business_id: string
          created_at?: string
          customer_id: string
          data?: Json | null
          id?: string
          is_read?: boolean
          title: string
          type?: string
        }
        Update: {
          body?: string
          business_id?: string
          created_at?: string
          customer_id?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "admin_business_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_history: {
        Row: {
          amount: number
          business_id: string
          created_at: string | null
          currency: string | null
          failure_reason: string | null
          id: string
          paid_at: string | null
          status: string
        }
        Insert: {
          amount: number
          business_id: string
          created_at?: string | null
          currency?: string | null
          failure_reason?: string | null
          id?: string
          paid_at?: string | null
          status: string
        }
        Update: {
          amount?: number
          business_id?: string
          created_at?: string | null
          currency?: string | null
          failure_reason?: string | null
          id?: string
          paid_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_history_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "admin_business_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_history_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_centavos: number
          business_id: string
          created_at: string
          currency: string
          description: string | null
          failure_reason: string | null
          id: string
          metadata: Json | null
          paid_at: string | null
          receipt_url: string | null
          status: Database["public"]["Enums"]["payment_status"]
          subscription_id: string | null
        }
        Insert: {
          amount_centavos: number
          business_id: string
          created_at?: string
          currency?: string
          description?: string | null
          failure_reason?: string | null
          id?: string
          metadata?: Json | null
          paid_at?: string | null
          receipt_url?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          subscription_id?: string | null
        }
        Update: {
          amount_centavos?: number
          business_id?: string
          created_at?: string
          currency?: string
          description?: string | null
          failure_reason?: string | null
          id?: string
          metadata?: Json | null
          paid_at?: string | null
          receipt_url?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "admin_business_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string | null
          description: string | null
          display_name: string
          features: Json | null
          has_loyalty: boolean
          has_pos: boolean
          id: string
          is_active: boolean | null
          max_branches: number | null
          max_customers: number | null
          max_staff_per_branch: number | null
          name: string
          price_annual: number | null
          price_monthly: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_name: string
          features?: Json | null
          has_loyalty?: boolean
          has_pos?: boolean
          id?: string
          is_active?: boolean | null
          max_branches?: number | null
          max_customers?: number | null
          max_staff_per_branch?: number | null
          name: string
          price_annual?: number | null
          price_monthly?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_name?: string
          features?: Json | null
          has_loyalty?: boolean
          has_pos?: boolean
          id?: string
          is_active?: boolean | null
          max_branches?: number | null
          max_customers?: number | null
          max_staff_per_branch?: number | null
          name?: string
          price_annual?: number | null
          price_monthly?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pos_sales: {
        Row: {
          amount_tendered_centavos: number | null
          business_id: string
          change_centavos: number
          created_at: string
          customer_id: string | null
          discount_centavos: number
          discount_reason: string | null
          discount_type: string | null
          exchange_discount_centavos: number
          exchange_points: number
          id: string
          idempotency_key: string | null
          payment_method: string | null
          points_earned: number
          points_redeemed: number
          sale_number: string
          staff_id: string | null
          staff_name: string | null
          status: string | null
          subtotal_centavos: number
          tier_multiplier: number
          tier_name: string | null
          total_centavos: number
          updated_at: string
          void_reason: string | null
          voided_at: string | null
          voided_by: string | null
        }
        Insert: {
          amount_tendered_centavos?: number | null
          business_id: string
          change_centavos?: number
          created_at?: string
          customer_id?: string | null
          discount_centavos?: number
          discount_reason?: string | null
          discount_type?: string | null
          exchange_discount_centavos?: number
          exchange_points?: number
          id?: string
          idempotency_key?: string | null
          payment_method?: string | null
          points_earned?: number
          points_redeemed?: number
          sale_number: string
          staff_id?: string | null
          staff_name?: string | null
          status?: string | null
          subtotal_centavos?: number
          tier_multiplier?: number
          tier_name?: string | null
          total_centavos?: number
          updated_at?: string
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Update: {
          amount_tendered_centavos?: number | null
          business_id?: string
          change_centavos?: number
          created_at?: string
          customer_id?: string | null
          discount_centavos?: number
          discount_reason?: string | null
          discount_type?: string | null
          exchange_discount_centavos?: number
          exchange_points?: number
          id?: string
          idempotency_key?: string | null
          payment_method?: string | null
          points_earned?: number
          points_redeemed?: number
          sale_number?: string
          staff_id?: string | null
          staff_name?: string | null
          status?: string | null
          subtotal_centavos?: number
          tier_multiplier?: number
          tier_name?: string | null
          total_centavos?: number
          updated_at?: string
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pos_sales_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "admin_business_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_sales_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          business_id: string
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          low_stock_threshold: number
          name: string
          price_centavos: number
          sku: string | null
          sort_order: number | null
          stock_quantity: number
          updated_at: string | null
        }
        Insert: {
          business_id: string
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          low_stock_threshold?: number
          name: string
          price_centavos: number
          sku?: string | null
          sort_order?: number | null
          stock_quantity?: number
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          low_stock_threshold?: number
          name?: string
          price_centavos?: number
          sku?: string | null
          sort_order?: number | null
          stock_quantity?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "admin_business_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      push_tokens: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          platform: string
          token: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          platform?: string
          token: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          platform?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_tokens_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          action: string
          id: string
          identifier: string
          identifier_type: string
          request_count: number | null
          window_start: string | null
        }
        Insert: {
          action: string
          id?: string
          identifier: string
          identifier_type: string
          request_count?: number | null
          window_start?: string | null
        }
        Update: {
          action?: string
          id?: string
          identifier?: string
          identifier_type?: string
          request_count?: number | null
          window_start?: string | null
        }
        Relationships: []
      }
      redemptions: {
        Row: {
          business_id: string
          completed_at: string | null
          completed_by_user_id: string | null
          created_at: string | null
          customer_id: string
          expires_at: string
          id: string
          points_used: number
          redemption_code: string
          reward_id: string
          status: Database["public"]["Enums"]["redemption_status"] | null
        }
        Insert: {
          business_id: string
          completed_at?: string | null
          completed_by_user_id?: string | null
          created_at?: string | null
          customer_id: string
          expires_at: string
          id?: string
          points_used: number
          redemption_code: string
          reward_id: string
          status?: Database["public"]["Enums"]["redemption_status"] | null
        }
        Update: {
          business_id?: string
          completed_at?: string | null
          completed_by_user_id?: string | null
          created_at?: string | null
          customer_id?: string
          expires_at?: string
          id?: string
          points_used?: number
          redemption_code?: string
          reward_id?: string
          status?: Database["public"]["Enums"]["redemption_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "redemptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "admin_business_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redemptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redemptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_codes: {
        Row: {
          business_id: string
          code: string
          created_at: string
          customer_id: string
          id: string
          is_active: boolean
          max_uses: number
          uses: number
        }
        Insert: {
          business_id: string
          code: string
          created_at?: string
          customer_id: string
          id?: string
          is_active?: boolean
          max_uses?: number
          uses?: number
        }
        Update: {
          business_id?: string
          code?: string
          created_at?: string
          customer_id?: string
          id?: string
          is_active?: boolean
          max_uses?: number
          uses?: number
        }
        Relationships: [
          {
            foreignKeyName: "referral_codes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "admin_business_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_codes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_codes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_completions: {
        Row: {
          business_id: string
          completed_at: string
          id: string
          invitee_customer_id: string
          invitee_points: number
          referral_code_id: string
          referrer_customer_id: string
          referrer_points: number
          status: string
        }
        Insert: {
          business_id: string
          completed_at?: string
          id?: string
          invitee_customer_id: string
          invitee_points: number
          referral_code_id: string
          referrer_customer_id: string
          referrer_points: number
          status?: string
        }
        Update: {
          business_id?: string
          completed_at?: string
          id?: string
          invitee_customer_id?: string
          invitee_points?: number
          referral_code_id?: string
          referrer_customer_id?: string
          referrer_points?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_completions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "admin_business_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_completions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_completions_invitee_customer_id_fkey"
            columns: ["invitee_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_completions_referral_code_id_fkey"
            columns: ["referral_code_id"]
            isOneToOne: false
            referencedRelation: "referral_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_completions_referrer_customer_id_fkey"
            columns: ["referrer_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          active: boolean | null
          business_id: string
          category: string | null
          created_at: string | null
          description: string | null
          discount_type: string | null
          discount_value: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_visible: boolean | null
          points_cost: number
          stock: number | null
          tier_required: string | null
          title: string
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          active?: boolean | null
          business_id: string
          category?: string | null
          created_at?: string | null
          description?: string | null
          discount_type?: string | null
          discount_value?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_visible?: boolean | null
          points_cost: number
          stock?: number | null
          tier_required?: string | null
          title: string
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          active?: boolean | null
          business_id?: string
          category?: string | null
          created_at?: string | null
          description?: string | null
          discount_type?: string | null
          discount_value?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_visible?: boolean | null
          points_cost?: number
          stock?: number | null
          tier_required?: string | null
          title?: string
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rewards_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "admin_business_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rewards_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      sale_items: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          product_id: string | null
          quantity: number
          sale_id: string
          total_centavos: number
          unit_price_centavos: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          product_id?: string | null
          quantity?: number
          sale_id: string
          total_centavos: number
          unit_price_centavos: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          product_id?: string | null
          quantity?: number
          sale_id?: string
          total_centavos?: number
          unit_price_centavos?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "pos_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          amount_tendered_centavos: number | null
          branch_id: string | null
          business_id: string
          change_centavos: number | null
          created_at: string | null
          customer_id: string | null
          discount_centavos: number
          discount_reason: string | null
          discount_type: string | null
          id: string
          notes: string | null
          payment_method: string
          payment_reference: string | null
          points_earned: number | null
          points_redeemed: number | null
          reward_id: string | null
          sale_number: string
          staff_id: string | null
          status: string
          subtotal_centavos: number
          total_centavos: number
          updated_at: string | null
          void_reason: string | null
          voided_at: string | null
          voided_by: string | null
        }
        Insert: {
          amount_tendered_centavos?: number | null
          branch_id?: string | null
          business_id: string
          change_centavos?: number | null
          created_at?: string | null
          customer_id?: string | null
          discount_centavos?: number
          discount_reason?: string | null
          discount_type?: string | null
          id?: string
          notes?: string | null
          payment_method: string
          payment_reference?: string | null
          points_earned?: number | null
          points_redeemed?: number | null
          reward_id?: string | null
          sale_number: string
          staff_id?: string | null
          status?: string
          subtotal_centavos?: number
          total_centavos: number
          updated_at?: string | null
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Update: {
          amount_tendered_centavos?: number | null
          branch_id?: string | null
          business_id?: string
          change_centavos?: number | null
          created_at?: string | null
          customer_id?: string | null
          discount_centavos?: number
          discount_reason?: string | null
          discount_type?: string | null
          id?: string
          notes?: string | null
          payment_method?: string
          payment_reference?: string | null
          points_earned?: number | null
          points_redeemed?: number | null
          reward_id?: string | null
          sale_number?: string
          staff_id?: string | null
          status?: string
          subtotal_centavos?: number
          total_centavos?: number
          updated_at?: string | null
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "admin_business_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_voided_by_fkey"
            columns: ["voided_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      scan_logs: {
        Row: {
          business_id: string
          customer_id: string
          id: string
          points_awarded: number
          scanned_at: string | null
          staff_id: string | null
          transaction_amount: number | null
        }
        Insert: {
          business_id: string
          customer_id: string
          id?: string
          points_awarded?: number
          scanned_at?: string | null
          staff_id?: string | null
          transaction_amount?: number | null
        }
        Update: {
          business_id?: string
          customer_id?: string
          id?: string
          points_awarded?: number
          scanned_at?: string | null
          staff_id?: string | null
          transaction_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scan_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "admin_business_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scan_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scan_logs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scan_logs_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          allow_staff_selection: boolean | null
          branch_id: string | null
          buffer_minutes: number | null
          business_id: string
          category: string | null
          config: Json | null
          created_at: string
          deposit_percentage: number | null
          description: string | null
          duration_minutes: number
          duration_unit: string
          id: string
          image_url: string | null
          inventory_count: number | null
          is_active: boolean
          max_guests: number | null
          name: string
          price_centavos: number | null
          pricing_type: string | null
          requires_time_slot: boolean | null
          updated_at: string
        }
        Insert: {
          allow_staff_selection?: boolean | null
          branch_id?: string | null
          buffer_minutes?: number | null
          business_id: string
          category?: string | null
          config?: Json | null
          created_at?: string
          deposit_percentage?: number | null
          description?: string | null
          duration_minutes?: number
          duration_unit?: string
          id?: string
          image_url?: string | null
          inventory_count?: number | null
          is_active?: boolean
          max_guests?: number | null
          name: string
          price_centavos?: number | null
          pricing_type?: string | null
          requires_time_slot?: boolean | null
          updated_at?: string
        }
        Update: {
          allow_staff_selection?: boolean | null
          branch_id?: string | null
          buffer_minutes?: number | null
          business_id?: string
          category?: string | null
          config?: Json | null
          created_at?: string
          deposit_percentage?: number | null
          description?: string | null
          duration_minutes?: number
          duration_unit?: string
          id?: string
          image_url?: string | null
          inventory_count?: number | null
          is_active?: boolean
          max_guests?: number | null
          name?: string
          price_centavos?: number | null
          pricing_type?: string | null
          requires_time_slot?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "admin_business_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          branch_id: string | null
          branch_name: string | null
          business_id: string
          created_at: string | null
          email: string
          email_verified_at: string | null
          id: string
          invite_id: string | null
          invited_by: string | null
          is_active: boolean | null
          last_login: string | null
          last_scan_at: string | null
          name: string
          points_awarded_today: number | null
          role: Database["public"]["Enums"]["staff_role"]
          scans_today: number | null
          user_id: string
        }
        Insert: {
          branch_id?: string | null
          branch_name?: string | null
          business_id: string
          created_at?: string | null
          email: string
          email_verified_at?: string | null
          id?: string
          invite_id?: string | null
          invited_by?: string | null
          is_active?: boolean | null
          last_login?: string | null
          last_scan_at?: string | null
          name: string
          points_awarded_today?: number | null
          role?: Database["public"]["Enums"]["staff_role"]
          scans_today?: number | null
          user_id: string
        }
        Update: {
          branch_id?: string | null
          branch_name?: string | null
          business_id?: string
          created_at?: string | null
          email?: string
          email_verified_at?: string | null
          id?: string
          invite_id?: string | null
          invited_by?: string | null
          is_active?: boolean | null
          last_login?: string | null
          last_scan_at?: string | null
          name?: string
          points_awarded_today?: number | null
          role?: Database["public"]["Enums"]["staff_role"]
          scans_today?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "admin_business_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_invites: {
        Row: {
          accepted_at: string | null
          branch_name: string | null
          business_id: string
          created_at: string | null
          email: string
          expires_at: string
          id: string
          invited_by: string
          name: string
          role: string
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          branch_name?: string | null
          business_id: string
          created_at?: string | null
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          name: string
          role?: string
          status?: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          branch_name?: string | null
          business_id?: string
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          name?: string
          role?: string
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_invites_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "admin_business_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_invites_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_services: {
        Row: {
          created_at: string
          id: string
          service_id: string
          staff_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          service_id: string
          staff_id: string
        }
        Update: {
          created_at?: string
          id?: string
          service_id?: string
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_services_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      stamp_card_templates: {
        Row: {
          auto_reset: boolean
          business_id: string
          created_at: string
          id: string
          is_active: boolean
          milestones: Json
          min_purchase_amount: number
          reward_description: string | null
          reward_image_url: string | null
          reward_title: string
          title: string
          total_stamps: number
          updated_at: string
        }
        Insert: {
          auto_reset?: boolean
          business_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          milestones?: Json
          min_purchase_amount?: number
          reward_description?: string | null
          reward_image_url?: string | null
          reward_title: string
          title?: string
          total_stamps?: number
          updated_at?: string
        }
        Update: {
          auto_reset?: boolean
          business_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          milestones?: Json
          min_purchase_amount?: number
          reward_description?: string | null
          reward_image_url?: string | null
          reward_title?: string
          title?: string
          total_stamps?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stamp_card_templates_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "admin_business_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stamp_card_templates_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      stamp_cards: {
        Row: {
          business_id: string
          completed_at: string | null
          created_at: string
          customer_id: string
          id: string
          is_completed: boolean
          is_redeemed: boolean
          milestones: Json
          paused_at_milestone: number | null
          redeemed_at: string | null
          redeemed_milestones: Json
          reward_title: string
          stamps_collected: number
          template_id: string
          total_stamps: number
        }
        Insert: {
          business_id: string
          completed_at?: string | null
          created_at?: string
          customer_id: string
          id?: string
          is_completed?: boolean
          is_redeemed?: boolean
          milestones?: Json
          paused_at_milestone?: number | null
          redeemed_at?: string | null
          redeemed_milestones?: Json
          reward_title: string
          stamps_collected?: number
          template_id: string
          total_stamps: number
        }
        Update: {
          business_id?: string
          completed_at?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          is_completed?: boolean
          is_redeemed?: boolean
          milestones?: Json
          paused_at_milestone?: number | null
          redeemed_at?: string | null
          redeemed_milestones?: Json
          reward_title?: string
          stamps_collected?: number
          template_id?: string
          total_stamps?: number
        }
        Relationships: [
          {
            foreignKeyName: "stamp_cards_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "admin_business_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stamp_cards_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stamp_cards_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stamp_cards_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "stamp_card_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      stamp_entries: {
        Row: {
          created_at: string
          id: string
          idempotency_key: string | null
          is_undone: boolean
          notes: string | null
          sale_id: string | null
          staff_id: string | null
          stamp_card_id: string
          undone_at: string | null
          undone_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          idempotency_key?: string | null
          is_undone?: boolean
          notes?: string | null
          sale_id?: string | null
          staff_id?: string | null
          stamp_card_id: string
          undone_at?: string | null
          undone_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          idempotency_key?: string | null
          is_undone?: boolean
          notes?: string | null
          sale_id?: string | null
          staff_id?: string | null
          stamp_card_id?: string
          undone_at?: string | null
          undone_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stamp_entries_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stamp_entries_stamp_card_id_fkey"
            columns: ["stamp_card_id"]
            isOneToOne: false
            referencedRelation: "stamp_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stamp_entries_undone_by_fkey"
            columns: ["undone_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          business_id: string
          created_at: string | null
          id: string
          movement_type: string
          notes: string | null
          performed_by: string | null
          performer_name: string | null
          product_id: string
          quantity: number
          reason: string | null
          reference_id: string | null
          stock_after: number
          stock_before: number
        }
        Insert: {
          business_id: string
          created_at?: string | null
          id?: string
          movement_type: string
          notes?: string | null
          performed_by?: string | null
          performer_name?: string | null
          product_id: string
          quantity: number
          reason?: string | null
          reference_id?: string | null
          stock_after: number
          stock_before: number
        }
        Update: {
          business_id?: string
          created_at?: string | null
          id?: string
          movement_type?: string
          notes?: string | null
          performed_by?: string | null
          performer_name?: string | null
          product_id?: string
          quantity?: number
          reason?: string | null
          reference_id?: string | null
          stock_after?: number
          stock_before?: number
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "admin_business_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          billing_interval: string
          business_id: string
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          cancellation_feedback: string | null
          cancellation_reason: string | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          is_free_forever: boolean | null
          module_pos_override: boolean | null
          plan_id: string | null
          status: string
          trial_ends_at: string | null
          updated_at: string | null
          upgrade_acknowledged: boolean | null
        }
        Insert: {
          billing_interval?: string
          business_id: string
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          cancellation_feedback?: string | null
          cancellation_reason?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          is_free_forever?: boolean | null
          module_pos_override?: boolean | null
          plan_id?: string | null
          status?: string
          trial_ends_at?: string | null
          updated_at?: string | null
          upgrade_acknowledged?: boolean | null
        }
        Update: {
          billing_interval?: string
          business_id?: string
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          cancellation_feedback?: string | null
          cancellation_reason?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          is_free_forever?: boolean | null
          module_pos_override?: boolean | null
          plan_id?: string | null
          status?: string
          trial_ends_at?: string | null
          updated_at?: string | null
          upgrade_acknowledged?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "admin_business_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      tier_config: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          min_points: number
          multiplier: number | null
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id: string
          min_points: number
          multiplier?: number | null
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          min_points?: number
          multiplier?: number | null
          name?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount_spent: number | null
          business_id: string
          created_at: string | null
          customer_id: string
          description: string | null
          id: string
          points: number
          reward_id: string | null
          sale_id: string | null
          stamps_added: number
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Insert: {
          amount_spent?: number | null
          business_id: string
          created_at?: string | null
          customer_id: string
          description?: string | null
          id?: string
          points: number
          reward_id?: string | null
          sale_id?: string | null
          stamps_added?: number
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Update: {
          amount_spent?: number | null
          business_id?: string
          created_at?: string | null
          customer_id?: string
          description?: string | null
          id?: string
          points?: number
          reward_id?: string | null
          sale_id?: string | null
          stamps_added?: number
          type?: Database["public"]["Enums"]["transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "transactions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "admin_business_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "pos_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      upgrade_requests: {
        Row: {
          business_id: string
          created_at: string
          id: string
          owner_email: string
          owner_id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by_email: string | null
          screenshot_url: string
          status: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          owner_email: string
          owner_id: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by_email?: string | null
          screenshot_url: string
          status?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          owner_email?: string
          owner_id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by_email?: string | null
          screenshot_url?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "upgrade_requests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "admin_business_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "upgrade_requests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_tracking: {
        Row: {
          branch_count: number
          business_id: string
          customer_count: number
          id: string
          last_reset_at: string
          points_issued_this_month: number
          staff_count: number
          transactions_this_month: number
          updated_at: string
        }
        Insert: {
          branch_count?: number
          business_id: string
          customer_count?: number
          id?: string
          last_reset_at?: string
          points_issued_this_month?: number
          staff_count?: number
          transactions_this_month?: number
          updated_at?: string
        }
        Update: {
          branch_count?: number
          business_id?: string
          customer_count?: number
          id?: string
          last_reset_at?: string
          points_issued_this_month?: number
          staff_count?: number
          transactions_this_month?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_tracking_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "admin_business_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_tracking_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string | null
          id: string
          role_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          role_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          role_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_codes: {
        Row: {
          attempts: number
          business_id: string
          code: string
          created_at: string
          customer_id: string | null
          email: string
          expires_at: string
          id: string
          max_attempts: number
          purpose: string
          verified_at: string | null
        }
        Insert: {
          attempts?: number
          business_id: string
          code: string
          created_at?: string
          customer_id?: string | null
          email: string
          expires_at: string
          id?: string
          max_attempts?: number
          purpose?: string
          verified_at?: string | null
        }
        Update: {
          attempts?: number
          business_id?: string
          code?: string
          created_at?: string
          customer_id?: string | null
          email?: string
          expires_at?: string
          id?: string
          max_attempts?: number
          purpose?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verification_codes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "admin_business_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_codes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_codes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      admin_business_stats: {
        Row: {
          branch_count: number | null
          business_type: string | null
          created_at: string | null
          customer_count: number | null
          id: string | null
          last_active_at: string | null
          name: string | null
          owner_email: string | null
          phone: string | null
          plan_name: string | null
          points_issued: number | null
          slug: string | null
          staff_count: number | null
          subscription_status:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          transaction_count: number | null
          transactions_30d: number | null
        }
        Relationships: []
      }
      admin_platform_stats: {
        Row: {
          active_subscriptions: number | null
          bookings_30d: number | null
          businesses_30d: number | null
          businesses_7d: number | null
          customers_30d: number | null
          enterprise_count: number | null
          free_count: number | null
          points_issued_30d: number | null
          total_bookings: number | null
          total_businesses: number | null
          total_customers: number | null
          total_points_issued: number | null
          total_transactions: number | null
          transactions_30d: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_staff_invite: {
        Args: { p_token: string; p_user_id: string }
        Returns: Json
      }
      add_business_points: {
        Args: { p_business_id: string; p_customer_id: string; p_points: number }
        Returns: undefined
      }
      add_customer_points: {
        Args: { p_customer_id: string; p_points: number }
        Returns: undefined
      }
      add_stamp:
        | {
            Args: {
              p_business_id: string
              p_customer_id: string
              p_notes?: string
              p_sale_id?: string
              p_staff_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_business_id: string
              p_customer_id: string
              p_idempotency_key?: string
              p_notes?: string
              p_sale_id?: string
              p_staff_id: string
            }
            Returns: Json
          }
      admin_get_customer_detail: {
        Args: { p_customer_id: string }
        Returns: {
          customer_id: string
          email: string
          memberships: Json
          phone: string
          recent_transactions: Json
        }[]
      }
      admin_list_business_customers: {
        Args: {
          p_business_id: string
          p_limit?: number
          p_offset?: number
          p_search?: string
        }
        Returns: {
          customer_id: string
          email: string
          followed_at: string
          last_transaction_at: string
          phone: string
          points: number
          total_count: number
          transaction_count: number
        }[]
      }
      admin_list_enterprise_accounts: {
        Args: never
        Returns: {
          business_id: string
          business_name: string
          has_pos: boolean
          owner_email: string
          plan_display_name: string
          plan_name: string
          subscription_id: string
          upgraded_at: string
        }[]
      }
      admin_list_users: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_role?: string
          p_search?: string
        }
        Returns: {
          business_count: number
          business_id: string
          business_name: string
          created_at: string
          email: string
          role: string
          total_count: number
          user_id: string
        }[]
      }
      check_plan_limit: {
        Args: { p_business_id: string; p_limit_type: string }
        Returns: Json
      }
      check_rate_limit: {
        Args: {
          p_action: string
          p_identifier: string
          p_identifier_type: string
          p_max_requests: number
          p_window_seconds: number
        }
        Returns: boolean
      }
      check_subscription_access: {
        Args: { p_business_id: string }
        Returns: boolean
      }
      check_subscription_limit: {
        Args: { p_business_id: string; p_limit_type: string }
        Returns: boolean
      }
      claim_referral_code: {
        Args: { p_invitee_customer_id: string; p_referral_code: string }
        Returns: Json
      }
      cleanup_expired_verification_codes: { Args: never; Returns: number }
      clear_invalid_milestone_pauses: {
        Args: { p_template_id: string; p_valid_positions?: number[] }
        Returns: undefined
      }
      complete_redemption: {
        Args: { p_completed_by: string; p_redemption_id: string }
        Returns: Json
      }
      complete_referral: {
        Args: { p_invitee_customer_id: string; p_referral_code: string }
        Returns: Json
      }
      decrease_reward_stock: {
        Args: { p_reward_id: string }
        Returns: undefined
      }
      decrement_usage: {
        Args: { p_business_id: string; p_column: string }
        Returns: undefined
      }
      deduct_business_points: {
        Args: { p_business_id: string; p_customer_id: string; p_points: number }
        Returns: undefined
      }
      deduct_customer_points: {
        Args: { p_customer_id: string; p_points: number }
        Returns: undefined
      }
      delete_business: {
        Args: { p_admin_email?: string; p_business_id: string }
        Returns: {
          business_name: string
          owner_id: string
        }[]
      }
      find_or_create_customer_by_email: {
        Args: {
          p_age: number
          p_business_id: string
          p_email: string
          p_full_name: string
          p_phone: string
          p_staff_id: string
        }
        Returns: {
          customer_id: string
          is_new: boolean
          qr_code_url: string
        }[]
      }
      generate_booking_code: { Args: never; Returns: string }
      generate_business_slug: {
        Args: { business_name: string }
        Returns: string
      }
      generate_sale_number: { Args: { p_business_id: string }; Returns: string }
      generate_slug: { Args: { name: string }; Returns: string }
      get_admin_business_facets: { Args: never; Returns: Json }
      get_audit_event_types: { Args: never; Returns: string[] }
      get_business_activity_trend: {
        Args: { p_business_id: string; p_days?: number }
        Returns: {
          day: string
          new_customers: number
          points_earned: number
          transactions: number
        }[]
      }
      get_customer_stamp_cards: {
        Args: { p_business_id?: string; p_customer_id: string }
        Returns: Json
      }
      get_customer_tier: {
        Args: { p_lifetime_points: number }
        Returns: string
      }
      get_invite_with_business: { Args: { p_token: string }; Returns: Json }
      get_or_create_referral_code: {
        Args: { p_business_id: string; p_customer_id: string }
        Returns: string
      }
      get_staff_by_user: {
        Args: { p_business_id: string; p_user_id: string }
        Returns: {
          business_id: string
          email: string
          id: string
          is_active: boolean
          last_login: string
          name: string
          role: string
          user_id: string
        }[]
      }
      get_staff_today_stats: { Args: { p_staff_id: string }; Returns: Json }
      get_tier_multiplier: { Args: { p_tier: string }; Returns: number }
      get_user_role: {
        Args: { p_user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_staff_info: {
        Args: { p_user_id: string }
        Returns: {
          business_id: string
          business_name: string
          is_active: boolean
          role: Database["public"]["Enums"]["staff_role"]
          staff_id: string
        }[]
      }
      increment_usage: {
        Args: { p_business_id: string; p_column: string }
        Returns: undefined
      }
      insert_staff_record: {
        Args: {
          p_business_id: string
          p_email: string
          p_name: string
          p_role: string
          p_user_id: string
        }
        Returns: Json
      }
      link_oauth_to_customer: {
        Args: { p_email: string; p_user_id: string }
        Returns: string
      }
      link_oauth_to_customer_by_phone: {
        Args: { p_phone: string; p_user_id: string }
        Returns: string
      }
      lookup_customer_by_qr: {
        Args: { p_scanned_code: string }
        Returns: {
          created_by_business_id: string
          email: string
          full_name: string
          id: string
          lifetime_points: number
          qr_code_url: string
          tier: string
          total_points: number
          user_id: string
        }[]
      }
      process_staff_sale: {
        Args: {
          p_amount_tendered_centavos?: number
          p_business_id: string
          p_customer_id: string
          p_discount_centavos?: number
          p_discount_reason?: string
          p_discount_type?: string
          p_exchange_points?: number
          p_idempotency_key?: string
          p_sale_items?: Json
          p_staff_id: string
          p_staff_name: string
          p_subtotal_centavos: number
          p_tier_multiplier?: number
          p_tier_name?: string
        }
        Returns: Json
      }
      recalculate_usage_counts: {
        Args: { p_business_id: string }
        Returns: undefined
      }
      record_customer_scan: {
        Args: {
          p_amount?: number
          p_customer_id: string
          p_points: number
          p_staff_id: string
        }
        Returns: Json
      }
      redeem_milestone: {
        Args: { p_staff_id: string; p_stamp_card_id: string }
        Returns: Json
      }
      redeem_reward: {
        Args: { p_customer_id: string; p_reward_id: string }
        Returns: Json
      }
      redeem_stamp_card: {
        Args: { p_staff_id: string; p_stamp_card_id: string }
        Returns: Json
      }
      resolve_customer_for_business: {
        Args: { p_business_id: string; p_scanned_code: string }
        Returns: {
          created_by_business_id: string
          email: string
          full_name: string
          id: string
          lifetime_points: number
          qr_code_url: string
          tier: string
          total_points: number
          user_id: string
        }[]
      }
      sum_business_points_30d: {
        Args: { p_business_id: string }
        Returns: number
      }
      undo_last_stamp: {
        Args: { p_staff_id: string; p_stamp_card_id: string }
        Returns: Json
      }
      update_staff_last_login: {
        Args: { p_staff_id: string }
        Returns: undefined
      }
      update_usage_counts: {
        Args: { p_business_id: string }
        Returns: undefined
      }
      verify_customer_otp: {
        Args: { p_business_id: string; p_code: string; p_email: string }
        Returns: Json
      }
      verify_redemption_code: {
        Args: { p_business_id: string; p_code: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "business_owner" | "staff" | "customer"
      billing_interval: "monthly" | "annual"
      invoice_status: "draft" | "open" | "paid" | "void" | "uncollectible"
      payment_status:
        | "pending"
        | "succeeded"
        | "failed"
        | "refunded"
        | "canceled"
      redemption_status: "pending" | "completed" | "expired" | "cancelled"
      staff_role: "owner" | "manager" | "cashier"
      subscription_status:
        | "preview"
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "expired"
        | "free_forever"
      transaction_type: "earn" | "redeem"
      user_role: "business" | "customer"
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
      app_role: ["admin", "business_owner", "staff", "customer"],
      billing_interval: ["monthly", "annual"],
      invoice_status: ["draft", "open", "paid", "void", "uncollectible"],
      payment_status: [
        "pending",
        "succeeded",
        "failed",
        "refunded",
        "canceled",
      ],
      redemption_status: ["pending", "completed", "expired", "cancelled"],
      staff_role: ["owner", "manager", "cashier"],
      subscription_status: [
        "preview",
        "trialing",
        "active",
        "past_due",
        "canceled",
        "expired",
        "free_forever",
      ],
      transaction_type: ["earn", "redeem"],
      user_role: ["business", "customer"],
    },
  },
} as const
