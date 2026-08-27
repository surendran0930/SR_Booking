# Migrating SR TECH SOLUTIONS from Prisma to Supabase

This replaces the local Postgres + Prisma + custom JWT auth stack with
Supabase (Postgres + Auth + Realtime), using `@supabase/supabase-js` for all
CRUD and Postgres Changes for live updates.

## 1. Create the Supabase project

1. Go to https://supabase.com/dashboard and sign in (or create an account).
2. **New project** → pick an organization, name it (e.g. `srtech-solutions`),
   set a strong database password (save it somewhere safe — you won't need
   it for the app, but you'll need it if you ever connect a raw Postgres
   client), pick the region closest to your users (e.g. Mumbai/Singapore),
   and create it. Provisioning takes a minute or two.
3. Once it's ready, go to **Project Settings → API**. You need three values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** (click "Reveal") → `SUPABASE_SERVICE_ROLE_KEY`

   Copy `.env.example` to `.env.local` and paste these three in. **Never**
   commit the service role key or expose it to the browser — it bypasses
   every RLS policy.

## 2. Run the schema migration

Open **SQL Editor** in the Supabase dashboard → **New query**, paste the
entire contents of `supabase/migrations/00000000000001_init.sql`, and run
it. This creates every table, the `profiles` ↔ `auth.users` bridge, RLS
policies, the `create_invoice()` RPC (atomic invoice-number allocation +
insert, replacing the old Prisma `$transaction`), and adds all business
tables to the `supabase_realtime` publication.

(Alternative, once you have the Supabase CLI: `npx supabase link --project-ref <ref>`
then `npx supabase db push`.)

Sanity check afterwards: **Database → Replication** should show `customers`,
`products`, `services`, `invoices`, `invoice_items`, `payments`, and
`business_settings` all toggled on under the `supabase_realtime`
publication.

## 3. Regenerate TypeScript types

`lib/supabase/database.types.ts` in this delivery is hand-written to match
the migration exactly, so the app will compile immediately — but once the
project exists, replace it with the real generated types:

```bash
npx supabase login
npx supabase gen types typescript --project-id <your-project-ref> > lib/supabase/database.types.ts
```

## 4. Install dependencies

The delivered `package.json` removes `prisma`, `@prisma/client`,
`@prisma/adapter-pg`, `pg`, `bcryptjs`, and `jose` (Supabase Auth replaces
password hashing and JWT handling) and adds `@supabase/supabase-js`,
`@supabase/ssr`, and `server-only`.

```bash
npm install
```

Then delete the now-unused Prisma artifacts:

```bash
rmdir /s /q prisma
rmdir /s /q lib\generated
del lib\db\prisma.ts
del lib\auth\password.ts
```

(`lib/db` will be empty after that — remove the folder too.)

## 5. Seed sample data

```bash
npm run db:seed
```

This wipes and reseeds business_settings/customers/products/services/
invoices, and creates two Supabase Auth users via the admin API:

| Role     | Email                       | Password       |
|----------|------------------------------|----------------|
| Admin    | `admin@srtechsolutions.com`  | `ChangeMe123!` |
| Customer | `abc@computers.com`          | `Customer123!` |

Change both before production.

## 6. What's already migrated in this delivery

- **Schema + RLS**: `supabase/migrations/00000000000001_init.sql` — full
  table set, `ADMIN`/`CUSTOMER` policies, realtime publication,
  `create_invoice()` and `customer_outstanding_totals()` RPCs.
- **Auth**: `server/actions/auth.ts` now uses `supabase.auth.signInWithPassword`
  (resolving phone-number logins to an email via the `email_for_identifier`
  RPC first, since Supabase Auth signs in by email). `lib/auth/session.ts`
  and `lib/auth/guards.ts` keep the exact same function signatures
  (`getSession`, `requireAdmin`, `requireCustomer`) so nothing that calls
  them needs to change.
- **Route protection**: `proxy.ts` refreshes the Supabase session and
  enforces the admin/customer boundary the same way the old JWT version did.
