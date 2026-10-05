-- Step 2 of 2 for the Merchants feature. Run 20260827130000_merchant_role.sql
-- FIRST and let it finish, then run this one.
--
-- Lets a friend/partner run their own book of clients inside the same
-- SR TECH SOLUTIONS app, under their own login, without seeing (or being
-- seen by) each other. You (ADMIN) still see and manage everything, exactly
-- like before. A MERCHANT only sees the customers, service tickets,
-- invoices, and product/service catalog rows they themselves own —
-- enforced by row-level security, not by the app code.
--
-- Business settings (name, logo, GST, invoice numbering) stay shared and
-- admin-only, as requested — this is one business with separate staff
-- logins, not separate businesses.

-- ============================================================================
-- Ownership column — who this row belongs to. NULL = belongs to management
-- (the original admin), not any specific merchant. Defaults to whoever is
-- logged in when the row is created, so both admin-created and
-- merchant-created rows are stamped automatically with no app code change
-- needed. Existing rows (inserted before this migration) get NULL, which
-- keeps them visible only to admins — exactly as they are today.
-- ============================================================================
alter table public.customers       add column merchant_id uuid references public.profiles (id) on delete set null default auth.uid();
alter table public.products        add column merchant_id uuid references public.profiles (id) on delete set null default auth.uid();
alter table public.services        add column merchant_id uuid references public.profiles (id) on delete set null default auth.uid();
alter table public.invoices        add column merchant_id uuid references public.profiles (id) on delete set null default auth.uid();
alter table public.service_tickets add column merchant_id uuid references public.profiles (id) on delete set null default auth.uid();

create index customers_merchant_id_idx       on public.customers (merchant_id);
create index products_merchant_id_idx        on public.products (merchant_id);
create index services_merchant_id_idx        on public.services (merchant_id);
create index invoices_merchant_id_idx        on public.invoices (merchant_id);
create index service_tickets_merchant_id_idx on public.service_tickets (merchant_id);

-- ============================================================================
-- Role helper
-- ============================================================================
create or replace function public.is_merchant()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.current_role() = 'MERCHANT';
$$;

-- ============================================================================
-- RLS: merchant-scoped policies (admin_all policies from the init migration
-- are untouched — admins keep full access to everything).
-- ============================================================================
create policy "customers_merchant_own" on public.customers
  for all using (public.is_merchant() and merchant_id = auth.uid())
  with check (public.is_merchant() and merchant_id = auth.uid());

create policy "invoices_merchant_own" on public.invoices
  for all using (public.is_merchant() and merchant_id = auth.uid())
  with check (public.is_merchant() and merchant_id = auth.uid());

create policy "invoice_items_merchant_own" on public.invoice_items
  for all using (
    public.is_merchant() and exists (
      select 1 from public.invoices i
      where i.id = invoice_items.invoice_id and i.merchant_id = auth.uid()
    )
  )
  with check (
    public.is_merchant() and exists (
      select 1 from public.invoices i
      where i.id = invoice_items.invoice_id and i.merchant_id = auth.uid()
    )
  );

create policy "payments_merchant_own" on public.payments
  for all using (
    public.is_merchant() and exists (
      select 1 from public.invoices i
      where i.id = payments.invoice_id and i.merchant_id = auth.uid()
    )
  )
  with check (
    public.is_merchant() and exists (
      select 1 from public.invoices i
      where i.id = payments.invoice_id and i.merchant_id = auth.uid()
    )
  );

create policy "service_tickets_merchant_own" on public.service_tickets
  for all using (public.is_merchant() and merchant_id = auth.uid())
  with check (public.is_merchant() and merchant_id = auth.uid());

-- products / services previously allowed ANY authenticated user (including
-- customers and, now, other merchants) to read the whole catalog — that's
-- how the invoice-creation form looks products/services up. That's too wide
-- now that catalogs are meant to be separate per merchant, so it's replaced
-- with: admins read everything, merchants read/write only their own rows.
-- (Customers never needed direct catalog access — invoice line items store
-- their own snapshotted description/price, not a live reference.)
drop policy if exists "products_select_authenticated" on public.products;
create policy "products_admin_select" on public.products
  for select using (public.is_admin());
create policy "products_merchant_own" on public.products
  for all using (public.is_merchant() and merchant_id = auth.uid())
  with check (public.is_merchant() and merchant_id = auth.uid());

drop policy if exists "services_select_authenticated" on public.services;
create policy "services_admin_select" on public.services
  for select using (public.is_admin());
create policy "services_merchant_own" on public.services
  for all using (public.is_merchant() and merchant_id = auth.uid())
  with check (public.is_merchant() and merchant_id = auth.uid());

-- So the new Merchants admin page can live-update (RealtimeRefresher
-- pattern used throughout the app); RLS still applies to realtime, so a
-- merchant would only ever receive events for their own profile row.
alter publication supabase_realtime add table public.profiles;

-- ============================================================================
-- create_invoice() previously hard-blocked anyone who wasn't ADMIN. Same
-- function body as the init migration, just widening that one check to
-- ADMIN or MERCHANT. The invoice row's merchant_id isn't set explicitly
-- here — it's omitted from the INSERT's column list, so the column's
-- `default auth.uid()` fills it in automatically with whoever is calling.
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
  if not (public.is_admin() or public.is_merchant()) then
    raise exception 'Only admins or merchants can create invoices';
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
