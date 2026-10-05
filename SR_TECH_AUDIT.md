# SR TECH SOLUTIONS — Full Project Audit & CRM Upgrade Plan

**Project audited:** `SR_BOOKING\srbooking` (package name `srbooking`)
**Audit date:** 5 October 2026
**Audit type:** Read-only. No code, schema or config was changed. The only thing added to the project is this file.

**What I checked:** every file under `app/`, `components/`, `lib/`, `server/`, `supabase/`, plus `proxy.ts`, `package.json`, `next.config.ts`, `.env.example`, `.gitignore`, `README.md`, `ARCHITECTURE.md`, `AGENTS.md` and `SUPABASE_SETUP.md`. I also ran a read-only type-check (`tsc --noEmit --incremental false`). For the `.env` files I looked at variable **names** only, never the values.

---

## How to read this report

- ✅ **Exists**: built and working in the code today
- 🟡 **Partial**: something close exists but is incomplete
- ❌ **Missing**: nothing in the code supports it
- 🔴 / 🟠 / 🟢 **Severity** of a problem: critical / should fix soon / minor

---

## 1. PROJECT OVERVIEW

| Item | What the project actually uses |
|---|---|
| **Framework** | Next.js **16.3.1**, App Router only (`app/`). Server Components by default. Route protection lives in `proxy.ts`, which replaces `middleware.ts` in Next 16. |
| **Language** | TypeScript 5 (`strict`). React **19.2.8**. |
| **UI library** | Tailwind CSS v4 (`@tailwindcss/postcss`, tokens in `app/globals.css`). shadcn-style primitives in `components/ui/*` built on Radix UI (dialog, select, dropdown, tabs, popover, checkbox, avatar, toast…). Icons from `lucide-react`, toasts from `sonner`. |
| **Backend** | No separate backend server. Writes go through **Next.js Server Actions** in `server/actions/*.ts`, and there is one Route Handler for PDFs. Postgres functions (RPCs) handle the atomic invoice logic. |
| **Database** | **Supabase Postgres**, schema in `supabase/migrations/*.sql` (5 migration files). Row-Level Security (RLS) is on for every table. |
| **Authentication** | **Supabase Auth** (email + password) via `@supabase/ssr` cookies. App roles live in `public.profiles.role` (`ADMIN`, `MERCHANT`, `CUSTOMER`). Login accepts email **or** mobile number (resolved through the `email_for_identifier` RPC). Guards: `lib/auth/guards.ts` (`requireSession`, `requireAdmin`, `requireStaff`, `requireCustomer`). |
| **API structure** | 1 HTTP route: `GET /api/invoices/[id]/pdf` (`app/api/invoices/[id]/pdf/route.ts`). Everything else is Server Actions (listed in section 2) plus Supabase RPCs: `create_invoice`, `email_for_identifier`, `customer_outstanding_totals`, `current_role`, `current_customer_id`, `is_admin`, `is_merchant`. |
| **State management** | No global store (no Redux, Zustand or React Query). Data is fetched in Server Components. Filters, search and pagination live in the URL (`searchParams`). Forms use local `useState` or React Hook Form. Live updates come from `<RealtimeRefresher table=… />` → `lib/realtime/use-realtime-table.ts`, which calls `router.refresh()` whenever a Supabase Realtime change arrives. |
| **Important dependencies** | `@supabase/supabase-js` 2.58, `@supabase/ssr` 0.7, `zod` 4, `react-hook-form` 7 + `@hookform/resolvers`, `decimal.js` (money maths), `pdf-lib` (invoice PDF), `date-fns`, `sonner`, `class-variance-authority`, `tailwind-merge`, `clsx`. Dev: `supabase` CLI, `tsx` (seed script), ESLint 9. |
| **Deployment configuration** | **None found.** There is no `vercel.json`, Dockerfile or CI workflow. `next.config.ts` only sets `allowedDevOrigins: ["172.23.192.1","127.0.0.1","localhost"]`, which is a dev-only setting. Scripts: `dev`, `build`, `start`, `lint`, `db:seed`. |
| **Environment variables** | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only, used in `lib/supabase/admin.ts` and `supabase/seed.ts`), `NEXT_PUBLIC_APP_NAME`. All four appear in both `.env` and `.env.local`, and the template is `.env.example`. |

> ⚠️ **The documentation is out of date.** `README.md` and `ARCHITECTURE.md` still describe **Prisma + a custom JWT (`jose`) + bcrypt** and a `prisma/` folder. None of that is in the code anymore. The real stack is Supabase, which `AGENTS.md` and `SUPABASE_SETUP.md` describe correctly. `README.md` also mentions an `npm run db:migrate` script that doesn't exist, and `.windsurf/skills/` holds six Prisma skills that no longer apply.

---

## 2. CURRENT FEATURES

### 2.1 Login / Authentication — ✅ Working
- **Routes:** `/login`, `/` (redirects by role)
- **Components:** `app/login/page.tsx`, `components/layout/logout-button.tsx`
- **Server Actions:** `loginAction`, `logoutAction` (`server/actions/auth.ts`)
- **Database:** `auth.users`, `public.profiles`. RPC `email_for_identifier`. Trigger `handle_new_auth_user` creates the profile row automatically.
- **What it does:** logs in by email or mobile and sends the user to `/admin/dashboard` (ADMIN/MERCHANT) or `/customer/dashboard` (CUSTOMER). `proxy.ts` refreshes the session on every request and enforces the role boundaries.

### 2.2 Admin Dashboard — ✅ Basic
- **Route:** `/admin/dashboard` (`app/admin/dashboard/page.tsx`)
- **Components:** `StatCard`, `DataTableWrapper`, `PaymentStatusBadge`, `RealtimeRefresher`
- **Database:** `customers`, `invoices`, `service_tickets`
- **What it does:** shows 6 stat cards, a "printers ready for pickup" banner, quick-action buttons, the last 8 invoices and the last 5 customers. It updates live. Details are in section 6.

### 2.3 Customer Management — ✅ Working (basic profile only)
- **Routes:** `/admin/customers`, `/admin/customers/new`, `/admin/customers/[id]`, `/admin/customers/[id]?edit=true`
- **Components:** `components/customers/customer-form.tsx`, `components/customers/customer-delete-button.tsx`, `components/shared/url-search-bar.tsx`, `components/shared/pagination.tsx`
- **Server Actions:** `createCustomerAction`, `updateCustomerAction`, `deleteCustomerAction` (`server/actions/customers.ts`)
- **Database:** `customers` (+ `profiles` when a portal login is created). RPC `customer_outstanding_totals`.
- **What it does:**
  - Add, edit and delete customers. Type is INDIVIDUAL or BUSINESS, with company, phone, alternate phone, email, address, city, state, pincode, GSTIN, notes, **one** device type and **one** device model.
  - Optionally creates a customer-portal login.
  - The list shows search (name, phone, email, GSTIN), invoice count and outstanding balance.
  - The detail page shows Total Invoices, Total Billed, Outstanding and the last 20 invoices.
  - A customer can't be deleted while they have invoices.
- **Not shown on the customer page:** their service tickets, devices, area, last service date, follow-ups, referral source.

