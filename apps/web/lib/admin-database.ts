// apps/web/lib/admin-database.ts
// Extended Database type that includes admin views and tables.
// The auto-generated Database type from `npm run db:types` doesn't include
// these because they are admin-only views/tables added via custom migrations.
//
// NOTE: Row types use Expand<> to convert interfaces into plain object types.
// Supabase's conditional types (using `infer`) can't resolve interfaces due to
// TypeScript's deferred evaluation, causing everything to resolve to `never`.

import type { Database } from '../../../packages/shared/types/database';
import type {
  AdminPlatformStats,
  AdminBusinessStats,
  AdminNote,
  AdminTag,
  AdminPlanChange,
  ManualInvoice,
  ManualInvoicePayment,
} from './admin';

type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;

export type AdminDatabase = {
  __InternalSupabase: Database['__InternalSupabase'];
  graphql_public: Database['graphql_public'];
  public: {
    Tables: Database['public']['Tables'] & {
      admin_platform_stats: {
        Row: Expand<AdminPlatformStats>;
        Insert: never;
        Update: never;
        Relationships: [];
      };
      admin_business_stats: {
        Row: Expand<AdminBusinessStats>;
        Insert: never;
        Update: never;
        Relationships: [];
      };
      admin_tags: {
        Row: Expand<AdminTag>;
        Insert: {
          id?: string;
          business_id: string;
          tag: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          tag?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      admin_notes: {
        Row: Expand<AdminNote>;
        Insert: {
          id?: string;
          business_id: string;
          author_email: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          author_email?: string;
          content?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      admin_plan_changes: {
        Row: Expand<AdminPlanChange>;
        Insert: {
          id?: string;
          business_id: string;
          changed_by_email: string;
          old_plan_id?: string | null;
          new_plan_id?: string | null;
          old_plan_name?: string | null;
          new_plan_name?: string | null;
          reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          changed_by_email?: string;
          old_plan_id?: string | null;
          new_plan_id?: string | null;
          old_plan_name?: string | null;
          new_plan_name?: string | null;
          reason?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      manual_invoices: {
        Row: Expand<ManualInvoice>;
        Insert: {
          id?: string;
          business_id: string;
          invoice_number: string;
          description?: string | null;
          amount_centavos: number;
          amount_paid_centavos?: number;
          currency?: string;
          status?: string;
          period_start?: string | null;
          period_end?: string | null;
          due_date?: string | null;
          created_by_email: string;
          notes?: string | null;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          invoice_number?: string;
          description?: string | null;
          amount_centavos?: number;
          amount_paid_centavos?: number;
          currency?: string;
          status?: string;
          period_start?: string | null;
          period_end?: string | null;
          due_date?: string | null;
          created_by_email?: string;
          notes?: string | null;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      manual_invoice_payments: {
        Row: Expand<ManualInvoicePayment>;
        Insert: {
          id?: string;
          invoice_id: string;
          amount_centavos: number;
          payment_method?: string | null;
          reference_number?: string | null;
          notes?: string | null;
          recorded_by_email: string;
          payment_date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          invoice_id?: string;
          amount_centavos?: number;
          payment_method?: string | null;
          reference_number?: string | null;
          notes?: string | null;
          recorded_by_email?: string;
          payment_date?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Database['public']['Views'];
    Functions: Database['public']['Functions'] & {
      get_business_activity_trend: {
        Args: { p_business_id: string; p_days?: number };
        Returns: {
          day: string;
          transactions: number;
          new_customers: number;
          points_earned: number;
        }[];
      };
    };
    Enums: Database['public']['Enums'];
    CompositeTypes: Database['public']['CompositeTypes'];
  };
};
