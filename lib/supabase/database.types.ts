// Hand-written Supabase Database type. Once your project exists, regenerate the
// real thing with:
//   npx supabase gen types typescript --project-id <your-project-ref> > lib/supabase/database.types.ts
// This hand-written version keeps the app compiling until you do that.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          role: "ADMIN" | "CUSTOMER";
          customer_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          id: string;
          name: string;
          email: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
      customers: {
        Row: {
          id: string;
          customer_type: "INDIVIDUAL" | "BUSINESS";
          name: string;
          company_name: string | null;
          phone: string;
          alternative_phone: string | null;
          email: string | null;
          address: string | null;
          city: string | null;
          state: string | null;
          pincode: string | null;
          gstin: string | null;
          notes: string | null;
          device_type: "PRINTER" | "LAPTOP" | "COMPUTER" | "SCANNER" | null;
          device_model: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["customers"]["Row"]> & {
          name: string;
          phone: string;
        };
        Update: Partial<Database["public"]["Tables"]["customers"]["Row"]>;
      };
      products: {
        Row: {
          id: string;
          name: string;
          sku: string | null;
          brand: string | null;
          category: string | null;
          description: string | null;
          selling_price: number;
          gst_percentage: number;
          unit: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["products"]["Row"]> & {
          name: string;
          selling_price: number;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Row"]>;
      };
      services: {
        Row: {
          id: string;
          name: string;
          service_code: string | null;
          description: string | null;
          service_charge: number;
          gst_percentage: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["services"]["Row"]> & {
          name: string;
          service_charge: number;
        };
        Update: Partial<Database["public"]["Tables"]["services"]["Row"]>;
      };
      invoices: {
        Row: {
          id: string;
          invoice_number: string;
          invoice_type: "SALES" | "SERVICE";
          customer_id: string;
          invoice_date: string;
          due_date: string | null;
          gst_mode: "CGST_SGST" | "IGST" | "NONE";
          subtotal: number;
          discount: number;
          cgst: number;
          sgst: number;
          igst: number;
          gst_total: number;
          grand_total: number;
          amount_paid: number;
          balance_due: number;
          payment_status: "PAID" | "PARTIAL" | "PENDING";
          notes: string | null;
          printer_brand: string | null;
          printer_model: string | null;
          printer_serial: string | null;
          customer_complaint: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["invoices"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["invoices"]["Row"]>;
      };
      invoice_items: {
        Row: {
          id: string;
          invoice_id: string;
          item_type: "PRODUCT" | "SERVICE";
          product_id: string | null;
          service_id: string | null;
          description: string;
          quantity: number;
          unit_price: number;
          gst_percentage: number;
          gst_amount: number;
          total_amount: number;
          sort_order: number;
        };
        Insert: Partial<Database["public"]["Tables"]["invoice_items"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["invoice_items"]["Row"]>;
      };
      payments: {
        Row: {
          id: string;
          invoice_id: string;
          amount: number;
          payment_method: "CASH" | "UPI" | "BANK_TRANSFER" | "CARD" | "OTHER";
          payment_date: string;
          reference_number: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["payments"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["payments"]["Row"]>;
      };
      business_settings: {
        Row: {
          id: string;
          business_name: string;
          tagline: string;
          business_address: string | null;
          phone: string | null;
          email: string | null;
          gstin: string | null;
          state: string | null;
          pincode: string | null;
          invoice_prefix: string;
          invoice_starting_number: number;
          next_invoice_number: number;
          logo_url: string | null;
          terms_and_conditions: string | null;
          bank_details: string | null;
          upi_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["business_settings"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["business_settings"]["Row"]>;
      };
      service_tickets: {
        Row: {
          id: string;
          ticket_seq: number;
          ticket_number: string;
          customer_id: string | null;
          customer_name: string;
          phone_number: string;
          printer_brand: string;
          printer_model: string;
          serial_number: string | null;
          problem_description: string | null;
          status: "RECEIVED" | "IN_PROGRESS" | "READY" | "COLLECTED";
          received_at: string;
          ready_at: string | null;
          collected_at: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["service_tickets"]["Row"]> & {
          customer_name: string;
          phone_number: string;
          printer_brand: string;
          printer_model: string;
        };
        Update: Partial<Database["public"]["Tables"]["service_tickets"]["Row"]>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_invoice: {
        Args: { payload: Json };
        Returns: Database["public"]["Tables"]["invoices"]["Row"];
      };
      customer_outstanding_totals: {
        Args: { customer_ids: string[] };
        Returns: { customer_id: string; total_balance_due: number }[];
      };
      current_role: { Args: Record<string, never>; Returns: "ADMIN" | "CUSTOMER" };
      is_admin: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: {
      user_role: "ADMIN" | "CUSTOMER";
      customer_type: "INDIVIDUAL" | "BUSINESS";
      device_type: "PRINTER" | "LAPTOP" | "COMPUTER" | "SCANNER";
      invoice_type: "SALES" | "SERVICE";
      payment_status: "PAID" | "PARTIAL" | "PENDING";
      payment_method: "CASH" | "UPI" | "BANK_TRANSFER" | "CARD" | "OTHER";
      gst_mode: "CGST_SGST" | "IGST" | "NONE";
      invoice_item_type: "PRODUCT" | "SERVICE";
      service_ticket_status: "RECEIVED" | "IN_PROGRESS" | "READY" | "COLLECTED";
    };
  };
};
