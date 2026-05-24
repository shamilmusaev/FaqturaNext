# AGENTS.md

Guidance for AI agents (Codex, Claude, others) working on the Faqtura codebase.

## Project context

Faqtura is a Swedish invoicing SaaS for freelancers and small teams (1–10 people). Primary market: Sweden. Default currency: SEK. Default locale: sv-SE.

Tech stack: Next.js 15 (App Router) + React 19 + TypeScript (strict) + Tailwind v4 + Supabase (Postgres + Auth + Storage) + next-intl (EN + SV). UI primitives are hand-built — no shadcn. Radix used only for headless a11y (Dialog, etc.). Money is `bigint` cents (öre for SEK).

Design spec: `docs/superpowers/specs/2026-05-22-faqtura-app-design.md`
Implementation plan: `docs/superpowers/plans/2026-05-22-phase-0-1-foundation-auth.md`

## Repository layout

- `app/` — Next.js routes; kept thin. Route groups: `(marketing)`, `(auth)`, `(app)`.
- `src/features/<domain>/` — feature-based colocation: components, hooks, server actions, queries, schemas, pure logic.
- `src/components/ui/` — design-system primitives (Button, Chip, Card, Input, MoneyInput, Avatar, Dialog, Toaster, icons). No business logic.
- `src/components/chrome/` — AppShell, Sidebar, TopBar, BottomTabs, LocaleSwitcher, LogoutButton.
- `src/lib/` — infrastructure: `supabase/{server,client,middleware}`, `auth.ts`, `money.ts`, `dates.ts`, `cn.ts`.
- `src/i18n/` — next-intl config and `messages/{en,sv}.json`.
- `src/styles/tokens.css` — brand tokens (consumed by Tailwind v4 via `@theme` in `app/globals.css`).
- `supabase/migrations/` — SQL migrations, applied via `supabase db reset` locally.
- `tests/unit/` — Vitest. `tests/e2e/` — Playwright.

## Review guidelines

When reviewing pull requests, flag P0 (correctness, security) and P1 (significant design issues) only. Skip stylistic nits already enforced by Biome.

### Tenancy and security (P0)
- Every Supabase table access must rely on RLS — flag any use of `service_role` keys outside `supabase/functions/` (Edge Functions).
- Every server action that mutates data must call `requireUser()` from `@/lib/auth` before touching the database. Reads in Server Components should also call it unless the page is intentionally public.
- Role checks (`owner` / `admin` / `member`) live in server actions, not in client components. Client-side role gates are advisory UX only.
- `auth.uid()` is the source of identity in DB functions — never trust user-supplied user/org IDs in RPC arguments.
- Cookies set by app code must be `httpOnly`, `sameSite: 'lax'`, `path: '/'` unless there's a specific reason otherwise.

### Money (P0)
- Money is stored and passed around as `bigint` cents (öre for SEK). Never `number` for sums, never `numeric`/`float` for running totals.
- Formatting goes through `formatMoney(cents, currency, locale)` in `src/lib/money.ts`. Never hard-code `kr`, `€`, decimal separators, or thousands separators.
- VAT calculations round per line item to whole öre (Skatteverket requirement). Flag any cross-line rounding.
- Default currency is `SEK`, default VAT rate is 25%. Other Swedish rates: 12%, 6%, 0%. Reject custom rates unless the spec changes.

### Invoices (P0)
- Invoices become immutable after `status='sent'`. Edits should be blocked by DB trigger + RLS, not just by UI.
- Invoice number generation must go through the `next_invoice_number` RPC (or equivalent atomic sequence). Flag any client-side or non-transactional number assignment.
- Status transitions: `draft → sent → paid|cancelled|overdue`. Flag illegal transitions.

### Internationalization (P0 for missing keys, P1 for hard-coded text)
- All user-visible strings must come from `src/i18n/messages/en.json` and `src/i18n/messages/sv.json` via `useTranslations()` or `getTranslations()`. Flag any inline EN/SV strings in `app/` or `src/components/` (the marketing landing is currently an exception — pre-i18n).
- Every new key must exist in BOTH `en.json` and `sv.json`. Flag any one-sided additions.
- Swedish status terms (`Faktura skickad`, `Betald`, `Förfallen`, `Utkast`, `Avbruten`) stay in Swedish even on EN UI — by brand decision.

