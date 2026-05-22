# Faqtura — Application Design Spec

**Date:** 2026-05-22
**Status:** Approved — ready for implementation plan
**Scope:** Convert the existing Faqtura design system + static React prototype into a production web application.

## Context

Currently the repo contains:
- A complete design system (`colors_and_type.css`, `preview/*.html`, brand voice docs).
- An interactive React prototype in `ui_kits/web_app/` running via Babel CDN, fixed-width 1280px, mocked data in `data.js`.

The product is **Faqtura**, a Swedish invoicing SaaS for freelancers and small teams (1–10 people). The voice is calm, direct, bilingual where natural (English UI chrome, Swedish product terms like `Faktura skickad`, `Betald`, `Förfallen`).

This spec defines the architecture, tooling, and roadmap to ship a real, responsive, multi-tenant SaaS web application.

## Decisions (from brainstorming)

| Decision | Choice |
|---|---|
| Platforms | Responsive web only (no native mobile/desktop apps) |
| Backend | Supabase (Postgres + Auth + Storage + Edge Functions) |
| MVP scope | Auth + clients + invoices (full CRUD, PDF, email, mark paid) + Overview dashboard |
| Frontend | Next.js 15 (App Router) + React 19 + TypeScript + Tailwind v4 |
| Component library | **No shadcn**. Port existing `ui.jsx` to TS; use Radix UI headless primitives only where needed (Dialog, Popover, Combobox, Toast) |
| PDF | `@react-pdf/renderer` in Supabase Edge Function |
| Email | Resend + React Email |
| i18n | `next-intl`, EN + SV from day one |
| Money | `bigint` cents (öre for SEK) |
| Primary market | Sweden (SEK default, sv-SE locale, Swedish VAT rules) |
| Email confirmation | **Off in MVP** (must be re-enabled before production with real customers) |

## Repository structure

Single Next.js app, not a monorepo. Feature-based colocation under `src/features/`.

```
FaqturaNext/
├─ app/                              # Next.js routes (thin layer)
│  ├─ (marketing)/                   # public pages
│  ├─ (auth)/                        # login, signup
│  ├─ (app)/                         # authenticated zone
│  │  ├─ layout.tsx                  # AppShell (sidebar/topbar)
│  │  ├─ overview/page.tsx
│  │  ├─ invoices/{page,new,[id]}/
│  │  ├─ clients/{page,[id]}/
│  │  └─ settings/page.tsx
│  ├─ api/webhooks/resend/route.ts
│  ├─ globals.css                    # imports tokens.css + Tailwind
│  └─ layout.tsx                     # root layout, fonts, i18n provider
│
├─ src/
│  ├─ features/                      # feature-based
│  │  ├─ invoices/{components,hooks,actions.ts,queries.ts,schema.ts,vat.ts}
│  │  ├─ clients/{components,hooks,actions.ts,queries.ts,schema.ts}
│  │  ├─ overview/{components,queries.ts}
│  │  └─ auth/{components,actions.ts}
│  ├─ components/
│  │  ├─ ui/                         # primitives ported from ui.jsx
│  │  ├─ chrome/                     # Sidebar, TopBar, AppShell
│  │  └─ marketing/
│  ├─ lib/
│  │  ├─ supabase/{server,client,middleware,types}.ts
│  │  ├─ pdf/                        # @react-pdf/renderer templates
│  │  ├─ email/                      # React Email templates + Resend
│  │  ├─ money.ts
│  │  ├─ dates.ts
│  │  └─ cn.ts
│  ├─ i18n/{config.ts,messages/{en,sv}.json,request.ts}
│  └─ styles/{tokens.css,fonts.ts}
│
├─ supabase/
│  ├─ migrations/
│  ├─ functions/{generate-invoice-pdf,send-payment-reminder}/
│  ├─ seed.sql
│  └─ config.toml
│
├─ tests/{e2e,unit}/
├─ docs/{design-system,legacy-prototype,superpowers/specs}/
├─ public/
├─ assets/                            # brand SVGs (existing)
├─ .env.example
├─ biome.json
├─ playwright.config.ts
├─ vitest.config.ts
├─ next.config.ts
├─ tailwind.config.ts
├─ tsconfig.json
└─ package.json
```

