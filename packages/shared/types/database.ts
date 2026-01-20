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
          created_at: string | null
          description: string | null
          id: string
          is_free_forever: boolean
          logo_url: string | null
          max_points_per_transaction: number | null
          min_purchase_for_points: number | null
          name: string
          owner_email: string | null
          owner_id: string
          pesos_per_point: number | null
          phone: string | null
          points_expiry_days: number | null
          points_per_purchase: number | null
          qr_code_url: string | null
          subscription_status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string | null
          xendit_customer_id: string | null
          xendit_payment_method_id: string | null
        }
        Insert: {
          address?: string | null
          business_type?: string | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_free_forever?: boolean
          logo_url?: string | null
          max_points_per_transaction?: number | null
          min_purchase_for_points?: number | null
          name: string
          owner_email?: string | null
          owner_id: string
          pesos_per_point?: number | null
          phone?: string | null
          points_expiry_days?: number | null
          points_per_purchase?: number | null
          qr_code_url?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string | null
          xendit_customer_id?: string | null
          xendit_payment_method_id?: string | null
        }
        Update: {
          address?: string | null
          business_type?: string | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_free_forever?: boolean
          logo_url?: string | null
          max_points_per_transaction?: number | null
          min_purchase_for_points?: number | null
          name?: string
          owner_email?: string | null
          owner_id?: string
          pesos_per_point?: number | null
          phone?: string | null
          points_expiry_days?: number | null
          points_per_purchase?: number | null
          qr_code_url?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string | null
          xendit_customer_id?: string | null
          xendit_payment_method_id?: string | null
        }
        Relationships: []
      }
      customer_businesses: {
        Row: {
          business_id: string
          customer_id: string
          followed_at: string | null
          id: string
        }
        Insert: {
          business_id: string
          customer_id: string
          followed_at?: string | null
          id?: string
        }
        Update: {
          business_id?: string
          customer_id?: string
          followed_at?: string | null
          id?: string
        }
        Relationships: [
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
          card_token: string | null
          card_token_created_at: string | null
          created_at: string | null
          created_by_business_id: string | null
          created_by_staff_id: string | null
          email: string | null
          email_sent_at: string | null
          email_sent_count: number | null
          full_name: string | null
          id: string
          last_visit: string | null
          lifetime_points: number | null
          phone: string | null
          qr_code_url: string | null
          tier: string | null
          total_points: number | null
          user_id: string | null
        }
        Insert: {
          age?: number | null
          card_token?: string | null
          card_token_created_at?: string | null
          created_at?: string | null
          created_by_business_id?: string | null
          created_by_staff_id?: string | null
          email?: string | null
          email_sent_at?: string | null
          email_sent_count?: number | null
          full_name?: string | null
          id?: string
          last_visit?: string | null
          lifetime_points?: number | null
          phone?: string | null
          qr_code_url?: string | null
          tier?: string | null
          total_points?: number | null
          user_id?: string | null
        }
        Update: {
          age?: number | null
          card_token?: string | null
          card_token_created_at?: string | null
          created_at?: string | null
          created_by_business_id?: string | null
          created_by_staff_id?: string | null
          email?: string | null
          email_sent_at?: string | null
          email_sent_count?: number | null
          full_name?: string | null
          id?: string
          last_visit?: string | null
          lifetime_points?: number | null
          phone?: string | null
          qr_code_url?: string | null
          tier?: string | null
          total_points?: number | null
          user_id?: string | null
        }
        Relationships: [
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
          stripe_hosted_invoice_url: string | null
          stripe_invoice_id: string
          stripe_invoice_number: string | null
          stripe_invoice_pdf: string | null
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
          stripe_hosted_invoice_url?: string | null
          stripe_invoice_id: string
          stripe_invoice_number?: string | null
          stripe_invoice_pdf?: string | null
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
          stripe_hosted_invoice_url?: string | null
          stripe_invoice_id?: string
          stripe_invoice_number?: string | null
          stripe_invoice_pdf?: string | null
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
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
          xendit_cycle_id: string | null
          xendit_subscription_id: string | null
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
          xendit_cycle_id?: string | null
          xendit_subscription_id?: string | null
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
          xendit_cycle_id?: string | null
          xendit_subscription_id?: string | null
        }
        Relationships: [
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
          stripe_charge_id: string | null
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
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
          stripe_charge_id?: string | null
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
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
          stripe_charge_id?: string | null
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          subscription_id?: string | null
        }
        Relationships: [
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
          id: string
          is_active: boolean | null
          max_branches: number | null
          max_customers: number | null
          max_staff_per_branch: number | null
          name: string
          price_annual: number
          price_monthly: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_name: string
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_branches?: number | null
          max_customers?: number | null
          max_staff_per_branch?: number | null
          name: string
          price_annual: number
          price_monthly: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_name?: string
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_branches?: number | null
          max_customers?: number | null
          max_staff_per_branch?: number | null
          name?: string
          price_annual?: number
          price_monthly?: number
          updated_at?: string | null
        }
        Relationships: []
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
            referencedRelation: "businesses"
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
          staff_id: string
          transaction_amount: number | null
        }
        Insert: {
          business_id: string
          customer_id: string
          id?: string
          points_awarded?: number
          scanned_at?: string | null
          staff_id: string
          transaction_amount?: number | null
        }
        Update: {
          business_id?: string
          customer_id?: string
          id?: string
          points_awarded?: number
          scanned_at?: string | null
          staff_id?: string
          transaction_amount?: number | null
        }
        Relationships: [
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
            referencedRelation: "businesses"
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
          plan_id: string | null
          status: string
          trial_ends_at: string | null
          updated_at: string | null
          xendit_customer_id: string | null
          xendit_subscription_id: string | null
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
          plan_id?: string | null
          status?: string
          trial_ends_at?: string | null
          updated_at?: string | null
          xendit_customer_id?: string | null
          xendit_subscription_id?: string | null
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
          plan_id?: string | null
          status?: string
          trial_ends_at?: string | null
          updated_at?: string | null
          xendit_customer_id?: string | null
          xendit_subscription_id?: string | null
        }
        Relationships: [
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
          type?: Database["public"]["Enums"]["transaction_type"]
        }
        Relationships: [
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
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_staff_invite: {
        Args: { p_token: string; p_user_id: string }
        Returns: Json
      }
      add_customer_points: {
        Args: { p_customer_id: string; p_points: number }
        Returns: undefined
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
      decrease_reward_stock: {
        Args: { p_reward_id: string }
        Returns: undefined
      }
      decrement_usage: {
        Args: { p_business_id: string; p_column: string }
        Returns: undefined
      }
      deduct_customer_points: {
        Args: { p_customer_id: string; p_points: number }
        Returns: undefined
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
      get_customer_tier: {
        Args: { p_lifetime_points: number }
        Returns: string
      }
      get_invite_with_business: { Args: { p_token: string }; Returns: Json }
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
      update_staff_last_login: {
        Args: { p_staff_id: string }
        Returns: undefined
      }
      update_usage_counts: {
        Args: { p_business_id: string }
        Returns: undefined
      }
    }
    Enums: {
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