### 2.4 Service Tickets (front-counter job intake) — ✅ Working
- **Routes:** `/admin/service-tickets`, `/admin/service-tickets/new`, `/admin/service-tickets/[id]` (+ `?edit=true`), `/admin/service-tickets/[id]/acknowledgment`, `/admin/service-tickets/[id]/sticker`
- **Components:** `components/service-tickets/service-ticket-form.tsx`, `service-ticket-filters.tsx`, `service-ticket-status-badge.tsx`, `service-ticket-status-control.tsx`, `service-ticket-detail-actions.tsx`, `acknowledgment-document.tsx`, `sticker-document.tsx`
- **Server Actions:** `createServiceTicketAction`, `updateServiceTicketAction`, `updateServiceTicketStatusAction` (`server/actions/service-tickets.ts`)
- **Database:** `service_tickets` (auto number `SRT-00001`), enum `service_ticket_status`. A trigger auto-stamps `ready_at` and `collected_at`.
- **What it does:**
  - Records a printer drop-off: name, phone, brand, model, serial, problem and notes.
  - **Automatically finds the existing customer by phone, or creates a new one.**
  - Tracks status RECEIVED → IN_PROGRESS → READY → COLLECTED.
  - Prints an acknowledgment slip and a printer sticker.
  - Has search and a status filter.
- **This is the closest thing the app has to "Service Jobs".** It has no technician, schedule, charges, parts, warranty or invoice link, and it only covers carry-in repairs (no on-site visits).

### 2.5 Invoicing (Sales & Service) — ✅ Working (create only)
- **Routes:** `/admin/invoices`, `/admin/invoices/new?type=sales|service&customerId=…`, `/admin/invoices/[id]` (+ `?print=1`)
- **Components:** `components/invoices/invoice-form.tsx` (665 lines), `invoice-summary.tsx`, `invoice-document.tsx`, `invoice-filters.tsx`, `invoice-pagination.tsx`, `create-invoice-dialog.tsx`, `invoice-detail-actions.tsx`, `invoice-print-trigger.tsx`
- **Server Actions:** `createInvoiceAction` (`server/actions/invoices.ts`). RPC `create_invoice` allocates the invoice number and inserts the invoice, its items and the first payment in one atomic step.
- **API:** `GET /api/invoices/[id]/pdf` (`lib/pdf/invoice-pdf.ts`)
- **Database:** `invoices`, `invoice_items`, `payments`, `business_settings.next_invoice_number`
- **What it does:**
  - Line items from products or services, GST mode (CGST+SGST, IGST or none), discount, amount paid and payment method.
  - Totals are recalculated on the server with `decimal.js`.
  - Service invoices carry printer brand, model, serial and complaint.
  - Print view and PDF download.
  - Filters: search, type, status and date range.
- **Missing:**
  - **No way to record a payment after the invoice is created.**
  - No editing, cancelling or voiding an invoice.
  - No link to a service ticket.

### 2.6 Payments — 🟡 Partial
- **Database:** `payments` (`invoice_id`, `amount`, `payment_method`, `payment_date`, `reference_number`, `notes`)
- **What it does:** a payment row is created only inside `create_invoice` (the "amount paid" entered when the invoice is created). There is **no UI, action or RPC to add a later payment**, so an invoice that starts as PENDING or PARTIAL can never become PAID inside the app.

### 2.7 Products catalogue — ✅ Working
- **Routes:** `/admin/products`, `/admin/products/new`, `/admin/products/[id]`
- **Component:** `components/products/product-form.tsx`
- **Server Actions:** `createProductAction`, `updateProductAction`, `deleteProductAction` (soft-deactivates the product if an invoice uses it)
- **Database:** `products` (name, sku, brand, category, selling_price, gst_percentage, unit, is_active)
- **Missing:** cost price and stock quantity, so there is no parts profit or inventory.

### 2.8 Services catalogue — ✅ Working
- **Routes:** `/admin/services`, `/admin/services/new`, `/admin/services/[id]`
- **Component:** `components/services/service-form.tsx`
- **Server Actions:** `createServiceAction`, `updateServiceAction`, `deleteServiceAction`
- **Database:** `services` (name, service_code, description, service_charge, gst_percentage, is_active)

### 2.9 Merchants (partner / staff logins) — ✅ Working
- **Routes:** `/admin/merchants`, `/admin/merchants/new` (ADMIN only)
- **Components:** `components/merchants/merchant-form.tsx`, `merchant-delete-button.tsx`
- **Server Actions:** `createMerchantAction`, `deleteMerchantAction` (`server/actions/merchants.ts`)
- **Database:** `profiles` (role `MERCHANT`) plus a `merchant_id` column on `customers`, `products`, `services`, `invoices` and `service_tickets`, enforced by RLS.
- **What it does:** a partner gets their own login and only sees the rows they created. The admin sees everything.
- **Relevance:** this is a **data-ownership system, not technician management.** A merchant can't be assigned jobs, has no cost or area, and so on.

### 2.10 Business Settings — ✅ Working
- **Route:** `/admin/settings` (ADMIN only)
- **Component:** `components/settings/settings-form.tsx`
- **Server Actions:** `updateBusinessSettingsAction`, `getBusinessSettings`
- **Database:** `business_settings` (name, tagline, address, phone, email, GSTIN, state, pincode, invoice prefix and numbering, logo_url, T&C, bank details, UPI ID)
- **Missing:** Google review link, WhatsApp number, daily and monthly targets.

### 2.11 Customer Portal — ✅ Working (invoices only)
- **Routes:** `/customer/dashboard`, `/customer/invoices`, `/customer/invoices/[id]`, `/customer/profile`
- **Components:** `components/layout/customer-shell.tsx`, `customer-sidebar.tsx`, `InvoiceDocument`, `PrintInvoiceButton`
- **What it does:** a customer sees their invoice totals, pending amount, invoice list, invoice detail and PDF, and a read-only profile.
- **Missing:** customers **can't see their service tickets or repair status**, because RLS on `service_tickets` is admin and merchant only.

### 2.12 Reports — ❌ Placeholder
- **Route:** `/admin/reports` (`app/admin/reports/page.tsx`). It only shows "Reports coming in a future phase."

### 2.13 Real-time updates — ✅ Working
- `components/shared/realtime-refresher.tsx` + `lib/realtime/use-realtime-table.ts`. Every business table is added to the `supabase_realtime` publication.

### 2.14 Seed data — ✅ Dev only
- `supabase/seed.ts` (`npm run db:seed`) **wipes** payments, invoice_items, invoices, customers, products, services and business_settings, then inserts sample data. Samples include a xerox shop and a photo-studio customer, an admin `admin@srtechsolutions.com / ChangeMe123!` and a customer `abc@computers.com / Customer123!`.

---

## 3. DATABASE AUDIT

### 3.1 Tables (9)

#### `business_settings` (single row)
| Column | Type | Notes |
|---|---|---|
| id | uuid **PK** | |
| business_name, tagline | text | defaults "SR TECH SOLUTIONS" / "All Types Printer Repair & Support" |
| business_address, phone, email, gstin, state, pincode | text | |
| invoice_prefix | text | default `INV-` |
| invoice_starting_number, next_invoice_number | int | the counter `create_invoice` locks to number invoices |
| logo_url, terms_and_conditions, bank_details, upi_id | text | |
| created_at, updated_at | timestamptz | |

#### `customers`
| Column | Type | Notes |
|---|---|---|
| id | uuid **PK** | |
| customer_type | enum `customer_type` | INDIVIDUAL / BUSINESS |
| name, phone | text, required | phone is indexed but **not unique** |
| company_name, alternative_phone, email, address, city, state, pincode, gstin, notes | text | |
| device_type | enum `device_type` | **one device only** |
| device_model | text | **one device only** |
| merchant_id | uuid **FK → profiles.id** (on delete set null) | default `auth.uid()` |
| created_at, updated_at | timestamptz | |