**Rules:**
- `app/` stays thin — routes delegate to `src/`.
- Each feature owns its components, hooks, server actions, queries, schemas, and pure logic.
- `src/components/ui/` contains only primitives (no business logic).
- Old prototype moves to `docs/legacy-prototype/` as living reference.
- `colors_and_type.css` moves to `src/styles/tokens.css`.

## Database schema (Supabase / Postgres)

Multi-tenant via `organizations` + `memberships`. All tables isolated by `organization_id` with RLS.

### Tables

**`organizations`**
- `id uuid pk`, `name`, `org_number`, `vat_number`, `address jsonb`
- `iban`, `bankgiro`, `plusgiro`, `swish_number`
- `default_vat_rate numeric(5,2) default 25`
- `default_payment_terms_days int default 30`
- `locale text default 'sv-SE'`, `currency text default 'SEK'`
- `invoice_number_template text default 'INV-{YYYY}-{NNNN}'`
- `logo_url`, `created_at`

**`memberships`** — `(organization_id, user_id)` pk; `role in ('owner','admin','member')`.

**`clients`** — `organization_id`, `name`, `email`, `org_number`, `vat_number`, `address jsonb`, `notes`, `archived_at`.

**`invoices`**
- `organization_id`, `client_id`, `number unique per org`
- `status invoice_status enum ('draft','sent','paid','overdue','cancelled')`
- `issued_at`, `due_at`, `paid_at`, `sent_at`
- `currency`, `subtotal_cents bigint`, `vat_cents`, `total_cents`
- `notes`, `pdf_path`, `reminder_count`, `last_reminder_at`

**`invoice_line_items`** — `invoice_id`, `position`, `description`, `quantity numeric(12,3)`, `unit`, `unit_price_cents`, `vat_rate`, `amount_cents`.

**`invoice_events`** — append-only timeline; `type invoice_event_type enum ('created','sent','viewed','reminder_sent','marked_paid','cancelled','note_added')`, `payload jsonb`.

**`invoice_number_sequences`** — `(organization_id, year)` pk, `last_value`. Used by `next_invoice_number(org_id)` RPC (atomic).

### Constraints and automation

- All money columns: `bigint` cents (öre for SEK). Single source of truth.
- Triggers: `updated_at`, `recompute_invoice_totals` on `invoice_line_items` writes.
- `lock_sent_invoices` trigger: sent/paid invoices cannot be edited (only status transitions to `paid`/`cancelled`/`overdue`).
- `pg_cron` jobs:
  - daily 03:00 UTC: `mark-overdue` (sets `status='overdue'` where `sent` and `due_at < current_date`).
  - daily 09:00 in org TZ: `send-overdue-reminders` via Edge Function.

### RLS

Every table has policies:
- SELECT/INSERT/UPDATE/DELETE allowed where `organization_id in (select organization_id from memberships where user_id = auth.uid())`.
- `invoice_line_items` and `invoice_events` join through `invoices` for the check.
- Service role bypasses RLS (used by Edge Functions only).

### Swedish VAT rules

- Standard rates: 25%, 12%, 6%, 0%. UI dropdown defaults to 25%.
- VAT rounded per line item to whole öre (`Math.round`) — Skatteverket requirement.
- Three-level validation: client (zod), server action (zod), DB (constraints + RLS).

## Auth and tenancy

**Provider:** Supabase Auth via `@supabase/ssr` for Next.js App Router.

**Files:**
- `src/lib/supabase/server.ts` — `createServerClient()` for RSC + server actions.
- `src/lib/supabase/client.ts` — `createBrowserClient()` for realtime/optimistic UI.
- `src/lib/supabase/middleware.ts` — session refresh on every request.
- `middleware.ts` at repo root — redirects unauthenticated requests on `(app)` routes to `/login?next=<path>`.

