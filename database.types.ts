export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      datasets: {
        Row: {
          created_at: string;
          id: string;
          name: string | null;
          owner: string | null;
          public: boolean | null;
        };
        Insert: {
          created_at?: string;
          id: string;
          name?: string | null;
          owner?: string | null;
          public?: boolean | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string | null;
          owner?: string | null;
          public?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: "datasets_owner_fkey";
            columns: ["owner"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      users: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          name: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          id?: string;
          name: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
