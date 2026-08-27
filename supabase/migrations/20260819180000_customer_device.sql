-- Add device type + model to customers (printer / laptop / computer / scanner)

do $$ begin
  create type public.device_type as enum ('PRINTER', 'LAPTOP', 'COMPUTER', 'SCANNER');
exception
  when duplicate_object then null;
end $$;

alter table public.customers
  add column if not exists device_type public.device_type,
  add column if not exists device_model text;
