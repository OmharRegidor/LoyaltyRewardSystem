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
      availability: {
        Row: {
          branch_id: string | null
          business_id: string
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_available: boolean
          staff_id: string | null
          start_time: string
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          business_id: string
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_available?: boolean
          staff_id?: string | null
          start_time: string
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          business_id?: string
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_available?: boolean
          staff_id?: string | null
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "admin_business_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_addon_options: {
        Row: {
          addon_id: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          price_centavos: number
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          addon_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          price_centavos?: number
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          addon_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          price_centavos?: number
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_addon_options_addon_id_fkey"
            columns: ["addon_id"]
            isOneToOne: false
            referencedRelation: "booking_addons"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_addon_selections: {
        Row: {
          addon_id: string
          booking_id: string
          created_at: string | null
          id: string
          quantity: number | null
          unit_price_centavos: number
        }
        Insert: {
          addon_id: string
          booking_id: string
          created_at?: string | null
          id?: string
          quantity?: number | null
          unit_price_centavos: number
        }
        Update: {
          addon_id?: string
          booking_id?: string
          created_at?: string | null
          id?: string
          quantity?: number | null
          unit_price_centavos?: number
        }
        Relationships: [
          {
            foreignKeyName: "booking_addon_selections_addon_id_fkey"
            columns: ["addon_id"]
            isOneToOne: false
            referencedRelation: "booking_addons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_addon_selections_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_addons: {
        Row: {
          business_id: string
          category: string | null
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          name: string
          price_centavos: number
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          business_id: string
          category?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          price_centavos: number
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          category?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          price_centavos?: number
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_addons_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "admin_business_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_addons_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          addons_json: Json | null
          addons_total_centavos: number | null
          booking_date: string
          branch_id: string | null
          business_id: string
          cancellation_reason: string | null
          cancelled_at: string | null
          confirmation_code: string | null
          created_at: string
          customer_email: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          end_date: string | null
          end_time: string
          guests_adults: number | null
          guests_children: number | null
          id: string
          nights: number | null
          notes: string | null
          party_size: number | null
          service_id: string
          special_requests: string | null
          staff_id: string | null
          start_time: string
          status: Database["public"]["Enums"]["booking_status"]
          subtotal_centavos: number | null
          total_price_centavos: number | null
          updated_at: string
          variant_id: string | null
        }
        Insert: {
          addons_json?: Json | null
          addons_total_centavos?: number | null
          booking_date: string
          branch_id?: string | null
          business_id: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          confirmation_code?: string | null
          created_at?: string
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          end_date?: string | null
          end_time: string
          guests_adults?: number | null
          guests_children?: number | null
          id?: string
          nights?: number | null
          notes?: string | null
          party_size?: number | null
          service_id: string
          special_requests?: string | null
          staff_id?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["booking_status"]
          subtotal_centavos?: number | null
          total_price_centavos?: number | null
          updated_at?: string
          variant_id?: string | null
        }
        Update: {
          addons_json?: Json | null
          addons_total_centavos?: number | null
          booking_date?: string
          branch_id?: string | null
          business_id?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          confirmation_code?: string | null
          created_at?: string
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          end_date?: string | null
          end_time?: string
          guests_adults?: number | null
          guests_children?: number | null
          id?: string
          nights?: number | null
          notes?: string | null
          party_size?: number | null
          service_id?: string
          special_requests?: string | null
          staff_id?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["booking_status"]
          subtotal_centavos?: number | null
          total_price_centavos?: number | null
          updated_at?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "admin_business_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "service_price_variants"
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
          created_at: string | null
          description: string | null
          id: string
          is_free_forever: boolean
          join_code: string | null
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
          slug: string
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
          join_code?: string | null
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
          slug: string
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
          join_code?: string | null
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
          slug?: string
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
          is_verified: boolean
          last_visit: string | null
          lifetime_points: number | null
          phone: string | null
          qr_code_url: string | null
          tier: string | null
          total_points: number | null
          user_id: string | null
          verification_method: string | null
          verified_at: string | null
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
          is_verified?: boolean
          last_visit?: string | null
          lifetime_points?: number | null
          phone?: string | null
          qr_code_url?: string | null
          tier?: string | null
          total_points?: number | null
          user_id?: string | null
          verification_method?: string | null
          verified_at?: string | null
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
          is_verified?: boolean
          last_visit?: string | null
          lifetime_points?: number | null
          phone?: string | null
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
          has_booking: boolean
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
          has_booking?: boolean
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
          has_booking?: boolean
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
            referencedRelation: "sales"
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
      service_addons: {
        Row: {
          business_id: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          price_centavos: number
          price_type: string | null
          service_id: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          price_centavos?: number
          price_type?: string | null
          service_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          price_centavos?: number
          price_type?: string | null
          service_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_addons_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "admin_business_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_addons_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_addons_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_price_variants: {
        Row: {
          capacity: number | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          price_centavos: number
          service_id: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          capacity?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          price_centavos?: number
          service_id: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          capacity?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          price_centavos?: number
          service_id?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_price_variants_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_questions: {
        Row: {
          created_at: string | null
          id: string
          is_required: boolean | null
          options: Json | null
          question: string
          question_type: string
          service_id: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_required?: boolean | null
          options?: Json | null
          question: string
          question_type?: string
          service_id: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_required?: boolean | null
          options?: Json | null
          question?: string
          question_type?: string
          service_id?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_questions_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
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
          module_booking_override: boolean | null
          module_pos_override: boolean | null
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
          module_booking_override?: boolean | null
          module_pos_override?: boolean | null
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
          module_booking_override?: boolean | null
          module_pos_override?: boolean | null
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
      cleanup_expired_verification_codes: { Args: never; Returns: number }
      complete_redemption: {
        Args: { p_completed_by: string; p_redemption_id: string }
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
      get_business_activity_trend: {
        Args: { p_business_id: string; p_days?: number }
        Returns: {
          day: string
          new_customers: number
          points_earned: number
          transactions: number
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
          card_token: string
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
      redeem_reward: {
        Args: { p_customer_id: string; p_reward_id: string }
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
      booking_status:
        | "pending"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "no_show"
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
      booking_status: [
        "pending",
        "confirmed",
        "completed",
        "cancelled",
        "no_show",
      ],
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