#### `profiles` (1:1 with `auth.users`)
| Column | Type | Notes |
|---|---|---|
| id | uuid **PK, FK → auth.users.id** (cascade) | |
| name, email | text | |
| phone | text | used for mobile login |
| role | enum `user_role` | ADMIN / CUSTOMER / MERCHANT |
| customer_id | uuid **FK → customers.id** (set null) | unique when not null |
| created_at, updated_at | | |

#### `products`
id **PK**, name, sku (unique), brand, category, description, selling_price, gst_percentage, unit, is_active, merchant_id **FK → profiles**, timestamps.

#### `services`
id **PK**, name, service_code (unique), description, service_charge, gst_percentage, is_active, merchant_id **FK → profiles**, timestamps.

#### `invoices`
| Column | Notes |
|---|---|
| id **PK**, invoice_number (unique) | |
| invoice_type | SALES / SERVICE |
| customer_id | **FK → customers.id**, required, no on-delete rule |
| invoice_date, due_date | |
| gst_mode, subtotal, discount, cgst, sgst, igst, gst_total, grand_total | |
| amount_paid, balance_due, payment_status | **stored copies**, not derived from `payments` |
| notes | |
| printer_brand, printer_model, printer_serial, customer_complaint | free-text copies of the device |
| merchant_id | FK → profiles |
| created_at, updated_at | |

#### `invoice_items`
id **PK**, invoice_id **FK → invoices** (cascade), item_type (PRODUCT/SERVICE), product_id **FK → products** (set null), service_id **FK → services** (set null), description, quantity, unit_price, gst_percentage, gst_amount, total_amount, sort_order.
Has **no** `cost_price`, so profit per line can't be calculated.

#### `payments`
id **PK**, invoice_id **FK → invoices** (cascade), amount, payment_method (CASH/UPI/BANK_TRANSFER/CARD/OTHER), payment_date, reference_number, notes, created_at.

#### `service_tickets`
| Column | Notes |
|---|---|
| id **PK** | |
| ticket_seq (identity), ticket_number | generated as `SRT-00001` |
| customer_id | **FK → customers** (set null) |
| customer_name, phone_number | **copies of customer data** |
| printer_brand, printer_model, serial_number | **device is free text, not linked** |
| problem_description, notes | |
| status | RECEIVED / IN_PROGRESS / READY / COLLECTED |
| received_at, ready_at, collected_at | |
| created_by | FK → profiles |
| merchant_id | FK → profiles |
| created_at, updated_at | |

### 3.2 Enums
`user_role` (ADMIN, CUSTOMER, MERCHANT) · `customer_type` · `device_type` (PRINTER, LAPTOP, COMPUTER, SCANNER) · `invoice_type` · `payment_status` (PAID, PARTIAL, PENDING) · `payment_method` · `gst_mode` · `invoice_item_type` · `service_ticket_status`

### 3.3 Relationships today

```
profiles ──1:1── auth.users
profiles ──0..1── customers            (portal login)
customers ──1:N── invoices ──1:N── invoice_items ──N:1── products / services
                     └──1:N── payments
customers ──1:N── service_tickets      (optional link, auto-made by phone)
profiles(MERCHANT) ──1:N── customers / products / services / invoices / service_tickets
```

### 3.4 Does the structure support the CRM chain you want?

| Chain link | Supported? | Why |
|---|---|---|
| Customer → **multiple devices/printers** | ❌ | Only `customers.device_type` and `device_model` (one device). The same printer is also typed again as free text in `service_tickets` and `invoices`. There is no `devices` table. |
| Customer → **multiple enquiries** | ❌ | No enquiry or lead table. |
| Customer → **multiple service jobs** | 🟡 | `service_tickets.customer_id` gives 1:N, but tickets have no technician, schedule, charges or job type. |
| Job → **payments** | ❌ | Payments belong to invoices, and invoices aren't linked to tickets. |
| Customer → **payments** | ✅ | Indirectly, through invoices. |
| **Service history** | 🟡 | Possible via invoices + tickets, but the customer page only shows invoices. |
| **Follow-ups** | ❌ | No table, no dates. |
| **Reviews** | ❌ | Nothing. |
| **Referrals** | ❌ | No referral or source column anywhere. |

### 3.5 Missing relationships
1. `service_tickets` ↔ `invoices`: no `invoice_id` or `service_ticket_id`, so you can't tell which bill belongs to which repair.
2. `service_tickets` / `invoices` → `devices`: the device isn't a real record.
3. `customers` → `customers` (referred by): missing.
4. Anything → enquiry, technician, follow-up, review, message, expense: none of these tables exist.

### 3.6 Duplicate / redundant fields
- **Device data stored 3 times:** `customers.device_type/device_model`, `service_tickets.printer_brand/printer_model/serial_number`, and `invoices.printer_brand/printer_model/printer_serial`.
- **Customer identity copied:** `service_tickets.customer_name` and `phone_number` duplicate `customers.name` and `phone`. If the customer record is edited, the ticket keeps the old values.
- **Phone and email copied** between `customers` and `profiles`. Editing a customer doesn't update `profiles.phone` or the auth email, so **mobile login breaks after a phone change**.
- **Payment totals stored twice:** `invoices.amount_paid`, `balance_due` and `payment_status` are stored copies of `SUM(payments.amount)`. That's fine while there's only ever one payment, but they will drift once "record payment" is added unless one RPC keeps them in sync.
- `invoices.customer_complaint` duplicates `service_tickets.problem_description`.

### 3.7 Potential database problems
- 🟠 **`customers.phone` is not unique or normalised.** `findOrCreateCustomerId` in `server/actions/service-tickets.ts` uses `.eq("phone", phone).maybeSingle()`. If two customers share a phone, `maybeSingle` returns an error, which the code treats as "not found", so it **creates a third duplicate**. `"98765 43210"`, `"+919876543210"` and `"9876543210"` are also treated as three different people.
- 🟠 **No area / locality field** beyond free-text `city`.
- 🟠 **No cost columns** (product cost, technician cost, travel), so profit can't be calculated.
- 🟢 `invoices.customer_id` has no `ON DELETE` rule. That's fine because the app blocks the delete, but it's worth knowing.
- 🟢 `merchant_id` defaults to `auth.uid()`, so rows the admin creates are stamped with the admin's id, not `NULL` as the migration comment says. This is harmless, but reports per merchant must take it into account.
- 🟢 `supabase/seed.ts` doesn't clear `service_tickets`.

---

## 4. CURRENT CUSTOMER FLOW

| Step | What exists today | What's missing |
|---|---|---|
| **1. Enquiry** (call / WhatsApp / walk-in) | ❌ Nothing. An enquiry that doesn't become a drop-off is never recorded. | Enquiry record, source, quote, status, follow-up date, won/lost. |
| **2. Customer creation** | ✅ Manually at `/admin/customers/new`, **or** automatically when a service ticket is created (matched by phone). | Lead source, area, referred-by. Duplicate protection (phone normalisation). |
| **3. Device / printer** | 🟡 One device on the customer, plus free-text printer fields on each ticket and invoice. | A `devices` table with many devices per customer, reused across jobs. |
| **4. Service / job** | 🟡 `service_tickets`: intake → In Progress → Ready → Collected, with acknowledgment slip and sticker. | Technician, on-site vs carry-in, scheduled date and time, parts used, labour, travel, technician cost, warranty. |
| **5. Payment** | 🟡 Recorded only once, at invoice creation. The invoice is created separately and isn't linked to the ticket. | "Record payment" later, a ticket → invoice link, and a "Create invoice from ticket" button. |
| **6. Completion** | 🟡 Status COLLECTED stamps `collected_at`. A dashboard banner prompts you to call "ready" customers. | Completion checklist, warranty end date, and a trigger to start follow-ups and a review request. |
| **7. Follow-up** | ❌ Nothing. | 7, 30 and 90-day follow-ups, a follow-up queue, WhatsApp templates. |
| **8. Review / referral** | ❌ Nothing. | Review request and tracking, referral tracking. |

