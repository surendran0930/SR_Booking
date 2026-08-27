-- SR TECH SOLUTIONS — Supabase schema (replaces Prisma/local Postgres)
-- Run this once in the Supabase SQL editor (or `supabase db push`) on a fresh project.

-- ============================================================================
-- EXTENSIONS
-- ============================================================================
create extension if not exists pgcrypto; -- gen_random_uuid()

-- ============================================================================
-- ENUM TYPES
-- ============================================================================
create type public.user_role as enum ('ADMIN', 'CUSTOMER');
create type public.customer_type as enum ('INDIVIDUAL', 'BUSINESS');
create type public.device_type as enum ('PRINTER', 'LAPTOP', 'COMPUTER', 'SCANNER');
create type public.invoice_type as enum ('SALES', 'SERVICE');
create type public.payment_status as enum ('PAID', 'PARTIAL', 'PENDING');
create type public.payment_method as enum ('CASH', 'UPI', 'BANK_TRANSFER', 'CARD', 'OTHER');
create type public.gst_mode as enum ('CGST_SGST', 'IGST', 'NONE');
create type public.invoice_item_type as enum ('PRODUCT', 'SERVICE');

-- ============================================================================
-- TABLES
-- ============================================================================

-- One row per business (Phase 1: single row, keep table for future multi-tenant)
create table public.business_settings (
  id                       uuid primary key default gen_random_uuid(),
  business_name            text not null default 'SR TECH SOLUTIONS',
  tagline                  text not null default 'All Types Printer Repair & Support',
  business_address         text,
  phone                    text,
  email                    text,
  gstin                    text,
  state                    text,
  pincode                  text,
  invoice_prefix           text not null default 'INV-',
  invoice_starting_number  integer not null default 1,
  next_invoice_number      integer not null default 1,
  logo_url                 text,
  terms_and_conditions     text,
  bank_details             text,
  upi_id                   text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create table public.customers (
  id                 uuid primary key default gen_random_uuid(),
  customer_type      public.customer_type not null default 'INDIVIDUAL',
  name               text not null,
  company_name       text,
  phone              text not null,
  alternative_phone  text,
  email              text,
  address            text,
  city               text,
  state              text,
  pincode            text,
  gstin              text,
  notes              text,
  device_type        public.device_type,
  device_model       text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index customers_name_idx on public.customers (name);
create index customers_phone_idx on public.customers (phone);
create index customers_email_idx on public.customers (email);
create index customers_gstin_idx on public.customers (gstin);

-- profiles: 1:1 with auth.users, carries app role + optional link to a customer record
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  name         text not null,
  email        text not null,
  phone        text,
  role         public.user_role not null default 'CUSTOMER',
  customer_id  uuid references public.customers (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create unique index profiles_customer_id_key on public.profiles (customer_id) where customer_id is not null;

create table public.products (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  sku            text unique,
  brand          text,
  category       text,
  description    text,
  selling_price  numeric(12, 2) not null,
  gst_percentage numeric(5, 2) not null default 18,
  unit           text not null default 'PCS',
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index products_name_idx on public.products (name);
create index products_brand_idx on public.products (brand);

create table public.services (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  service_code   text unique,
  description    text,
  service_charge numeric(12, 2) not null,
  gst_percentage numeric(5, 2) not null default 18,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index services_name_idx on public.services (name);

create table public.invoices (
  id                   uuid primary key default gen_random_uuid(),
  invoice_number       text not null unique,
  invoice_type         public.invoice_type not null,
  customer_id          uuid not null references public.customers (id),
  invoice_date         timestamptz not null default now(),
  due_date             timestamptz,
  gst_mode             public.gst_mode not null default 'CGST_SGST',
  subtotal             numeric(12, 2) not null,
  discount             numeric(12, 2) not null default 0,
  cgst                 numeric(12, 2) not null default 0,
  sgst                 numeric(12, 2) not null default 0,
  igst                 numeric(12, 2) not null default 0,
  gst_total            numeric(12, 2) not null default 0,
  grand_total          numeric(12, 2) not null,
  amount_paid          numeric(12, 2) not null default 0,
  balance_due          numeric(12, 2) not null default 0,
  payment_status       public.payment_status not null default 'PENDING',
  notes                text,
  printer_brand        text,
  printer_model        text,
  printer_serial       text,
  customer_complaint   text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index invoices_customer_id_idx on public.invoices (customer_id);
create index invoices_invoice_type_idx on public.invoices (invoice_type);
create index invoices_payment_status_idx on public.invoices (payment_status);
create index invoices_invoice_date_idx on public.invoices (invoice_date);

create table public.invoice_items (
  id             uuid primary key default gen_random_uuid(),
  invoice_id     uuid not null references public.invoices (id) on delete cascade,
  item_type      public.invoice_item_type not null,
  product_id     uuid references public.products (id) on delete set null,
  service_id     uuid references public.services (id) on delete set null,
  description    text not null,
  quantity       numeric(12, 3) not null,
  unit_price     numeric(12, 2) not null,
  gst_percentage numeric(5, 2) not null,
  gst_amount     numeric(12, 2) not null,
  total_amount   numeric(12, 2) not null,
  sort_order     integer not null default 0
);
create index invoice_items_invoice_id_idx on public.invoice_items (invoice_id);

create table public.payments (
  id               uuid primary key default gen_random_uuid(),
  invoice_id       uuid not null references public.invoices (id) on delete cascade,
  amount           numeric(12, 2) not null,
  payment_method   public.payment_method not null default 'CASH',
  payment_date     timestamptz not null default now(),
  reference_number text,
  notes            text,
  created_at       timestamptz not null default now()
);
create index payments_invoice_id_idx on public.payments (invoice_id);

insert into public.business_settings (business_name) values ('SR TECH SOLUTIONS');

-- ============================================================================
-- updated_at triggers
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.business_settings for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.customers for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.products for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.services for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.invoices for each row execute function public.set_updated_at();

-- ============================================================================
-- auth.users -> public.profiles bridge
-- Admin creates users via supabase.auth.admin.createUser({ user_metadata: { role, name, customer_id } })
-- ============================================================================
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, phone, role, customer_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', new.email),
    new.email,
    new.raw_user_meta_data ->> 'phone',
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'CUSTOMER'),
    nullif(new.raw_user_meta_data ->> 'customer_id', '')::uuid
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ============================================================================
-- Role helper functions (SECURITY DEFINER so RLS policies can call them
-- without recursively hitting profiles' own RLS)
-- ============================================================================
create or replace function public.current_role()
returns public.user_role
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.current_customer_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select customer_id from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.current_role() = 'ADMIN';
$$;

-- ============================================================================
-- RLS
-- ============================================================================
alter table public.business_settings enable row level security;
alter table public.customers enable row level security;
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.services enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.payments enable row level security;

-- profiles: everyone can read their own; admins can read/manage all
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());
create policy "profiles_admin_all" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- business_settings: any authenticated user can read (needed for invoice PDF branding), only admin writes
create policy "settings_select_authenticated" on public.business_settings
  for select using (auth.role() = 'authenticated');
create policy "settings_admin_write" on public.business_settings
  for insert with check (public.is_admin());
create policy "settings_admin_update" on public.business_settings
  for update using (public.is_admin());

-- customers: admin full access; a customer can read only their own linked record
create policy "customers_admin_all" on public.customers
  for all using (public.is_admin()) with check (public.is_admin());
create policy "customers_select_own" on public.customers
  for select using (id = public.current_customer_id());

-- products / services: readable by any authenticated user (needed to render invoices/items),
-- writes restricted to admin
create policy "products_select_authenticated" on public.products
  for select using (auth.role() = 'authenticated');
create policy "products_admin_write" on public.products
  for insert with check (public.is_admin());
create policy "products_admin_update" on public.products
  for update using (public.is_admin());
create policy "products_admin_delete" on public.products
  for delete using (public.is_admin());

create policy "services_select_authenticated" on public.services
  for select using (auth.role() = 'authenticated');
create policy "services_admin_write" on public.services
  for insert with check (public.is_admin());
create policy "services_admin_update" on public.services
  for update using (public.is_admin());
create policy "services_admin_delete" on public.services
  for delete using (public.is_admin());

-- invoices: admin full access; customer can read only their own invoices
create policy "invoices_admin_all" on public.invoices
  for all using (public.is_admin()) with check (public.is_admin());
create policy "invoices_select_own" on public.invoices
  for select using (customer_id = public.current_customer_id());

-- invoice_items: follow parent invoice access
create policy "invoice_items_admin_all" on public.invoice_items
  for all using (public.is_admin()) with check (public.is_admin());
create policy "invoice_items_select_own" on public.invoice_items
  for select using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_items.invoice_id
        and i.customer_id = public.current_customer_id()
    )
  );

-- payments: follow parent invoice access
create policy "payments_admin_all" on public.payments
  for all using (public.is_admin()) with check (public.is_admin());
create policy "payments_select_own" on public.payments
  for select using (
    exists (
      select 1 from public.invoices i
      where i.id = payments.invoice_id
        and i.customer_id = public.current_customer_id()
    )
  );

-- ============================================================================
-- Realtime: publish change events for every business table
-- ============================================================================
alter publication supabase_realtime add table public.customers;
alter publication supabase_realtime add table public.products;
alter publication supabase_realtime add table public.services;
alter publication supabase_realtime add table public.invoices;
alter publication supabase_realtime add table public.invoice_items;
alter publication supabase_realtime add table public.payments;
alter publication supabase_realtime add table public.business_settings;

-- ============================================================================
-- Atomic invoice creation RPC
-- Replaces the Prisma $transaction in server/actions/invoices.ts.
-- Locks business_settings to allocate a gap-free invoice number, inserts the
-- invoice + items (+ optional first payment) in one statement-level unit.
-- Totals are computed in the app (decimal.js) and passed in — this function
-- just persists them atomically and hands back the invoice number.
-- ============================================================================
create or replace function public.create_invoice(payload jsonb)
returns public.invoices
language plpgsql
security definer
set search_path = public
as $$
declare
  v_settings   record;
  v_invoice_no text;
  v_invoice    public.invoices;
  v_item       jsonb;
  v_paid       numeric(12, 2);
begin
  if not public.is_admin() then
    raise exception 'Only admins can create invoices';
  end if;

  select * into v_settings from public.business_settings limit 1 for update;
  if not found then
    raise exception 'Business settings not configured';
  end if;

  v_invoice_no := v_settings.invoice_prefix || lpad(v_settings.next_invoice_number::text, 4, '0');

  update public.business_settings
    set next_invoice_number = next_invoice_number + 1
    where id = v_settings.id;

  insert into public.invoices (
    invoice_number, invoice_type, customer_id, invoice_date, due_date, gst_mode,
    subtotal, discount, cgst, sgst, igst, gst_total, grand_total,
    amount_paid, balance_due, payment_status, notes,
    printer_brand, printer_model, printer_serial, customer_complaint
  ) values (
    v_invoice_no,
    (payload ->> 'invoiceType')::public.invoice_type,
    (payload ->> 'customerId')::uuid,
    coalesce((payload ->> 'invoiceDate')::timestamptz, now()),
    nullif(payload ->> 'dueDate', '')::timestamptz,
    (payload ->> 'gstMode')::public.gst_mode,
    (payload ->> 'subtotal')::numeric,
    (payload ->> 'discount')::numeric,
    (payload ->> 'cgst')::numeric,
    (payload ->> 'sgst')::numeric,
    (payload ->> 'igst')::numeric,
    (payload ->> 'gstTotal')::numeric,
    (payload ->> 'grandTotal')::numeric,
    (payload ->> 'amountPaid')::numeric,
    (payload ->> 'balanceDue')::numeric,
    (payload ->> 'paymentStatus')::public.payment_status,
    nullif(payload ->> 'notes', ''),
    nullif(payload ->> 'printerBrand', ''),
    nullif(payload ->> 'printerModel', ''),
    nullif(payload ->> 'printerSerial', ''),
    nullif(payload ->> 'customerComplaint', '')
  )
  returning * into v_invoice;

  for v_item in select * from jsonb_array_elements(payload -> 'items')
  loop
    insert into public.invoice_items (
      invoice_id, item_type, product_id, service_id, description,
      quantity, unit_price, gst_percentage, gst_amount, total_amount, sort_order
    ) values (
      v_invoice.id,
      (v_item ->> 'itemType')::public.invoice_item_type,
      nullif(v_item ->> 'productId', '')::uuid,
      nullif(v_item ->> 'serviceId', '')::uuid,
      v_item ->> 'description',
      (v_item ->> 'quantity')::numeric,
      (v_item ->> 'unitPrice')::numeric,
      (v_item ->> 'gstPercentage')::numeric,
      (v_item ->> 'gstAmount')::numeric,
      (v_item ->> 'totalAmount')::numeric,
      (v_item ->> 'sortOrder')::int
    );
  end loop;

  v_paid := (payload ->> 'amountPaid')::numeric;
  if v_paid > 0 then
    insert into public.payments (invoice_id, amount, payment_method, payment_date)
    values (
      v_invoice.id,
      v_paid,
      coalesce((payload ->> 'paymentMethod')::public.payment_method, 'CASH'),
      coalesce((payload ->> 'invoiceDate')::timestamptz, now())
    );
  end if;

  return v_invoice;
end;
$$;

-- Login by email OR phone: the login form accepts either, but Supabase Auth
-- only signs in by email. This resolves a phone number to its account email
-- so the client can call signInWithPassword(). Deliberately returns null
-- (never an error) for unknown identifiers so it can't be used to enumerate
-- accounts any more than the login form's generic error message already does.
create or replace function public.email_for_identifier(identifier text)
returns text
language sql
security definer
stable
set search_path = public
as $$
  select email from public.profiles
  where lower(email) = lower(identifier) or phone = identifier
  limit 1;
$$;
revoke all on function public.email_for_identifier(text) from public;
grant execute on function public.email_for_identifier(text) to anon, authenticated;

-- Outstanding-balance-per-customer helper (replaces prisma.invoice.groupBy)
create or replace function public.customer_outstanding_totals(customer_ids uuid[])
returns table (customer_id uuid, total_balance_due numeric)
language sql
stable
security definer
set search_path = public
as $$
  select i.customer_id, coalesce(sum(i.balance_due), 0) as total_balance_due
  from public.invoices i
  where i.customer_id = any(customer_ids)
  group by i.customer_id;
$$;