- **Server actions**: `customers.ts`, `products.ts`, `services.ts`,
  `settings.ts`, `invoices.ts` — full CRUD via `@supabase/supabase-js`.
  Creating a customer login now calls `supabase.auth.admin.createUser()`
  (service-role client) instead of hashing a password by hand.
- **Realtime**: `lib/realtime/use-realtime-table.ts` (a hook) and
  `components/shared/realtime-refresher.tsx` (a zero-UI client component you
  drop into a Server Component page) — wired into the admin dashboard, the
  admin customers list, the admin invoices list, and the customer dashboard
  as worked examples.
- **Seed data**: `supabase/seed.ts` replaces `prisma/seed.ts`.

## 7. What still needs the same treatment

These files still query `prisma` directly (or import Prisma-generated enum
types) and will fail to compile once `lib/db/prisma.ts` and
`lib/generated/prisma` are deleted. They follow the exact same pattern as
the four pages already converted — swap `prisma.x.findMany(...)` for
`supabase.from("x").select(...)`, camelCase columns become snake_case
(`grandTotal` → `grand_total`, `companyName` → `company_name`, etc.), and
drop in `<RealtimeRefresher table="..." />` if you want that page live:

**Pages:**
`app/admin/customers/[id]/page.tsx`, `app/admin/customers/new/page.tsx`,
`app/admin/invoices/[id]/page.tsx`, `app/admin/invoices/new/page.tsx`,
`app/admin/products/page.tsx`, `app/admin/products/[id]/page.tsx`,
`app/admin/products/new/page.tsx`, `app/admin/services/page.tsx`,
`app/admin/services/[id]/page.tsx`, `app/admin/services/new/page.tsx`,
`app/admin/settings/page.tsx`, `app/customer/invoices/page.tsx`,
`app/customer/invoices/[id]/page.tsx`, `app/customer/profile/page.tsx`.

**Components** (mostly just need the Prisma enum import swapped for
`@/lib/types`, plus field names updated to snake_case where they read
invoice/customer/product data passed down from a page):
`components/invoices/invoice-form.tsx`,
`components/invoices/invoice-document.tsx`,
`components/invoices/invoice-summary.tsx`,
`components/shared/payment-status-badge.tsx`.

Layouts (`app/layout.tsx`, `app/admin/layout.tsx`, `app/customer/layout.tsx`)
and `app/login/page.tsx` only call `requireAdmin()` / `requireSession()` /
`loginAction()`, whose signatures didn't change — they should need no edits.

I scoped this delivery to the foundational layer (schema, auth, RLS, all
server actions, the realtime hook) plus four fully worked page examples
covering every pattern you'll hit (aggregates, search + pagination, joined
data, RPC calls). Say the word and I'll continue converting the remaining
pages/components in the same style.

## 8. Design notes worth knowing

- **RLS is the real security boundary now.** Server actions still call
  `requireAdmin()`/`requireCustomer()` for a fast redirect, but the Supabase
  client authenticates as the logged-in user and Postgres enforces row
  access via the policies in the migration — even if a server action forgot
  a guard, the database itself would refuse the query.
- **Realtime refresh strategy**: pages call `router.refresh()` on any change
  rather than patching client state by hand, so pagination/search/filters/
  aggregates stay computed in one place (the server query). Fine for a
  single-shop tool; if a table gets very high-frequency writes later,
  that's the point to switch that one page to client-side cache patching.
- **`remember me`** on login no longer changes session length manually —
  Supabase Auth's own refresh-token lifetime governs how long a session
  survives. If you need a shorter "not remembered" session, that's a Supabase
  Auth project setting, not app code.
- **Optional later optimization**: `proxy.ts` currently does one extra
  `profiles` lookup per request to get the role. If that ever matters for
  latency, a Supabase Auth Hook can embed `role` as a custom JWT claim so
  `proxy.ts` reads it straight from the token instead.