**In short:** the app handles the middle of the funnel well: intake, repair status, billing and printing. The start (enquiry, source) and the end (follow-up, review, referral, repeat business) don't exist yet.

---

## 5. BUSINESS CRM GAP ANALYSIS

### A. Lead / Enquiry Management
| Item | Status |
|---|---|
| New enquiry | ❌ |
| Lead source | ❌ |
| Enquiry status | ❌ |
| Quote amount | ❌ |
| Follow-up date | ❌ |
| Won / Lost | ❌ |
| Conversion tracking | ❌ |

### B. Customer Management
| Item | Status | Where / note |
|---|---|---|
| Customer profile | ✅ | `customers`, `/admin/customers/[id]` |
| Multiple devices | ❌ | single `device_type` / `device_model` |
| Service history | 🟡 | invoices are shown; tickets exist but **aren't shown on the customer page** |
| Customer notes | 🟡 | one `notes` text field, no timeline |
| Area / location | 🟡 | `address`, `city`, `pincode` free text, no area field, can't filter by them |
| Total spending | ✅ | "Total Billed" card on the customer detail page (invoiced, not collected) |
| Last service | ❌ | not calculated or shown |
| Next follow-up | ❌ | |

### C. Service Management
| Item | Status | Where / note |
|---|---|---|
| Job creation | ✅ | `service_tickets` |
| Technician assignment | ❌ | only `created_by` (who typed it in) |
| Scheduled date / time | ❌ | only `received_at` |
| Job status | ✅ | 4 statuses, no Cancelled / On-hold / Waiting-for-parts |
| Parts used | 🟡 | only as product lines on a separate invoice |
| Labour charge | 🟡 | only as a service line on the invoice |
| Travel charge | ❌ | |
| Technician cost | ❌ | |
| Profit calculation | ❌ | no cost data anywhere |
| Warranty | ❌ | |

### D. Follow-up Management: ❌ all missing
Pending, today's, upcoming, overdue, 7-day, 30-day and 90-day follow-ups: none exist. The only "follow-up-like" feature is the **"printers ready for pickup — call the customers" banner** on `/admin/dashboard`.

### E. Messaging: ❌ all missing
No templates, no WhatsApp links, no message log. I searched every file for `whatsapp`, `wa.me`, `template` and `sms`: no matches. The acknowledgment slip only says "We will call you at {phone}".

### F. Reviews: ❌ all missing
No Google review link in settings, no review status or date.

### G. Referrals: ❌ all missing

### H. Technician Management
| Item | Status | Note |
|---|---|---|
| Technician profiles | ❌ | `MERCHANT` role is the closest, but it's a partner login with separate data, not a technician |
| Service type, area, assigned jobs, cost, job history, rating | ❌ | |

### I. Business Analytics
| Item | Status | Note |
|---|---|---|
| Daily enquiries | ❌ | |
| Daily services | ❌ | dashboard is monthly only |
| New customers | 🟡 | "Recent Customers" list, no count per day or month |
| Revenue | 🟡 | "Sales This Month" + "Service Revenue" (invoiced totals **including GST**, not money collected) |
| Expenses | ❌ | |
| Technician cost | ❌ | |
| Profit | ❌ | |
| Conversion rate | ❌ | |
| Lead source performance | ❌ | |
| Repeat customer rate | ❌ | |

---

## 6. DASHBOARD AUDIT

### Metrics that exist today (`app/admin/dashboard/page.tsx`)
1. Total Customers (all time)
2. Total Invoices (all time)
3. Sales This Month (sum of SALES `grand_total`)
4. Service Revenue This Month (sum of SERVICE `grand_total`)
5. Pending Payments (sum of `balance_due` where PENDING or PARTIAL)
6. Active Service Tickets (RECEIVED + IN_PROGRESS), with a "ready for pickup" hint
7. A green banner: "N printers ready for pickup — call the customers"
8. Quick actions: New Service Ticket, New Customer, Sales Invoice, Service Invoice, New Product, New Service
9. Tables: Recent Invoices (8), Recent Customers (5)

### Charts that exist
**None.** There is no chart library in `package.json`.

### What's wrong or missing in the current dashboard
- Everything is "this month" or "all time". There are **no "today" numbers.**
- Revenue counts invoiced totals including GST, not money collected (`payments`) and not GST-exclusive revenue.
- The month boundaries come from `getCurrentMonthBounds()` (`lib/dates.ts`), which uses the **server's timezone**. On a cloud server running in UTC, the month starts at 5:30 AM IST.
- No targets, no comparison with last month, no enquiries, follow-ups, reviews, referrals, expenses or profit.

### Recommended dashboard for the 6-month target

**Row 1: TODAY** (each tile shows actual vs target, coloured green when the target is met)
| Tile | Source (after upgrade) | Target |
|---|---|---|
| Enquiries | `enquiries.created_at = today` | 5+ |
| Services done | `service_tickets` completed today | 2–3 |
| New customers | `customers.created_at = today` | – |
| Revenue (collected) | `payments.payment_date = today` | – |
| Expenses | `expenses.expense_date = today` | – |
| Profit | revenue − expenses − technician cost − parts cost | – |
| Pending follow-ups | `follow_ups` due ≤ today and not done | 0 overdue |
| Reviews received | `reviews.received_at = today` | – |
| Referrals | `customers.referred_by_customer_id` set today | – |

**Row 2: ACTION LISTS** (this is what makes the dashboard drive the day)
- Today's follow-ups (with a WhatsApp button)
- Overdue follow-ups
- Open enquiries with no response yet
- Jobs scheduled today, grouped by technician
- Ready for pickup (already exists, keep it)
- Unpaid invoices older than 7 days

**Row 3: THIS MONTH**
Total enquiries · Converted customers · Conversion % · Services completed · Revenue · Profit · Reviews · Referrals · Repeat customers (% of jobs from customers with an earlier job)

**Row 4: CHARTS**
- Daily enquiries vs services, last 30 days (bar chart with a target line)
- Enquiries by lead source, with conversion % per source
- Revenue vs expenses vs profit, by month
- Jobs per area

---

## 7. MESSAGE / WHATSAPP SYSTEM

### Current state
**No messaging exists.** There are no templates, no `wa.me` links, no SMS or email sending, and no message log.

### Recommended architecture: click-to-send (no API needed, free)

```
[Any page: customer / enquiry / ticket / invoice / follow-up]
      │  "Send WhatsApp" button
      ▼
<SendMessageDialog context={{customerId, enquiryId?, ticketId?, invoiceId?}} />
      │  1. picks a template (filtered by context, e.g. "Service completed")
      │  2. server builds variables from DB rows
      ▼
lib/messaging/render-template.ts  →  replaces {{customer_name}} etc.
      │  3. staff can edit the text before sending
      ▼
lib/messaging/whatsapp-link.ts    →  https://wa.me/91XXXXXXXXXX?text=<encoded>
      │  4. opens WhatsApp (desktop app / web / phone)
      ▼
logMessageAction()  →  message_logs row (who, when, template, customer, entity)
      │  5. optionally marks the related follow-up as done
```

