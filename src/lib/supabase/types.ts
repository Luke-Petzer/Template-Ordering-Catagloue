// Auto-generated type definitions mirroring supabase/init.sql.
// Replace this file by running: npx supabase gen types typescript --linked > src/lib/supabase/types.ts

export type AppRole = "admin" | "buyer_default" | "buyer_30_day";
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "fulfilled"
  | "cancelled";
export type PaymentMethod = "eft" | "30_day_account";

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
      profiles: {
        Row: {
          id: string;
          auth_user_id: string | null;
          account_number: string | null;
          role: AppRole;
          business_name: string;
          contact_name: string;
          email: string | null;
          phone: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id?: string | null;
          account_number?: string | null;
          role?: AppRole;
          business_name: string;
          contact_name: string;
          email?: string | null;
          phone?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          auth_user_id?: string | null;
          account_number?: string | null;
          role?: AppRole;
          business_name?: string;
          contact_name?: string;
          email?: string | null;
          phone?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          sku: string;
          name: string;
          description: string | null;
          price: number;
          image_url: string | null;
          details: string | null;
          category: string | null;
          variants: Json;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sku: string;
          name: string;
          description?: string | null;
          price: number;
          image_url?: string | null;
          details?: string | null;
          category?: string | null;
          variants?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sku?: string;
          name?: string;
          description?: string | null;
          price?: number;
          image_url?: string | null;
          details?: string | null;
          category?: string | null;
          variants?: Json;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          profile_id: string;
          status: OrderStatus;
          payment_method: PaymentMethod;
          total_amount: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          status?: OrderStatus;
          payment_method: PaymentMethod;
          total_amount: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          status?: OrderStatus;
          payment_method?: PaymentMethod;
          total_amount?: number;
          notes?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          sku: string;
          product_name: string;
          unit_price: number;
          quantity: number;
          line_total: number;
          variant_info: Json | null;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          sku: string;
          product_name: string;
          unit_price: number;
          quantity: number;
          line_total: number;
          variant_info?: Json | null;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string | null;
          sku?: string;
          product_name?: string;
          unit_price?: number;
          quantity?: number;
          line_total?: number;
          variant_info?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_app_role: {
        Args: Record<string, never>;
        Returns: AppRole | null;
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: {
      app_role: AppRole;
      order_status: OrderStatus;
      payment_method: PaymentMethod;
    };
  };
}