**Onboarding flow (no email confirmation in MVP):**
```
signup → /onboarding → create organization → /overview
```
Onboarding atomically creates `organizations` row and `memberships` (role='owner') via `create_organization(...)` RPC.

**`requireUser()`** helper for server actions: returns `{ user, organizationId, role }` from active membership (stored in `active_org_id` cookie when user has multiple orgs); throws 401 otherwise.

**Roles:**
- `owner`: full access including delete org and transfer ownership.
- `admin`: all except delete/transfer.
- `member`: create/send invoices; no org settings, no invites.

Role checks live in server actions; RLS handles org isolation.

**Not in MVP:** email confirmation, BankID, SSO, 2FA, full admin audit log.

## Data flow

**Principle:** server-first. Read via Server Components and `queries.ts`; write via Server Actions in `actions.ts`. Client-side data fetching only for optimistic UI, infinite scroll, or realtime.

**Layers per feature** (example: invoices):
1. `schema.ts` — zod schemas, single source of types.
2. `queries.ts` — read functions, marked `'server-only'`, called from RSC.
3. `actions.ts` — server actions for mutations, `requireUser()` + zod parse + RPC call.
4. `hooks/` — client mutations (TanStack Query or React 19 `useOptimistic`) only where needed.

**Mutations write through Postgres RPCs** for transactional guarantees (e.g. `create_invoice` creates row + line items + reserves number from sequence atomically). Each mutation appends an `invoice_events` row.

**Cache invalidation:**
- `revalidatePath('/invoices')` after mutations.
- `unstable_cache` with `org-${id}` tag for heavy aggregates (Overview); `revalidateTag` after mutations.
- Never `cache: 'force-cache'` for user data.

**Optimistic UI** only where it genuinely improves feel:
- Mark as paid → instant chip change, server action in background.
- Send reminder → optimistic timeline entry.
- Creating invoice → NOT optimistic (must wait for sequence-issued number).

**Error handling:** server actions throw or return `{ error, fieldErrors }` for form actions (`useActionState`). Client catches in `useMutation.onError` → toast. Server errors logged via `console.error` in MVP; Sentry in phase 2.

## PDF generation

**Template:** `src/lib/pdf/InvoiceDocument.tsx` (React-PDF component) with brand fonts (Hanken Grotesk, IBM Plex Mono) loaded from `src/lib/pdf/fonts/`.

**Execution:** Supabase Edge Function `generate-invoice-pdf`:
1. Fetch invoice + line_items + client + organization (service role).
2. Render `<InvoiceDocument data={...} />` to buffer.
3. Upload to Storage: `invoices/<org_id>/<invoice_id>.pdf`.
4. Update `invoices.pdf_path`.
5. Return signed URL (7-day expiry).

**Triggers:** `sendInvoice(id)` server action calls `ensurePdf(id)` before email send; preview route `/invoices/[id]/preview` renders inline via `<PDFViewer>` for dev/UX.

**Versioning:** invoices are immutable after `sent`. DB trigger blocks edits. Generated PDF is the canonical document.

## Email

**Provider:** Resend. Templates in `src/lib/email/templates/` as React Email components.

**Templates (MVP):**
- `InvoiceSentEmail.tsx`
- `PaymentReminderEmail.tsx`
- `InvoicePaidReceipt.tsx`
- `WelcomeEmail.tsx`

All bilingual: accept `locale`, pull strings from `src/i18n/messages/<locale>.json`.

**Sending:** `src/lib/email/resend.ts` exposes `sendInvoiceEmail(invoiceId)`. Attaches the PDF from Storage. From address: `faktura@faqtura.app` in MVP; per-org custom domains in phase 2.

**Webhook:** `app/api/webhooks/resend/route.ts` consumes `email.delivered`, `email.bounced`, `email.opened`; writes to `invoice_events`. Signature validated via `svix`.

## Background jobs

**Stack:** `pg_cron` + Edge Functions + lightweight `job_queue` table.