**New pieces:**
- **Table `message_templates`:** `id, key (unique, e.g. SERVICE_COMPLETED), name, category (ENQUIRY | SCHEDULED | COMPLETED | PAYMENT | REVIEW | FOLLOW_UP | REFERRAL | AMC), body, is_active, merchant_id, timestamps`. The defaults are seeded in a migration and edited at `/admin/settings/messages`.
- **Table `message_logs`:** `id, customer_id, template_id, channel (WHATSAPP_LINK | WHATSAPP_API | SMS), body_sent, related_type, related_id, sent_by, sent_at, status`. Without this log you can't measure follow-ups done or review requests sent.
- **`lib/messaging/variables.ts`:** a single resolver that turns IDs into the variable values: `{{customer_name}}`, `{{service}}`, `{{device}}`, `{{amount}}`, `{{balance_due}}`, `{{technician_name}}`, `{{service_date}}`, `{{ticket_number}}`, `{{invoice_number}}`, `{{review_link}}` (from `business_settings.google_review_link`), `{{business_name}}`, `{{business_phone}}`, `{{upi_id}}`.
- **`lib/phone.ts`:** normalises Indian numbers to `91XXXXXXXXXX`. The same helper fixes the duplicate-customer problem in section 3.7.
- **One shared component** `components/messaging/send-message-dialog.tsx`, reused on every page. Don't build a separate button per page.

### What official WhatsApp Business API automation needs later
1. **Meta Business verification** and a **WhatsApp Business Account (WABA)**, with a **dedicated phone number** that isn't already active on the normal WhatsApp app.
2. A provider: Meta Cloud API directly, or a BSP such as Interakt, Wati, Gupshup or AiSensy.
3. **Pre-approved message templates** in Meta (Utility vs Marketing categories, billed per conversation). Your `message_templates` table would get a `wa_template_name` and `wa_language` column.
4. **Customer opt-in:** a `customers.whatsapp_opt_in` boolean and date. This is needed for marketing messages.
5. **A webhook route**, e.g. `app/api/webhooks/whatsapp/route.ts`, for delivery and read status and incoming replies. It updates `message_logs.status`.
6. **A scheduler** for automatic reminders: Supabase `pg_cron` + an Edge Function, or Vercel Cron calling a secured route. Today the project has **no background jobs at all**.
7. **Secrets:** `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` and `WHATSAPP_VERIFY_TOKEN`, server-only.
8. **Rules to respect:** the 24-hour customer-service window, and keeping the number's quality rating healthy.

Because the click-to-send version already has templates, variables and logs, switching to the API later only changes the *sending* step.

---

## 8. BUSINESS GROWTH FEATURES

### MUST HAVE (directly drives 5 enquiries/day and 2–3 services/day)
1. **Enquiry / lead register with source.** Every call, WhatsApp message and walk-in gets logged. Sources: Google Maps, JustDial, Referral, Repeat customer, Xerox-shop partner, Walk-in, Facebook/Instagram, Technician network, Other.
2. **Follow-up engine.** Each enquiry and each completed job automatically creates follow-ups. A "Today's follow-ups" list appears on the dashboard.
3. **WhatsApp click-to-send templates**, as described in section 7.
4. **Google review request + tracking.** Send the request when a job is completed or collected, then mark it requested, received or declined.
5. **Referral tracking.** "Referred by" on the customer and on the enquiry, with a referral count and conversions per customer.
6. **Lost lead recovery.** A list of LOST or no-response enquiries older than 7 days, with a "win-back" template.
7. **Multiple devices per customer**, so you can remind people about a specific printer.
8. **Record payments + collected revenue.**
9. **Area-wise tracking.** An `area` field plus filters, to see where enquiries come from and plan technician routes.

### SHOULD HAVE
10. **Repeat-service reminders.** For example: cartridge or toner refill every N days, a 90-day check-up, warranty expiring.
11. **Customer reactivation.** Customers with no job in 120+ days go into a campaign list.
12. **Office customer / B2B segment.** `customer_type = BUSINESS` already exists, so add segment tags (Office, School, Xerox shop, Hospital, Home).
13. **Xerox shop partner programme.** Partner shops refer jobs and earn commission. This can reuse the referral system with `referrer_type = PARTNER`.
14. **Technician referral network.** Freelance technicians who send you work. Same referral system, `referrer_type = TECHNICIAN`.
15. **Service packages.** Fixed-price bundles such as "Laser printer full service ₹X", built as `services` rows with a package flag.
16. **Review campaigns.** A bulk list of happy customers who haven't been asked for a review yet.
17. **Expense tracking + profit.**

### LATER
18. **AMC (Annual Maintenance Contracts).** Contract table, visit schedule and renewal reminders.
19. WhatsApp Business API automation and scheduled reminders.
20. Customer self-service: track repair status in the portal, raise an enquiry online.
21. Inventory and stock of parts, with purchase cost.
22. Technician mobile view (my jobs today) and technician ratings.
23. Public enquiry form / landing page with UTM source capture.

---

## 9. DO NOT BUILD DUPLICATE FEATURES

| Recommended feature | Already exists? | Recommendation |
|---|---|---|
| Service jobs | ✅ `service_tickets` + all its pages and actions | **Extend `service_tickets`** with technician, scheduled time, job type, charges, warranty and invoice link, and add statuses. Don't create a new `jobs` table. If you want, rename the menu label to "Service Jobs" later. |
| Job intake form | ✅ `components/service-tickets/service-ticket-form.tsx` | Add fields to this form. |
| Job status flow | ✅ `service-ticket-status-control.tsx` + timestamp trigger | Extend the enum (`SCHEDULED`, `WAITING_PARTS`, `CANCELLED`) and the existing trigger. |
| Customer profile and history | ✅ `/admin/customers/[id]` | Add tabs to **this page**: Devices · Jobs · Invoices · Enquiries · Follow-ups · Messages · Referrals. |
| Customer auto-create by phone | ✅ `findOrCreateCustomerId()` in `server/actions/service-tickets.ts` | Move it to a shared `lib/customers/find-or-create.ts` and reuse it for enquiries. Fix the phone normalisation first. |
| Devices | 🟡 `customers.device_type/device_model` + ticket and invoice printer fields | Create one `devices` table, migrate these fields into it, then make the old fields read-only or remove them. |
| Payments | 🟡 `payments` table + `create_invoice` RPC | Add a `record_payment` RPC and a `RecordPaymentDialog` on `/admin/invoices/[id]`. Don't build a second payments table. |
| Revenue stats | 🟡 dashboard cards | Move the queries into `lib/analytics/*.ts` and reuse them for both the dashboard and `/admin/reports` (the placeholder page already exists). |
| Reports page | 🟡 `/admin/reports` placeholder | Build reports **here**. Don't add a new route. |
| Technicians | 🟡 `MERCHANT` role and `profiles` | **Don't** reuse MERCHANT, because it would hide data from the admin's other staff. Create a small `technicians` table with an optional `profile_id` for technicians who need a login later, and keep MERCHANT for partners. |
| Business settings (review link, WhatsApp number, targets) | ✅ `business_settings` + `/admin/settings` | Add columns to this table and fields to `settings-form.tsx`. |
| "Call customer when ready" | ✅ dashboard banner | Turn it into a follow-up type (`READY_FOR_PICKUP`) in the new follow-up list, so there's one queue. |
| Search, pagination, filters | ✅ `UrlSearchBar`, `Pagination`, `invoice-filters`, `service-ticket-filters` | Reuse them for the enquiries and follow-ups lists. |
| Live refresh | ✅ `RealtimeRefresher` | Add the new tables to the realtime publication and reuse it. |
| Print documents | ✅ acknowledgment and sticker | Add a warranty card or job sheet with the same `PrintTrigger` / `PrintButton` pattern. |
| Status badges | ✅ `PaymentStatusBadge`, `ServiceTicketStatusBadge` | Copy the pattern for `EnquiryStatusBadge`. |
| Customer portal | ✅ `/customer/*` | Later, add a "My repairs" page here. Don't build a separate portal. |

