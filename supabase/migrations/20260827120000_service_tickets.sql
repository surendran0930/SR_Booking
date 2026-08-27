-- Service Tickets: front-counter intake for printers/devices dropped off
-- for service. Captures customer + device details, tracks status
-- (Received -> In Progress -> Ready -> Collected), and backs the
-- acknowledgment slip + printer sticker printouts.

create type public.service_ticket_status as enum ('RECEIVED', 'IN_PROGRESS', 'READY', 'COLLECTED');

create table public.service_tickets (
  id                   uuid primary key default gen_random_uuid(),
  ticket_seq           bigint generated always as identity,
  ticket_number        text generated always as ('SRT-' || lpad(ticket_seq::text, 5, '0')) stored,
  customer_id          uuid references public.customers (id) on delete set null,
  customer_name        text not null,
  phone_number         text not null,
  printer_brand        text not null,
  printer_model        text not null,
  serial_number        text,
  problem_description  text,
  status               public.service_ticket_status not null default 'RECEIVED',
  received_at          timestamptz not null default now(),
  ready_at             timestamptz,
  collected_at         timestamptz,
  notes                text,
  created_by           uuid references public.profiles (id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index service_tickets_status_idx on public.service_tickets (status);
create index service_tickets_customer_id_idx on public.service_tickets (customer_id);
create index service_tickets_phone_idx on public.service_tickets (phone_number);
create index service_tickets_received_at_idx on public.service_tickets (received_at);

create trigger set_updated_at before update on public.service_tickets
  for each row execute function public.set_updated_at();

-- Auto-stamp ready_at / collected_at the first time a ticket enters that
-- status, so the UI never has to remember to set them by hand.
create or replace function public.set_service_ticket_status_timestamps()
returns trigger language plpgsql as $$
begin
  if new.status = 'READY' and old.status is distinct from 'READY' and new.ready_at is null then
    new.ready_at = now();
  end if;
  if new.status = 'COLLECTED' and old.status is distinct from 'COLLECTED' and new.collected_at is null then
    new.collected_at = now();
  end if;
  return new;
end;
$$;

create trigger service_tickets_status_timestamps
  before update on public.service_tickets
  for each row execute function public.set_service_ticket_status_timestamps();

alter table public.service_tickets enable row level security;

-- Internal front-counter workflow — admin/staff only, not exposed to the customer portal.
create policy "service_tickets_admin_all" on public.service_tickets
  for all using (public.is_admin()) with check (public.is_admin());

alter publication supabase_realtime add table public.service_tickets;