| Job | Schedule | Action |
|---|---|---|
| `mark-overdue` | daily 03:00 UTC | SQL: flip `sent` → `overdue` where past due |
| `send-overdue-reminders` | daily 09:00 org-local TZ | Edge Fn: for overdue invoices with `reminder_count<3` and ≥7 days since last, send reminder email |
| `purge-expired-pdfs` | weekly | clean signed URL cache (if used) |

Job processor (`process-jobs` Edge Function) runs every 5 minutes via pg_cron, pulls from `job_queue` with retry and idempotency.

## Responsive design

Mobile-first. Three breakpoints aligned with Tailwind:

| Range | Behavior |
|---|---|
| `< 768px` (mobile) | Bottom tab bar; lists → cards (no tables); drawer/detail = full-screen routes; single-column forms |
| `768–1024px` (tablet, `md:`) | Collapsible icon-only sidebar; tables return; slide-in drawer 540px |
| `≥ 1024px` (desktop, `lg:`) | Full 240px sidebar; multi-column layouts; hover states |

**Per-screen adaptations:**
- **Overview:** mobile = vertical stat-cards + card list; desktop = 4-col grid + 2-col split.
- **Invoices list:** mobile = invoice cards, horizontal-scroll filter pills, sticky search; desktop = table with sticky header.
- **Invoice editor:** mobile = full-screen multi-step (`/invoices/new`: client → items → review); desktop = 720px slide-in drawer.
- **Invoice detail:** mobile = full-screen with expandable timeline; desktop = split (preview / timeline+actions).

**Touch targets:** `min-h-11 min-w-11` (44×44px) on all interactive elements.

## Accessibility

Target: WCAG 2.2 AA.

