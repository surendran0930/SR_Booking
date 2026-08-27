# SR TECH SOLUTIONS — Phase 1 Architecture

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4 + shadcn-style UI primitives
- PostgreSQL + Prisma ORM
- Auth: JWT session cookie (`jose`) + `bcryptjs`
- Forms: React Hook Form + Zod
- Money: `decimal.js` (server recalculation)
- PDF: `pdf-lib`

## Roles

| Role     | Home                 | Access                          |
|----------|----------------------|---------------------------------|
| ADMIN    | `/admin/dashboard`   | All admin modules               |
| CUSTOMER | `/customer/dashboard`| Own profile + own invoices only |

## Route map

```
/login
/admin/dashboard
/admin/customers[/new|/[id]]
/admin/products[/new|/[id]]
/admin/services[/new|/[id]]
/admin/invoices[/new|/[id]]
/admin/settings
/admin/reports          (placeholder)
/customer/dashboard
/customer/profile
/customer/invoices[/[id]]
```

## Folder structure

```
app/                  # Routes (App Router)
components/
  ui/                 # Button, Input, Table, Badge, Dialog, …
  layout/             # Sidebar, TopNavbar, PageHeader
  customers|products|services|invoices/
lib/
  auth/               # session, password, guards
  db/                 # Prisma client
  validations/        # Zod schemas
  invoice/            # numbering + decimal totals
  pdf/                # invoice PDF builder
  money.ts
server/actions/       # Server Actions (mutations + queries)
prisma/
  schema.prisma
  seed.ts
proxy.ts              # Next.js 16 route protection (replaces middleware)
```

## Auth flow

1. `login` Server Action validates credentials, hashes compare via bcrypt.
2. Signed JWT stored in httpOnly cookie `sr_session`.
3. `proxy.ts` redirects unauthenticated users and enforces role boundaries.
4. Server Actions call `requireAdmin()` / `requireCustomer()` before any mutation.

## Invoice model (single table)

- `invoiceType`: `SALES` | `SERVICE`
- `InvoiceItem` links optional `productId` and/or `serviceId`
- Service invoices may include printer fields + mixed service/parts lines
- Totals always recalculated on the server with Decimal
- Invoice numbers generated in a DB transaction (`INV-0001`, …)

## Extensibility (later phases)

Leave room for Inventory, Purchases, Payments ledger, Reports, WhatsApp —
do not couple Phase 1 UI to those domains yet.
