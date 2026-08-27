# SR TECH SOLUTIONS — Business Management (Phase 1)

Professional billing and customer management for printer sales & service.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4 + shadcn-style UI
- PostgreSQL + Prisma ORM
- JWT session auth (`jose`) + bcrypt
- React Hook Form + Zod
- Decimal-safe invoice math (`decimal.js`)
- PDF invoices (`pdf-lib`)

## Quick start

### 1. Start local Postgres (Prisma Dev)

```bash
npx prisma dev --name srtech
```

Copy the printed `DATABASE_URL` into `.env` (see `.env.example`).

### 2. Install & migrate

```bash
npm install
npx prisma migrate dev
npm run db:seed
```

### 3. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → redirects to `/login`.

## Development credentials (change before production)

| Role     | Email                         | Password       |
|----------|-------------------------------|----------------|
| Admin    | `admin@srtechsolutions.com`   | `ChangeMe123!` |
| Customer | `abc@computers.com`           | `Customer123!` |

## Phase 1 modules

- Admin & customer login (role-based)
- Admin dashboard with live stats
- Customer / Product / Service CRUD
- Sales & Service invoices (single Invoice model)
- Server-side GST totals & unique invoice numbers
- PDF download + print-friendly invoice
- Business settings
- Customer portal (own invoices only)
- Reports placeholder (future phase)

## Useful scripts

```bash
npm run dev          # Next.js development server
npm run build        # Production build
npm run db:seed      # Seed sample data
npm run db:migrate   # Run migrations
```

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md).