---

## 10. TECHNICAL DEBT / PROBLEMS (actual findings only)

### 🔴 Critical: security
1. **Any logged-in customer can make themselves ADMIN.** In `00000000000001_init.sql`, the policy `profiles_update_own` is `for update using (id = auth.uid())` with **no column restriction and no `with check`**. The anon key is public (`NEXT_PUBLIC_SUPABASE_ANON_KEY`), so a customer can call Supabase directly and run `update profiles set role='ADMIN'` on their own row, or change `customer_id` to read another customer's invoices. **Fix before going live:** drop that policy, or restrict it with column-level `GRANT UPDATE (name, phone)` and a `with check` that keeps `role` and `customer_id` unchanged.
2. **`email_for_identifier` exposes email addresses to anyone.** It's granted to `anon` and returns the account email for any phone number. The code comment says it "can't be used to enumerate accounts", but anyone can type in phone numbers and collect your customers' emails. **Fix:** do the phone → email lookup inside the server action with the service-role client, and revoke the function from `anon`.

### 🟠 High: bugs
3. **The production build will fail.** The type-check shows **41 TypeScript errors**, in `app/admin/invoices/[id]/page.tsx` (12), `app/api/invoices/[id]/pdf/route.ts` (11), `app/customer/invoices/[id]/page.tsx` (11), `app/admin/invoices/page.tsx` (3), `server/actions/auth.ts` (2), `app/admin/customers/page.tsx` (1) and `app/admin/dashboard/page.tsx` (1). The cause is that `lib/supabase/database.types.ts` is **hand-written**: every `Relationships: []` is empty, and `email_for_identifier` is missing from `Functions`. `next build` type-checks, so it stops. **Fix:** regenerate it with `supabase gen types typescript`.
4. **Merchants can't download invoice PDFs.** `app/api/invoices/[id]/pdf/route.ts` returns 403 when `session.role !== "ADMIN"`, which blocks MERCHANT.
5. **Payments can't be recorded after the invoice is created.** PENDING and PARTIAL invoices stay that way forever (see 2.6).
6. **Redirect loop for orphaned customer logins.** `requireCustomer()` redirects to `/login` when `customerId` is null, and `proxy.ts` sends a logged-in user on `/login` back to `/customer/dashboard`. This loops. It happens when a **merchant** deletes a customer with a login: `deleteCustomerAction` can't see that customer's `profiles` row under RLS, so the auth user isn't deleted and `customer_id` becomes NULL.
7. **Duplicate customers from service tickets.** See 3.7 (non-unique, non-normalised phone plus `maybeSingle`).
8. **Editing a customer's phone or email doesn't update `profiles.phone` or the auth email,** so mobile or email login for that customer stops working.
9. **The GST calculation ignores the discount.** In `lib/invoice/calculations.ts`, GST is computed on line totals *before* the discount, then the discount is subtracted from the grand total. Under GST rules, a discount given on the invoice reduces the taxable value, so tax is overstated whenever a discount is used. Please confirm this with your accountant.
10. **Amount paid can exceed the grand total.** There is no validation. `balance_due` is clamped to 0 but `amount_paid` stores the larger value.
11. **Timezone handling.** `lib/dates.ts` (month bounds) uses the server's local time, and the invoice list date filter (`app/admin/invoices/page.tsx`) mixes UTC `new Date("YYYY-MM-DD")` with local `setHours`. On a UTC server, IST dates will be off by 5.5 hours.
12. **`create_invoice` is `SECURITY DEFINER`** and doesn't check that `customerId` belongs to the calling merchant. The server action checks this, but the RPC can also be called directly with the anon key by a merchant.

### 🟢 Medium / low
13. **`app/page.tsx`** sends `MERCHANT` to `/customer/dashboard`. `proxy.ts` catches it first, but it's wrong code.
14. **Duplicate components:**
   - `components/shared/print-trigger.tsx` vs `components/invoices/invoice-print-trigger.tsx`
   - `components/shared/print-button.tsx` vs `components/invoices/print-invoice-button.tsx`
   - `components/shared/pagination.tsx` vs `components/invoices/invoice-pagination.tsx`
15. **Copy-pasted helpers:**
   - `emptyToNull()` in 5 action files
   - `ActionResult` type redefined in 6 files
   - `escapeOrTerm` / `escapeFilterTerm` in 5 pages
   - The business-settings fallback object in 3 places
   - The invoice → document mapping copied in 3 places: `app/admin/invoices/[id]/page.tsx`, `app/customer/invoices/[id]/page.tsx` and the PDF route
16. **Unused code:**
   - `getInvoiceForCustomer` (`server/actions/invoices.ts`)
   - `components/shared/loading-state.tsx`
   - `components/shared/error-state.tsx`
   - `serviceTicketStatusSchema`
   - `lib/invoice/numbering.ts` (a re-export only)
17. **Missing error handling:**
   - No `loading.tsx`, `error.tsx` or `not-found.tsx` anywhere in `app/`.
   - Many Supabase query errors are ignored (`const { data } = …` without checking `error`), so a failed query shows as "No customers yet".
   - `updateServiceTicketStatusAction` doesn't validate `status` with Zod.
18. **Performance:**
   - The dashboard loads every pending-invoice row and every month's invoice rows, then adds them up in JavaScript. Fine now, but it should be a SQL aggregate.
   - Invoice search builds a `customer_id.in.(…)` list of every matching customer, which can hit URL length limits.
   - `/admin/invoices/new` loads **all** customers into the form.
19. **PDF logo:** `lib/pdf/invoice-pdf.ts` reads the logo with `fs.readFile` from `public/`. This may fail on serverless hosting, and remote logo URLs (`https://…`) are silently ignored.
20. **Hardcoded values:**
   - `"SR TECH SOLUTIONS"` in `admin-sidebar.tsx`, 3 fallback objects and the `app/layout.tsx` metadata
   - `allowedDevOrigins` IPs in `next.config.ts`
   - Invoice number padding fixed at 4 digits (`lpad(..., 4)`)
   - The storage-charges wording in `acknowledgment-document.tsx`
21. **Settings:** `tagline: data.tagline || undefined` means the tagline can never be cleared.
22. **Naming:** the package is `srbooking`, the app is "SR TECH SOLUTIONS", the menu says "Service Tickets", and the business language is "jobs/services". Settle on one vocabulary before adding CRM screens.
23. **Repository hygiene:**
   - Only 5 commits, with many uncommitted modified files (`git status`).
   - `.gitignore` pattern `.env*` also ignores `.env.example`, so the template isn't committed.
   - The stale Prisma docs and skills mentioned in section 1.
24. **Secrets:** the service-role key is in both `.env` and `.env.local`. They are git-ignored, which is correct. The dev passwords are printed in `README.md` and `supabase/seed.ts`: change them in production.

---

## 11. RECOMMENDED UPGRADE ROADMAP

> **Phase 0 must come first.** Fix the two critical security holes and the broken build before adding anything.

