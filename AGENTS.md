<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# SR Booking — Project AI Rules

These rules apply to every AI-assisted change in this repository. They exist so that Claude, Windsurf, Cursor, or any other AI tool produces code that matches how this project actually works — not generic Next.js boilerplate.

## 1. Stack

- **Framework**: Next.js 16, App Router only (no `pages/`). Server Components by default.
- **Language**: TypeScript, `strict: true`. No JavaScript files.
- **Styling**: Tailwind CSS v4 (CSS-based config, no `tailwind.config.js` theme object — tokens live in CSS).
- **UI primitives**: shadcn-style components in `components/ui/*`. Reuse them; do not hand-roll a button, input, dialog, etc. that already exists there.
- **Forms**: React Hook Form + Zod (`zodResolver`). Every form has a Zod schema next to it.
- **Backend**: Supabase — Postgres, Auth, Realtime. No Prisma, no custom JWT, no raw `pg`. All data access goes through `@supabase/supabase-js` / `@supabase/ssr`.
- **Money math**: `lib/money.ts` and `lib/invoice/calculations.ts`, built on `decimal.js`. Never use native `number` arithmetic for currency, tax, or totals.

## 2. Documentation First

- This is a real, evolving stack (Next.js 16, Tailwind v4, Supabase). Do not assume an API shape from training data — Next.js App Router conventions, Tailwind v4's CSS-first config, and Supabase's client APIs have all changed across versions.
- Before using an unfamiliar API, check `node_modules/next/dist/docs/` for Next.js, the installed `@supabase/supabase-js` / `@supabase/ssr` type definitions for Supabase, and the existing code in this repo for the established pattern. Prefer copying an existing working pattern in this codebase over inventing a new one.
- If genuinely unsure whether an API still exists or works the way you remember, say so and verify rather than guessing.

## 3. Development

- **Server Components are the default.** Only add `"use client"` when the component needs state, effects, browser APIs, or event handlers.
- **Data fetching** happens directly in Server Components (`async function Page()`), using the server Supabase client from `lib/supabase/server.ts`. Do not fetch data in `useEffect` when a Server Component can fetch it instead.
- **Mutations** go through Server Actions in `server/actions/*.ts`, not client-side `fetch` calls to API routes, unless there's already a route handler doing that job.
- **Auth**: use `getSession()` / `requireSession()` / `requireAdmin()` / `requireCustomer()` from `lib/auth/session.ts` and `lib/auth/guards.ts`. Do not call `supabase.auth.getUser()` directly in a page — go through these existing helpers so behavior stays consistent everywhere.
- **Supabase clients** — pick the right one, never mix them up:
  - `lib/supabase/client.ts` — browser client, client components only.
  - `lib/supabase/server.ts` — SSR client, Server Components / Server Actions, respects RLS via the logged-in user's session.
  - `lib/supabase/admin.ts` — service-role client (`import "server-only"`). Use only for operations RLS cannot express (e.g. `auth.admin.createUser`/`deleteUser`). Never import it into anything that could run client-side, and never use it as a shortcut past RLS for ordinary CRUD.
