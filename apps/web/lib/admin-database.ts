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