- Contrast: validate `--warn` (#C8881F) against white; downgrade to bold/large only if needed.
- Keyboard navigation everywhere; focus-visible uses `--brand` orange, not default blue.
- Radix primitives provide ARIA for complex widgets; custom components add `aria-label`, `aria-describedby`.
- Money values use `aria-label` with full spoken form ("4820 kronor").
- Status chips combine color + text (never color alone).
- `prefers-reduced-motion` disables drawer slide and toast animations.
- `eslint-plugin-jsx-a11y` in CI; manual axe DevTools pass before each release.

## Testing

Pyramid:

**Unit (Vitest)** — pure functions in `src/lib/` and `src/features/*/vat.ts`. Target >90% coverage on financial math. Covers VAT, ROT/RUT (phase 2), money format/parse, due-date and overdue logic.

**Component (Vitest + Testing Library)** — forms and complex interactions:
- `InvoiceEditor`: add/remove line items, live VAT recompute.
- `ClientPicker`: search, select, create-inline.
- Form error states with zod validation.

**E2E (Playwright)** — critical paths:
1. signup → onboarding → create org → overview lands.
2. create client → create invoice → send → mark paid.
3. overdue invoice → send reminder → timeline entry visible.
4. PDF downloads and is non-empty (smoke).
5. multi-org switcher works; RLS isolates data.

Playwright runs against local Supabase (`supabase start`) with seed data. CI runs on every PR.

**Not tested:** UI snapshots (brittle), external services (Resend mocked), Supabase Auth internals.

## Tooling

| Tool | Purpose |
|---|---|
| pnpm | Package manager |
| Biome | Lint + format (replaces ESLint + Prettier) |
| TypeScript | `strict: true`, `noUncheckedIndexedAccess: true` |
| Vitest | Unit + component tests |
| Playwright | E2E |
| Supabase CLI | Local stack via `supabase start` |
| GitHub Actions | CI: typecheck, lint, unit, e2e, build on PR |
| Vercel | Hosting + preview deploys |
| Sentry | Error tracking (phase 2) |
| PostHog | Product analytics (phase 2) |

## Localization (sv-SE specifics)

- Numbers: `1 234 567,89` (non-breaking space thousands, comma decimal) via `Intl.NumberFormat('sv-SE')`.
- Dates: `2026-05-22` (ISO format — Swedish convention).
- Currency: `1 234,50 kr` via `Intl.NumberFormat('sv-SE', {style:'currency', currency:'SEK'})`.
- Sentence case everywhere (brand rule).
- Status chips remain in Swedish (`Faktura skickad`, `Betald`, `Förfallen`, `Utkast`) even on EN UI.

## Security

- RLS on every table — non-negotiable.
- CSRF: Next.js server actions have built-in origin check.
- Rate limiting: 50 emails/hour/org on send-invoice; signup throttled. Via Vercel Edge Middleware or Upstash.
- All secrets in Vercel env vars / Supabase secrets. `.env.example` has keys, no values.
- CSP headers via `next.config.ts`.
- GDPR: data export and delete-account flow in phase 2.

## Roadmap

**Phase 0 — Foundation (1–2 weeks)**
- Next.js 15 + Tailwind v4 wired to `tokens.css`.
- Supabase project + local CLI.
- Port `ui.jsx` primitives to TS in `src/components/ui/`.
- App shell (Sidebar + TopBar, responsive).
- `next-intl` setup with en + sv.
- CI pipeline.

**Phase 1 — Auth + Tenancy (1 week)**
- Supabase Auth, login/signup pages.
- Organizations + memberships + RLS.
- Onboarding flow + `requireUser()`.

**Phase 2 — Clients CRUD (3–5 days)**
- Clients list, detail, create/edit, archive.
- Server actions + queries + zod.
- Mobile + desktop layouts.

**Phase 3 — Invoices Core (2 weeks)**
- Invoices list with filter pills + search.
- Invoice editor (mobile multi-step / desktop drawer).
- Invoice detail with timeline.
- `next_invoice_number` RPC.
- Swedish VAT calculations.
- Status transitions with DB locks.

**Phase 4 — PDF + Email (1 week)**
- `@react-pdf/renderer` branded template.
- Edge Function `generate-invoice-pdf`.
- Storage integration.
- Resend + React Email templates (EN + SV).
- Resend webhook for delivery events.

**Phase 5 — Overview Dashboard (3–5 days)**
- Aggregation queries (outstanding, paid this month, avg days to pay).
- Stat cards, recent activity, due-this-week.
- `unstable_cache` for heavy aggregates.

**Phase 6 — Reminders + Polish (1 week)**
- pg_cron jobs (mark-overdue, send-reminders).
- Reminder configuration per org.
- E2E suite, a11y audit, production deploy.

**Total MVP:** ~6–8 weeks at one full-time developer.

**Out of scope (phase 2):** ROT/RUT deductions, expenses, PEPPOL/e-faktura, BankID, Swish payments in invoice, automatic payment matching, billing of Faqtura itself (Stripe), full admin audit log, custom email domains per org.

## Open risks

1. **Email confirmation is off** in MVP. Before serving real customers, this must be re-enabled and Resend custom domain configured, or spam-rate and phishing-signup risk is real.
2. **Edge Function cold starts** may add latency to first PDF generation per region. Acceptable in MVP; consider warming pings in phase 2 if reported.
3. **`@react-pdf/renderer` font embedding** for Hanken Grotesk and IBM Plex Mono needs licensing review — both are open fonts, should be fine, but verify the SIL OFL terms before shipping.
4. **pg_cron job ownership** — Supabase requires the cron extension to be enabled via dashboard; document this in setup.
5. **Local prototype currency** in `data.js` is EUR. All new code must default to SEK; do not copy currency literals from the prototype.

## Acceptance criteria for MVP

- A new user can sign up, create an organization, create a client, create an invoice with line items and Swedish VAT, generate a PDF, send it by email, see it in the timeline, mark it paid, and view it on the Overview dashboard.
- All flows work on mobile (375px wide) and desktop (1440px wide).
- All financial math is covered by unit tests.
- The 5 critical E2E paths pass in CI.
- WCAG 2.2 AA contrast and keyboard navigation pass automated checks.
- RLS prevents one organization from reading or writing another's data (verified by E2E test).