### PHASE 0: Foundation fixes (about 2–4 days)
| Item | Priority | Existing / new | Files likely affected | DB changes | API changes | UI changes | Complexity |
|---|---|---|---|---|---|---|---|
| Lock down `profiles` update policy | P0 | Existing | new migration | replace `profiles_update_own` policy, column grants | – | – | Low |
| Make `email_for_identifier` private | P0 | Existing | `server/actions/auth.ts`, new migration | revoke from anon | login lookup via service role | – | Low |
| Regenerate DB types and fix the 41 TS errors | P0 | Existing | `lib/supabase/database.types.ts` + 7 files | – | – | – | Low |
| PDF route: allow MERCHANT | P0 | Existing | `app/api/invoices/[id]/pdf/route.ts` | – | role check | – | Low |
| Phone normalisation + duplicate protection | P0 | Existing | new `lib/phone.ts`, `server/actions/customers.ts`, `service-tickets.ts`, `lib/validations/index.ts` | normalise existing phones, unique index on (merchant_id, phone) after a clean-up | – | duplicate warning in forms | Medium |
| Keep profile phone/email in sync on customer edit | P1 | Existing | `server/actions/customers.ts` | – | – | – | Low |
| IST-safe dates helper | P1 | Existing | `lib/dates.ts`, dashboard, invoice filters | – | – | – | Low |
| Shared helpers (`emptyToNull`, `ActionResult`, escape fn, settings fallback) | P2 | Existing | `lib/*`, action files | – | – | – | Low |
| Update README / ARCHITECTURE, remove Prisma leftovers | P2 | Existing | docs, `.windsurf/skills/prisma-*`, `.gitignore` | – | – | – | Low |

### PHASE 1: Enquiries & Customers (immediate)
| Item | Priority | Existing / new | Files likely affected | DB changes | API changes | UI changes | Complexity |
|---|---|---|---|---|---|---|---|
| **Enquiries / leads** | P0 | New | `app/admin/enquiries/(page, new, [id])`, `components/enquiries/*`, `server/actions/enquiries.ts`, `admin-sidebar.tsx`, `lib/validations` | `enquiries` table: customer_id (nullable), name, phone, area, source, device_text, problem, quote_amount, status (NEW / CONTACTED / QUOTED / FOLLOW_UP / WON / LOST), lost_reason, next_follow_up_at, converted_ticket_id, assigned_to, merchant_id, timestamps. Enum `lead_source`. RLS + realtime. | create, update, change status, **convert to service ticket** (reuses the find-or-create customer logic) | list with status tabs, quick-add form (phone first), detail page | Medium |
| **Lead source & area on customer** | P0 | Existing table | `customer-form.tsx`, `server/actions/customers.ts`, customers list | `customers`: `area`, `lead_source`, `referred_by_customer_id` (FK self), `segment`, `whatsapp_opt_in` | – | form fields + list filters | Low |
| **Devices (many per customer)** | P0 | New (replaces existing fields) | `components/devices/*`, `server/actions/devices.ts`, customer detail, ticket form, invoice form | `devices` table: customer_id FK, device_type, brand, model, serial, purchase_date, notes. Migrate `customers.device_*`. Add `service_tickets.device_id`. | create / update device, pick a device in the ticket form | "Devices" tab on customer, device picker | Medium |
| **Customer 360 page** | P0 | Existing page | `app/admin/customers/[id]/page.tsx` | – | – | tabs: Devices · Jobs · Invoices · Enquiries; cards for Last service, Total spent, Paid, Outstanding | Medium |
| Customer list filters | P1 | Existing | `app/admin/customers/page.tsx` | indexes on area, lead_source | – | filters: area, source, segment, last-service range | Low |

### PHASE 2: Service Operations
| Item | Priority | Existing / new | Files likely affected | DB changes | API changes | UI changes | Complexity |
|---|---|---|---|---|---|---|---|
| **Technicians** | P0 | New | `app/admin/technicians/*`, `components/technicians/*`, `server/actions/technicians.ts` | `technicians`: name, phone, area, skills / service types, pay_type (PER_JOB / SALARY), default_cost, is_active, profile_id (nullable) | CRUD | list + form | Low |
| **Extend service tickets into full jobs** | P0 | Existing | `service-ticket-form.tsx`, `service-ticket-status-control.tsx`, `server/actions/service-tickets.ts`, ticket pages | `service_tickets`: job_type (CARRY_IN / ONSITE / PICKUP), technician_id FK, scheduled_at, enquiry_id FK, device_id FK, labour_charge, travel_charge, technician_cost, warranty_days, warranty_until, invoice_id FK, completed_at. Enum adds SCHEDULED, WAITING_PARTS, CANCELLED. | assign technician, schedule | schedule picker, technician select, "Today's jobs" view | Medium |
| **Create invoice from ticket** | P0 | Existing | `invoice-form.tsx`, `app/admin/invoices/new/page.tsx`, `create_invoice` RPC | `invoices.service_ticket_id` FK (or `service_tickets.invoice_id`) | `create_invoice` payload gets `serviceTicketId` | "Create invoice" button on the ticket, pre-filled | Medium |
| **Record payments** | P0 | Existing table | `app/admin/invoices/[id]/page.tsx`, new `components/invoices/record-payment-dialog.tsx`, `server/actions/invoices.ts` | RPC `record_payment(invoice_id, amount, method, date, ref)` that recalculates amount_paid / balance / status | `recordPaymentAction` | payment history + dialog | Medium |
| **Parts cost → profit** | P1 | Existing | `product-form.tsx`, `invoice-form.tsx`, `create_invoice` | `products.cost_price`, `invoice_items.cost_price` (snapshot) | pass cost in payload | cost field | Low |
| **Expenses** | P1 | New | `app/admin/expenses/*`, `server/actions/expenses.ts` | `expenses`: date, category (RENT, TRAVEL, PARTS, SALARY, MARKETING, OTHER), amount, method, technician_id?, ticket_id?, notes | CRUD | list + form | Low |
| Fix GST-after-discount and overpayment check | P1 | Existing | `lib/invoice/calculations.ts`, `lib/validations/index.ts` | – | – | – | Low |
| Invoice cancel / void | P2 | Existing | invoice pages, actions | `invoices.status` (ACTIVE / CANCELLED), cancelled_reason | `cancelInvoiceAction` | button + badge | Low |

### PHASE 3: Customer Retention
| Item | Priority | Existing / new | Files likely affected | DB changes | API changes | UI changes | Complexity |
|---|---|---|---|---|---|---|---|
| **Follow-ups** | P0 | New (absorbs the "ready for pickup" banner) | `app/admin/follow-ups/page.tsx`, `components/follow-ups/*`, `server/actions/follow-ups.ts`, dashboard | `follow_ups`: customer_id, enquiry_id?, ticket_id?, type (ENQUIRY, READY_PICKUP, DAY_7, DAY_30, DAY_90, PAYMENT_DUE, REVIEW, REACTIVATION, CUSTOM), due_at, status (PENDING / DONE / SKIPPED), outcome, done_by, done_at | create, complete, snooze; **auto-create 7/30/90-day follow-ups on job completion** (DB trigger or in the action) | tabs: Today / Overdue / Upcoming; one-click WhatsApp | Medium |
| **Message templates + WhatsApp click-to-send** | P0 | New | `lib/messaging/*`, `components/messaging/send-message-dialog.tsx`, `app/admin/settings/messages/page.tsx` | `message_templates`, `message_logs` (section 7) | `logMessageAction`, template CRUD | dialog on customer, ticket, invoice, enquiry, follow-up | Medium |
| **Review tracking** | P0 | New | settings form, ticket detail, follow-ups | `business_settings.google_review_link`; `reviews`: customer_id, ticket_id, requested_at, status (REQUESTED / RECEIVED / DECLINED), received_at, rating, notes | mark requested / received | "Ask for review" button, review list | Low |
| **Referrals** | P1 | New (uses `customers.referred_by_customer_id` from Phase 1) | customer form, enquiry form, customer detail | optional `referrers` table for partners and technicians (name, type CUSTOMER / XEROX_SHOP / TECHNICIAN, phone, commission) + `enquiries.referrer_id` | – | "Referred by" picker, referral count on customer | Low |
| Customer portal: "My repairs" | P2 | Existing portal | `app/customer/*`, RLS | `service_tickets_select_own` policy | – | new page | Low |

