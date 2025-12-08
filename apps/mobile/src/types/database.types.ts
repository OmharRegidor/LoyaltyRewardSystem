// src/types/database.types.ts

export interface Database {
  public: {
    Tables: {
      customers: {
        Row: {
          id: string;
          user_id: string;
          phone: string | null;
          total_points: number | null;
          qr_code_url: string | null;
          last_visit: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          phone: string | null;
          total_points?: number | null;
          qr_code_url?: string | null;
          last_visit?: string | null;
          created_at?: string | null;
        };
        Update: {
          phone?: string | null;
          total_points?: number | null;
          qr_code_url?: string | null;
          last_visit?: string | null;
        };
      };
    };
  };
}

export type Customer = Database['public']['Tables']['customers']['Row'];
export type CustomerInsert =
  Database['public']['Tables']['customers']['Insert'];
