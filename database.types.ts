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
          metadata: Json;
          name: string;
          owner: string;
          public: boolean;
        };
        Insert: {
          created_at?: string;
          id: string;
          metadata: Json;
          name: string;
          owner: string;
          public?: boolean;
        };
        Update: {
          created_at?: string;
          id?: string;
          metadata?: Json;
          name?: string;
          owner?: string;
          public?: boolean;
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
      stars: {
        Row: {
          dataset_id: string;
          user_id: string;
        };
        Insert: {
          dataset_id: string;
          user_id: string;
        };
        Update: {
          dataset_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "stars_dataset_id_fkey";
            columns: ["dataset_id"];
            referencedRelation: "datasets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stars_user_id_fkey";
            columns: ["user_id"];
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