- **Route protection** is handled in `proxy.ts` (middleware). Don't duplicate redirect/auth-boundary logic inside individual pages — extend `proxy.ts` if a new boundary is needed.
- **Realtime**: use the existing `useRealtimeTable(table, filter?)` hook and `<RealtimeRefresher />` component instead of writing new `supabase.channel(...)` subscriptions from scratch. Always ensure subscriptions are cleaned up (the hook already does this — don't bypass it).
- **Snake_case at the data boundary**: Supabase/Postgres columns are `snake_case`. Component props are `camelCase`. Map explicitly at the page's data-fetch boundary (where the query result is read), not deep inside shared components.
- **Atomic writes**: multi-table operations that must be atomic (e.g. invoice creation with numbering) go through a Postgres RPC function (see `create_invoice` in `supabase/migrations/`), not a sequence of separate client-side inserts.

## 4. Styling / Design Tokens

- Primary color: `#432DD7`. Use the existing CSS variable / Tailwind token for it — never hardcode the hex value in a component.
- Type scale: H1 48 / H2 36 / H3 30 / Body 16 / Small 14 / Caption 12. Use the existing typography utility classes; don't invent one-off font sizes.
- Design language: clean, professional, modern blue-and-white. Mobile-first responsive layout.
- No inline `style={{ ... }}` for anything Tailwind can express. No arbitrary magic-number Tailwind values (`w-[123px]`) when a token/spacing scale value already covers it.

## 5. Components

- Check `components/ui/*` and `components/shared/*` before creating anything new — most primitives (button, input, dialog, badge, table, card, etc.) already exist.
- Follow the existing `cva` variant pattern for new component variants rather than adding ad-hoc conditional class strings.
- Forms follow the existing pattern: Zod schema → `useForm` with `zodResolver` → Server Action on submit. Look at `components/customers/customer-form.tsx` or `components/invoices/invoice-form.tsx` as the reference implementation before writing a new form.

## 6. TypeScript

- `strict` mode is on. Never use `any`. If a type is genuinely unknown, use `unknown` and narrow it, or define a proper type in `lib/types.ts`.
- Use the plain union types in `lib/types.ts` (`Role`, `CustomerType`, `InvoiceType`, `PaymentStatus`, `PaymentMethod`, `GstMode`, `InvoiceItemType`) instead of inventing new string literal unions for the same concepts.
- Use the `Database` type from `lib/supabase/database.types.ts` as the generic on every Supabase client (`createClient<Database>()`), so queries stay typed. If the schema changes, regenerate this file (`npx supabase gen types typescript`) rather than hand-patching it out of sync with the real database.

## 7. Accessibility

- Use semantic HTML elements (`button`, `nav`, `table`, `label`, etc.) over generic `div`/`span` with click handlers.
- Every interactive element must be keyboard-reachable and show a visible focus state.
- Form inputs need an associated `label` (or `aria-label`). Icon-only buttons need `aria-label`.
- Images need meaningful `alt` text (or `alt=""` if purely decorative).

## 8. Package Installation Policy

- **Never install, upgrade, or remove an npm package without explicit approval first.** Propose the package, the version, and why it's needed, and wait for a yes before running `npm install`.
- Prefer solving a problem with what's already in `package.json` (Supabase SDKs, React Hook Form, Zod, Tailwind, shadcn primitives, `decimal.js`) before reaching for a new dependency.

## 9. Hard Rules

- Never write to `.env`, `.env.local`, or any file containing credentials. If a value needs to change there, tell the user exactly what to change and let them do it.
- Never commit or print Supabase service-role keys, anon keys, or any other secret in code, logs, or commit messages.
- Never use the admin/service-role Supabase client to bypass RLS for a shortcut. If RLS is blocking something that should be allowed, fix the policy — don't route around it.
- Never touch the exported function signatures in `lib/auth/session.ts` / `lib/auth/guards.ts` without checking every caller — most of the app depends on them staying stable.
- Never do currency/tax/total math with native `number`. Always go through `lib/money.ts` / `lib/invoice/calculations.ts`.
- Never write a new raw SQL migration without the user reviewing it before it's run against the live database — the SQL editor run is a manual, user-driven step.
- Never delete files directly when working through the device bridge — it can't delete. Move anything meant for removal into `_to_delete/` and tell the user, so they can delete it themselves.
- If unsure whether a change is safe, stop and ask rather than guessing.

## 10. AI Behavior

1. Read the existing code and follow its patterns before writing anything new — this codebase has established conventions for data fetching, forms, and realtime; match them.
2. Ask before installing, removing, or upgrading any package.
3. Never use `any`; keep `strict` TypeScript passing.
4. Follow existing folder structure and naming conventions (`server/actions/*`, `lib/supabase/*`, `components/ui/*`, snake_case at the DB boundary, camelCase in components).
5. Don't invent APIs — verify against `node_modules/next/dist/docs/`, the Supabase SDK types, or existing working code in this repo.
6. Keep changes minimal and scoped to what was asked; don't refactor unrelated code in the same pass.
7. Stop and ask if a requirement is ambiguous, if a change would touch secrets, or if a migration needs to run against the live database.
8. Verify before declaring something done — read the diff, check types, and where possible run the relevant page/flow rather than assuming it works.