### Server / client boundaries (P1)
- `src/lib/supabase/server.ts` and `src/lib/auth.ts` must keep `import 'server-only'` at top.
- Files marked `'use client'` must not import `server-only` modules.
- Server actions live in `actions.ts` files with `'use server'` directive. Don't mix server actions and pure utilities in the same file.
- `redirect()` calls in server actions must not be inside `try/catch` that swallows errors (Next.js throws internally).

### Data flow (P1)
- Reads from Server Components go through `queries.ts` in the relevant feature.
- Writes go through server actions in `actions.ts`. Never call Supabase mutations from client components directly.
- Use `revalidatePath` / `revalidateTag` after mutations. Don't rely on `cache: 'no-store'` for user-data correctness — use explicit invalidation.
- Optimistic UI is reserved for cases where it genuinely improves feel (mark-paid, send-reminder). Creating an invoice is NOT optimistic — number comes from DB sequence.

### Validation (P1)
- Three layers: client (`react-hook-form` + zod), server action (`zod.parse`), DB (constraints + RLS). All three required for user input.
- Single zod schema shared between client and server. Flag duplicate schemas.

### Clients (P1)
- Hard delete is forbidden — always set `archived_at` instead.
- Searching is by `name` or `email` only. Don't add full-text search to other columns without spec update.
- `address` is `jsonb` with `{ street?, postal?, city?, country? }`; never store the address as a single text blob.
- Client detail page must call `getClient(id)` (which scopes by `organization_id`), not raw Supabase queries.
- New listings must keep org-scoping via `requireUser()` then `.eq('organization_id', organizationId)` (RLS is the safety net, not the primary check).

### Accessibility (P1)
- Touch targets ≥ 44×44px (`min-h-11 min-w-11`).
- Status info conveyed by color must also have text or `aria-label`.
- Money values that are read by screen readers should have a spoken-form `aria-label` (`aria-label="4820 kronor"`).
- Focus styles use `--brand` (orange), not default browser blue.
- Custom interactive components need explicit `role` and keyboard handlers, or should be built on Radix primitives.

### Code organization (P1)
- Files in `src/features/<x>/` shouldn't import from other features. Cross-feature reuse goes through `src/components/`, `src/lib/`, or `src/i18n/`.
- `src/components/ui/` primitives must be free of business logic and feature imports.
- New files larger than ~250 lines need a justification — prefer splitting by responsibility.

### Things NOT to flag
- `process.env.NEXT_PUBLIC_SUPABASE_URL!` non-null assertions in `src/lib/supabase/*` — accepted under Biome `noNonNullAssertion: warn`.
- Hard-coded brand strings ("Faqtura", "INV-") — brand identity, not i18n content.
- Missing email confirmation in MVP — intentional per spec (must be re-enabled before production).
- The `experimental.typedRoutes` deprecation warning in `next.config.ts` — known, planned cleanup.
- `as Route` casts on `next/link` href — required by typedRoutes for string literals.

## Tests

- Pure logic (`money.ts`, `dates.ts`, VAT) requires unit tests in `tests/unit/`.
- Forms and complex client components have RTL tests in `tests/unit/`.
- Critical user paths (signup, create invoice, mark paid, send reminder) have Playwright e2e in `tests/e2e/`.
- Don't mock Supabase in e2e — point at the local stack via `supabase start`.
- Snapshot tests are not used in this project.

## Commits and PRs

- Commits use Conventional Commits (`feat:`, `fix:`, `chore:`, `test:`, `ci:`, `docs:`, `feat(scope):`).
- One concern per commit. Mechanical refactors go in their own commit.
- No Claude / Codex / co-author trailers in commit messages or PR descriptions.
- PR descriptions: summary, what changed, how to verify (commands + manual steps).