### PHASE 4: Business Analytics
| Item | Priority | Existing / new | Files likely affected | DB changes | API changes | UI changes | Complexity |
|---|---|---|---|---|---|---|---|
| Analytics query layer | P0 | New | `lib/analytics/*.ts` | SQL views / RPCs: `daily_kpis(date)`, `monthly_kpis(month)`, `source_performance(from, to)`, `repeat_customer_rate` | RPCs | – | Medium |
| **New dashboard** (section 6) | P0 | Existing page | `app/admin/dashboard/page.tsx`, `components/dashboard/*` | `business_settings`: target_enquiries_per_day, target_services_per_day, target_monthly_revenue | – | Today / Month rows, action lists | Medium |
| **Reports page** | P1 | Existing placeholder | `app/admin/reports/page.tsx` | – | – | date-range reports: revenue, profit, sources, areas, technicians; CSV export | Medium |
| Charts | P1 | New dependency | `package.json` (e.g. `recharts`), `components/charts/*` | – | – | 4 charts | Low |

### PHASE 5: Automation
| Item | Priority | Existing / new | Files likely affected | DB changes | API changes | UI changes | Complexity |
|---|---|---|---|---|---|---|---|
| Scheduled reminders (cron) | P1 | New | Supabase Edge Function or `app/api/cron/*` | `pg_cron` job | secured cron route | – | Medium |
| WhatsApp Business API | P2 | New (reuses templates and logs) | `lib/messaging/providers/whatsapp-cloud.ts`, `app/api/webhooks/whatsapp/route.ts` | `message_templates.wa_template_name`, `message_logs.provider_message_id` | send + webhook | send mode toggle | High |
| AMC contracts | P2 | New | `app/admin/amc/*` | `amc_contracts` (customer, devices, start, end, visits_per_year, amount), `amc_visits` → linked to `service_tickets` | CRUD + renewal follow-ups | list / detail | High |
| Repeat-service and refill reminders | P2 | New | follow-ups engine | `services.reminder_after_days` | auto-create follow-ups | – | Low |
| Inventory | Later | New | products | `stock_qty`, `stock_movements` | – | – | High |

---

## 12. FINAL SUMMARY

### 1. Current application purpose
A **billing and front-counter system** for a printer repair and sales shop. It records printer drop-offs (service tickets with printed slips and stickers), keeps customers, products and services, makes GST invoices with PDFs, gives customers a portal for their invoices, and lets partner "merchants" keep separate books.

### 2. Existing major features
Login (email or mobile) · Role-based access (Admin / Merchant / Customer) · Admin dashboard · Customers · Service tickets with acknowledgment and sticker printing · Sales and service invoices (GST, PDF, print) · Products · Services · Merchants · Business settings · Customer portal · Live refresh everywhere.

### 3. Strongest parts of the current app
- **Clean, consistent architecture:** Server Components, Server Actions, RLS on every table, and an atomic `create_invoice` RPC.
- **Correct money handling** with `decimal.js` and recalculation on the server.
- **Service ticket flow** with auto customer linking, status timestamps and print documents. This is a good base to grow into full job management.
- **Reusable UI kit** (`components/ui`, `components/shared`) and a realtime refresh pattern.
- A clear `AGENTS.md` that keeps future changes consistent.

### 4. Biggest gaps
1. No enquiry / lead capture or lead source tracking.
2. No follow-ups, messages, reviews or referrals.
3. No technicians, scheduling, costs or profit.
4. Payments can't be recorded after the invoice is created.
5. One device per customer; device data copied in three places.
6. A dashboard with no "today" view, targets or charts; Reports is empty.
7. **Two critical security holes and a failing build** (section 10, items 1–3).

### 5. Database changes required
- **New tables:** `enquiries`, `devices`, `technicians`, `follow_ups`, `message_templates`, `message_logs`, `reviews`, `expenses`, optional `referrers`, later `amc_contracts` / `amc_visits`.
- **New columns:**
  - `customers`: area, lead_source, referred_by_customer_id, segment, whatsapp_opt_in
  - `service_tickets`: job_type, technician_id, scheduled_at, enquiry_id, device_id, labour_charge, travel_charge, technician_cost, warranty_until, invoice_id, completed_at, plus new statuses
  - `products.cost_price` and `invoice_items.cost_price`
  - `invoices.status` for cancelling
  - `business_settings`: google_review_link, whatsapp_number, targets
- **New RPCs / views:** `record_payment`, KPI views or RPCs.
- **Fixes:** `profiles` update policy, revoke `email_for_identifier` from anon, normalise phones and add a unique index, regenerate types.

### 6. Top 10 features to build next
1. Security and build fixes (Phase 0)
2. Enquiries / leads with source, status and quote
3. Follow-up engine (Today / Overdue / Upcoming, with auto 7/30/90-day follow-ups)
4. WhatsApp click-to-send templates + message log
5. Record payments (`record_payment` RPC)
6. Extend service tickets: technician, schedule, charges, warranty, invoice link
7. Technicians
8. Devices table (multiple printers per customer) + Customer 360 page
9. Google review requests + referral tracking
10. New target dashboard (Today / Month) + expenses and profit

### 7. Features NOT to build yet
- WhatsApp Business API automation (start with click-to-send and add the API once messaging volume justifies it)
- AMC contracts module
- Inventory / stock management
- Technician mobile app or technician logins
- A public website / online booking portal
- Multi-business (multi-tenant) support
- A separate "jobs" table (extend `service_tickets` instead)

### 8. Recommended development order
**Phase 0 (fixes)** → Enquiries + customer source/area → Follow-ups → WhatsApp templates → Record payments → Technicians + extended tickets + ticket→invoice link → Devices + Customer 360 → Reviews + Referrals → Expenses + cost price → Dashboard + Reports → Automation (cron, WhatsApp API, AMC).

The order is chosen so that **from week 2 you are capturing every enquiry and following up every day.** Those two habits drive the 5 enquiries/day and 2–3 services/day target more than anything else.

### 9. Architecture changes needed before adding features
1. **Fix RLS** on `profiles` and make `email_for_identifier` private.
2. **Use generated Supabase types** (`supabase gen types`) and add a `types:gen` npm script, so new tables don't break the build.
3. **One phone-number helper** (`lib/phone.ts`) used everywhere, plus clean-up of existing duplicates.
4. **One shared find-or-create customer helper** (lifted out of `server/actions/service-tickets.ts`).
5. **One IST-aware date helper** for all "today" and "this month" maths.
6. **Shared action utilities** (`ActionResult`, `emptyToNull`, error handling) and `error.tsx` / `loading.tsx` boundaries.
7. **An analytics layer** (`lib/analytics/` + SQL views) so the dashboard and reports share the same numbers.
8. **Decide how technicians relate to Merchants** before building: keep MERCHANT for partners and add `technicians` as its own table.
9. **Commit the current uncommitted work to git** and add a basic deployment config (e.g. Vercel + environment variables) before starting Phase 1.
