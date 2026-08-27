// Hand-written Supabase Database type. Once your project exists, regenerate the
// real thing with:
//   npx supabase gen types typescript --project-id <your-project-ref> > lib/supabase/database.types.ts
// This hand-written version keeps the app compiling until you do that.
//
// NOTE 1: each table's Row is a standalone named type (not looked up via
// Database["public"]["Tables"][...]["Row"]) to avoid self-referencing the
// Database type from inside its own definition.
//
// NOTE 2 (the actual fix for the `never` build errors): every table entry
// MUST include a `Relationships: []` field. @supabase/supabase-js's
// SupabaseClient<Database, SchemaName> computes its internal `Schema` type
// parameter as `Database["public"] extends GenericSchema ? Database["public"] : never`
// — and GenericSchema requires every table to have `Row`, `Insert`, `Update`,
// AND `Relationships: GenericRelationship[]`. Without `Relationships`, the
// whole schema fails that check and `Schema` silently becomes `never`, which
// makes every `.insert()`/`.update()` call's expected argument type `never`
// too — exactly the "Argument of type '{...}' is not assignable to parameter
// of type 'never'" errors `next build`'s full type-check reports (this
// doesn't show up under `next dev`, which skips the full check). We don't
// track real foreign-key relationship metadata here, so every table just
// gets an empty `Relationships: []` — that's enough to satisfy the type.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type ProfileRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "ADMIN" | "CUSTOMER";
  customer_id: string | null;
  created_at: string;
  updated_at: string;
};

type CustomerRow = {
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

type ProductRow = {
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

type ServiceRow = {
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

type InvoiceRow = {
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

type InvoiceItemRow = {
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

type PaymentRow = {
  id: string;
  invoice_id: string;
  amount: number;
  payment_method: "CASH" | "UPI" | "BANK_TRANSFER" | "CARD" | "OTHER";
  payment_date: string;
  reference_number: string | null;
  notes: string | null;
  created_at: string;
};

type BusinessSettingsRow = {
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

type ServiceTicketRow = {
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

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow> & {
          id: string;
          name: string;
          email: string;
        };
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      customers: {
        Row: CustomerRow;
        Insert: Partial<CustomerRow> & {
          name: string;
          phone: string;
        };
        Update: Partial<CustomerRow>;
        Relationships: [];
      };
      products: {
        Row: ProductRow;
        Insert: Partial<ProductRow> & {
          name: string;
          selling_price: number;
        };
        Update: Partial<ProductRow>;
        Relationships: [];
      };
      services: {
        Row: ServiceRow;
        Insert: Partial<ServiceRow> & {
          name: string;
          service_charge: number;
        };
        Update: Partial<ServiceRow>;
        Relationships: [];
      };
      invoices: {
        Row: InvoiceRow;
        Insert: Partial<InvoiceRow>;
        Update: Partial<InvoiceRow>;
        Relationships: [];
      };
      invoice_items: {
        Row: InvoiceItemRow;
        Insert: Partial<InvoiceItemRow>;
        Update: Partial<InvoiceItemRow>;
        Relationships: [];
      };
      payments: {
        Row: PaymentRow;
        Insert: Partial<PaymentRow>;
        Update: Partial<PaymentRow>;
        Relationships: [];
      };
      business_settings: {
        Row: BusinessSettingsRow;
        Insert: Partial<BusinessSettingsRow>;
        Update: Partial<BusinessSettingsRow>;
        Relationships: [];
      };
      service_tickets: {
        Row: ServiceTicketRow;
        Insert: Partial<ServiceTicketRow> & {
          customer_name: string;
          phone_number: string;
          printer_brand: string;
          printer_model: string;
        };
        Update: Partial<ServiceTicketRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_invoice: {
        Args: { payload: Json };
        Returns: InvoiceRow;
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
