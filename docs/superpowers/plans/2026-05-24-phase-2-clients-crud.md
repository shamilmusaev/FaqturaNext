# Faqtura --- Phase 2 Implementation Plan (Clients CRUD)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full clients CRUD surface --- list with search and archive filter, create form, detail view with edit + archive, mobile and desktop layouts --- all backed by typed Supabase queries and server actions with RLS isolation.

**Architecture:** Feature lives in `src/features/clients/`. Reads via `queries.ts` from Server Components, writes via `actions.ts` server actions. Single form component reused by `/clients/new` and `/clients/[id]/edit`. Zod schema is the source of truth for types and validation on both client and server.

**Tech Stack:** Same as Phase 0/1 --- Next.js 15 (App Router), React 19, TypeScript strict, Tailwind v4, Supabase, next-intl, zod, Biome, Vitest.

**Reference:**
- [Design spec](../specs/2026-05-22-faqtura-app-design.md) --- clients schema, RLS, feature layout
- [Phase 0/1 plan](2026-05-22-phase-0-1-foundation-auth.md) --- established patterns

**Prerequisites:** Phase 0 + Phase 1 merged or branch-stacked on top. Docker for `supabase start` locally.

---

## Decisions locked for Phase 2

| Question | Decision |
|---|---|
| Required client fields | `name` only --- email and rest optional |
| Mobile create form | Single page (form is short --- name + 5 optional fields) |
| Client list filters | Search by `name` or `email`; toggle to include archived |
| Client detail in Phase 2 | Info card + Edit + Archive actions. Linked invoices list deferred to Phase 3. |
| Soft delete | Yes via `archived_at` per spec --- never hard delete |
| Address shape | `jsonb` with `{ street?, postal?, city?, country? }`; UI presents 4 separate fields |
| Pagination | Defer to Phase 3 when invoices arrive. List shows up to 500 clients sorted by `name`. |
| Empty state | When no clients: friendly hero with "Create your first client" CTA |

---

## Task list

### Task 2.1: Clients migration (table + indexes)

**Files:** Create `supabase/migrations/0004_clients.sql`.

- [ ] **Step 1:** Write SQL
```sql
create table clients (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name            text not null,
  email           text,
  org_number      text,
  vat_number      text,
  address         jsonb,
  notes           text,
  archived_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index clients_org_active_idx
  on clients (organization_id, name)
  where archived_at is null;

create index clients_org_all_idx
  on clients (organization_id, name);

create trigger clients_updated_at
  before update on clients
  for each row execute function set_updated_at();
```

- [ ] **Step 2:** Apply if Docker is running (`supabase db reset`). Otherwise skip --- file is the source of truth.

- [ ] **Step 3:** Commit
```
git add supabase/migrations/0004_clients.sql
git commit -m "feat(db): clients table with org-scoped indexes"
```

---

### Task 2.2: Clients RLS

**Files:** Create `supabase/migrations/0005_clients_rls.sql`.

- [ ] **Step 1:** Write SQL
```sql
alter table clients enable row level security;

create policy "members read org clients"
  on clients for select
  using (organization_id in (
    select organization_id from memberships where user_id = auth.uid()
  ));

create policy "members write org clients"
  on clients for insert with check (
    organization_id in (
      select organization_id from memberships where user_id = auth.uid()
    )
  );

create policy "members update org clients"
  on clients for update
  using (organization_id in (
    select organization_id from memberships where user_id = auth.uid()
  ));

create policy "owners delete org clients"
  on clients for delete
  using (organization_id in (
    select organization_id from memberships
    where user_id = auth.uid() and role in ('owner','admin')
  ));
```

- [ ] **Step 2:** Apply (or skip per Docker availability) and commit
```
git commit -m "feat(db): RLS policies for clients"
```

---

### Task 2.3: Regenerate Supabase types

**Files:** Modify `src/lib/supabase/database.types.ts`.

- [ ] **Step 1:** If `supabase start` is running, run `pnpm db:types`. Otherwise add `clients` table manually to the `Database` type. Use this shape:

```ts
clients: {
  Row: {
    id: string
    organization_id: string
    name: string
    email: string | null
    org_number: string | null
    vat_number: string | null
    address: { street?: string; postal?: string; city?: string; country?: string } | null
    notes: string | null
    archived_at: string | null
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    organization_id: string
    name: string
    email?: string | null
    org_number?: string | null
    vat_number?: string | null
    address?: { street?: string; postal?: string; city?: string; country?: string } | null
    notes?: string | null
    archived_at?: string | null
    created_at?: string
    updated_at?: string
  }
  Update: Partial<Database['public']['Tables']['clients']['Insert']>
  Relationships: [
    {
      foreignKeyName: 'clients_organization_id_fkey'
      columns: ['organization_id']
      isOneToOne: false
      referencedRelation: 'organizations'
      referencedColumns: ['id']
    },
  ]
}
```

Add it inside `public.Tables` next to `organizations` and `memberships`.

- [ ] **Step 2:** Run `pnpm typecheck`. Must be clean.

- [ ] **Step 3:** Commit
```
git commit -m "chore(supabase): extend Database type with clients table"
```

---

### Task 2.4: Clients zod schema

**Files:** Create `src/features/clients/schema.ts` and `tests/unit/clients-schema.test.ts`.

- [ ] **Step 1:** Write failing test
```ts
import { describe, expect, it } from 'vitest'
import { ClientInputSchema } from '@/features/clients/schema'

describe('ClientInputSchema', () => {
  it('requires name', () => {
    expect(ClientInputSchema.safeParse({ name: '' }).success).toBe(false)
    expect(ClientInputSchema.safeParse({ name: 'Acme AB' }).success).toBe(true)
  })
  it('email is optional but must be valid when present', () => {
    expect(ClientInputSchema.safeParse({ name: 'A', email: '' }).success).toBe(true)
    expect(ClientInputSchema.safeParse({ name: 'A', email: 'not-an-email' }).success).toBe(false)
    expect(ClientInputSchema.safeParse({ name: 'A', email: 'a@b.se' }).success).toBe(true)
  })
  it('accepts nested address with optional parts', () => {
    expect(
      ClientInputSchema.safeParse({
        name: 'Acme AB',
        address: { street: 'Storgatan 1', city: 'Stockholm' },
      }).success,
    ).toBe(true)
  })
  it('caps name length', () => {
    expect(ClientInputSchema.safeParse({ name: 'x'.repeat(201) }).success).toBe(false)
  })
})
```

- [ ] **Step 2:** `pnpm test clients-schema` --- expect FAIL (module missing).

- [ ] **Step 3:** Implement `src/features/clients/schema.ts`
```ts
import { z } from 'zod'

export const AddressSchema = z.object({
  street: z.string().max(200).optional(),
  postal: z.string().max(20).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
})

const blankToUndefined = (v: unknown) => (v === '' ? undefined : v)

export const ClientInputSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  email: z.preprocess(blankToUndefined, z.string().email().max(200).optional()),
  org_number: z.preprocess(blankToUndefined, z.string().max(50).optional()),
  vat_number: z.preprocess(blankToUndefined, z.string().max(50).optional()),
  address: AddressSchema.optional(),
  notes: z.preprocess(blankToUndefined, z.string().max(2000).optional()),
})

export type ClientInput = z.infer<typeof ClientInputSchema>
```

- [ ] **Step 4:** `pnpm test clients-schema` --- expect PASS (4/4).

- [ ] **Step 5:** Commit
```
git commit -m "feat(clients): zod schema with email + address validation"
```

---

### Task 2.5: Clients queries (server-only)

**Files:** Create `src/features/clients/queries.ts`.

- [ ] **Step 1:** Implement
```ts
import 'server-only'
import { requireUser } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'

export type ClientRow = Database['public']['Tables']['clients']['Row']

export type ListClientsOptions = {
  search?: string
  includeArchived?: boolean
}

export async function listClients(opts: ListClientsOptions = {}): Promise<ClientRow[]> {
  const { organizationId } = await requireUser()
  const supabase = await createServerClient()

  let q = supabase
    .from('clients')
    .select('*')
    .eq('organization_id', organizationId)
    .order('name', { ascending: true })
    .limit(500)

  if (!opts.includeArchived) q = q.is('archived_at', null)

  const search = opts.search?.trim()
  if (search) {
    const pattern = `%${search.replace(/[%_]/g, '\\$&')}%`
    q = q.or(`name.ilike.${pattern},email.ilike.${pattern}`)
  }

  const { data, error } = await q
  if (error) throw error
  return data ?? []
}

export async function getClient(id: string): Promise<ClientRow | null> {
  const { organizationId } = await requireUser()
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('organization_id', organizationId)
    .maybeSingle()
  if (error) throw error
  return data
}
```

- [ ] **Step 2:** Commit
```
git commit -m "feat(clients): list and get queries with org isolation"
```

---

### Task 2.6: Clients server actions

**Files:** Create `src/features/clients/actions.ts`.

- [ ] **Step 1:** Implement
```ts
'use server'

import { requireUser } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import type { Route } from 'next'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { ClientInputSchema } from './schema'

export type ClientActionResult = { error?: string; fieldErrors?: Record<string, string> }

function flattenErrors(issues: import('zod').ZodIssue[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of issues) {
    const key = issue.path.join('.') || '_'
    if (!out[key]) out[key] = issue.message
  }
  return out
}

function readForm(formData: FormData) {
  const addressKeys = ['street', 'postal', 'city', 'country'] as const
  const address: Record<string, string | undefined> = {}
  let hasAddress = false
  for (const k of addressKeys) {
    const v = String(formData.get(`address.${k}`) ?? '')
    if (v) {
      address[k] = v
      hasAddress = true
    }
  }
  return {
    name: String(formData.get('name') ?? ''),
    email: String(formData.get('email') ?? ''),
    org_number: String(formData.get('org_number') ?? ''),
    vat_number: String(formData.get('vat_number') ?? ''),
    notes: String(formData.get('notes') ?? ''),
    address: hasAddress ? address : undefined,
  }
}

export async function createClientAction(formData: FormData): Promise<ClientActionResult> {
  const { organizationId } = await requireUser()
  const parsed = ClientInputSchema.safeParse(readForm(formData))
  if (!parsed.success) {
    return { fieldErrors: flattenErrors(parsed.error.issues) }
  }

  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('clients')
    .insert({ organization_id: organizationId, ...parsed.data })
    .select('id')
    .single()
  if (error) return { error: error.message }

  revalidatePath('/clients' as Route)
  redirect(`/clients/${data.id}` as Route)
}

export async function updateClientAction(
  id: string,
  formData: FormData,
): Promise<ClientActionResult> {
  const { organizationId } = await requireUser()
  const parsed = ClientInputSchema.safeParse(readForm(formData))
  if (!parsed.success) {
    return { fieldErrors: flattenErrors(parsed.error.issues) }
  }

  const supabase = await createServerClient()
  const { error } = await supabase
    .from('clients')
    .update(parsed.data)
    .eq('id', id)
    .eq('organization_id', organizationId)
  if (error) return { error: error.message }

  revalidatePath('/clients' as Route)
  revalidatePath(`/clients/${id}` as Route)
  redirect(`/clients/${id}` as Route)
}

export async function archiveClientAction(id: string): Promise<ClientActionResult> {
  const { organizationId } = await requireUser()
  const supabase = await createServerClient()
  const { error } = await supabase
    .from('clients')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', organizationId)
  if (error) return { error: error.message }
  revalidatePath('/clients' as Route)
  revalidatePath(`/clients/${id}` as Route)
  return {}
}

export async function unarchiveClientAction(id: string): Promise<ClientActionResult> {
  const { organizationId } = await requireUser()
  const supabase = await createServerClient()
  const { error } = await supabase
    .from('clients')
    .update({ archived_at: null })
    .eq('id', id)
    .eq('organization_id', organizationId)
  if (error) return { error: error.message }
  revalidatePath('/clients' as Route)
  revalidatePath(`/clients/${id}` as Route)
  return {}
}
```

- [ ] **Step 2:** Commit
```
git commit -m "feat(clients): create/update/archive server actions with zod validation"
```

---

### Task 2.7: Translation messages for clients

**Files:** Modify `src/i18n/messages/en.json` and `src/i18n/messages/sv.json`.

- [ ] **Step 1:** Append to BOTH files inside the root object (before the closing `}`), add a `clients` key.

`en.json`:
```json
,
  "clients": {
    "title": "Clients",
    "newClient": "New client",
    "search": "Search by name or email",
    "showArchived": "Show archived",
    "empty": "No clients yet.",
    "emptyHint": "Add your first client to get started.",
    "createCta": "Create client",
    "edit": "Edit",
    "archive": "Archive",
    "unarchive": "Restore",
    "back": "Back to clients",
    "archived": "Archived",
    "fields": {
      "name": "Name",
      "email": "Email",
      "orgNumber": "Organization number",
      "vatNumber": "VAT number",
      "notes": "Notes",
      "addressStreet": "Street",
      "addressPostal": "Postal code",
      "addressCity": "City",
      "addressCountry": "Country"
    },
    "actions": {
      "save": "Save client",
      "create": "Create client",
      "cancel": "Cancel",
      "confirmArchive": "Archive this client?",
      "confirmUnarchive": "Restore this client?"
    }
  }
```

`sv.json`:
```json
,
  "clients": {
    "title": "Kunder",
    "newClient": "Ny kund",
    "search": "Sök efter namn eller e-post",
    "showArchived": "Visa arkiverade",
    "empty": "Inga kunder ännu.",
    "emptyHint": "Lägg till din första kund för att komma igång.",
    "createCta": "Skapa kund",
    "edit": "Redigera",
    "archive": "Arkivera",
    "unarchive": "Återställ",
    "back": "Tillbaka till kunder",
    "archived": "Arkiverad",
    "fields": {
      "name": "Namn",
      "email": "E-post",
      "orgNumber": "Organisationsnummer",
      "vatNumber": "Momsregistreringsnummer",
      "notes": "Anteckningar",
      "addressStreet": "Gata",
      "addressPostal": "Postnummer",
      "addressCity": "Ort",
      "addressCountry": "Land"
    },
    "actions": {
      "save": "Spara kund",
      "create": "Skapa kund",
      "cancel": "Avbryt",
      "confirmArchive": "Arkivera den här kunden?",
      "confirmUnarchive": "Återställ den här kunden?"
    }
  }
```

- [ ] **Step 2:** Run `pnpm lint` to validate JSON, `pnpm build` to verify message loading.

- [ ] **Step 3:** Commit
```
git commit -m "i18n(clients): EN and SV strings for clients feature"
```

---

### Task 2.8: Client form (shared by create and edit)

**Files:** Create `src/features/clients/components/client-form.tsx`.

- [ ] **Step 1:** Implement
```tsx
'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import type { Route } from 'next'
import { useTranslations } from 'next-intl'
import { useActionState } from 'react'
import type { ClientActionResult } from '../actions'
import type { ClientRow } from '../queries'

interface Props {
  mode: 'create' | 'edit'
  action: (prev: ClientActionResult, formData: FormData) => Promise<ClientActionResult>
  initial?: ClientRow
  cancelHref?: Route
}

const initialState: ClientActionResult = {}

export function ClientForm({ mode, action, initial, cancelHref }: Props) {
  const t = useTranslations('clients')
  const [state, dispatch, pending] = useActionState(action, initialState)

  const err = (key: string) => state.fieldErrors?.[key]

  return (
    <form action={dispatch} className="flex flex-col gap-5 max-w-2xl">
      <Field label={t('fields.name')} error={err('name')}>
        <Input name="name" defaultValue={initial?.name ?? ''} required maxLength={200} />
      </Field>
      <Field label={t('fields.email')} error={err('email')}>
        <Input name="email" type="email" defaultValue={initial?.email ?? ''} maxLength={200} />
      </Field>
      <div className="grid md:grid-cols-2 gap-5">
        <Field label={t('fields.orgNumber')} error={err('org_number')}>
          <Input name="org_number" defaultValue={initial?.org_number ?? ''} maxLength={50} />
        </Field>
        <Field label={t('fields.vatNumber')} error={err('vat_number')}>
          <Input name="vat_number" defaultValue={initial?.vat_number ?? ''} maxLength={50} />
        </Field>
      </div>
      <fieldset className="grid md:grid-cols-2 gap-5">
        <Field label={t('fields.addressStreet')}>
          <Input name="address.street" defaultValue={initial?.address?.street ?? ''} />
        </Field>
        <Field label={t('fields.addressPostal')}>
          <Input name="address.postal" defaultValue={initial?.address?.postal ?? ''} />
        </Field>
        <Field label={t('fields.addressCity')}>
          <Input name="address.city" defaultValue={initial?.address?.city ?? ''} />
        </Field>
        <Field label={t('fields.addressCountry')}>
          <Input name="address.country" defaultValue={initial?.address?.country ?? ''} />
        </Field>
      </fieldset>
      <Field label={t('fields.notes')} error={err('notes')}>
        <textarea
          name="notes"
          defaultValue={initial?.notes ?? ''}
          rows={4}
          maxLength={2000}
          className="w-full rounded-[12px] border border-line-1 bg-card px-3 py-2 text-[15px] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand"
        />
      </Field>

      {state.error && <p className="text-sm text-neg">{state.error}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {mode === 'create' ? t('actions.create') : t('actions.save')}
        </Button>
        {cancelHref && (
          <Link href={cancelHref} className="text-sm text-ink/60 hover:text-ink">
            {t('actions.cancel')}
          </Link>
        )}
      </div>
    </form>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-ink/80">{label}</span>
      {children}
      {error && <span className="text-xs text-neg">{error}</span>}
    </label>
  )
}
```

- [ ] **Step 2:** `pnpm typecheck`, `pnpm build` --- must pass.

- [ ] **Step 3:** Commit
```
git commit -m "feat(clients): ClientForm shared by create and edit"
```

---

### Task 2.9: Client list components (desktop table + mobile cards)

**Files:** Create `src/features/clients/components/client-list.tsx`.

- [ ] **Step 1:** Implement
```tsx
import { Chip } from '@/components/ui/chip'
import Link from 'next/link'
import type { Route } from 'next'
import { useTranslations } from 'next-intl'
import type { ClientRow } from '../queries'

export function ClientList({ clients }: { clients: ClientRow[] }) {
  return (
    <>
      <div className="hidden md:block">
        <DesktopTable clients={clients} />
      </div>
      <div className="md:hidden flex flex-col gap-3">
        {clients.map((c) => (
          <MobileCard key={c.id} client={c} />
        ))}
      </div>
    </>
  )
}

function DesktopTable({ clients }: { clients: ClientRow[] }) {
  return (
    <div className="rounded-[24px] border border-line-1 bg-card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="text-ink/60 text-xs uppercase tracking-wide">
          <tr className="border-b border-line-1">
            <th className="text-left font-medium px-6 py-3">Name</th>
            <th className="text-left font-medium px-6 py-3">Email</th>
            <th className="text-left font-medium px-6 py-3">VAT</th>
            <th className="text-right font-medium px-6 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((c) => (
            <tr key={c.id} className="border-b border-line-1 last:border-0 hover:bg-paper/50">
              <td className="px-6 py-3">
                <Link href={`/clients/${c.id}` as Route} className="font-medium hover:underline">
                  {c.name}
                </Link>
              </td>
              <td className="px-6 py-3 text-ink/70">{c.email ?? '---'}</td>
              <td className="px-6 py-3 text-ink/70 font-mono text-xs">{c.vat_number ?? '---'}</td>
              <td className="px-6 py-3 text-right">
                {c.archived_at && <ArchivedChip />}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function MobileCard({ client }: { client: ClientRow }) {
  return (
    <Link
      href={`/clients/${client.id}` as Route}
      className="block rounded-[24px] border border-line-1 bg-card p-4 hover:bg-paper/50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-medium truncate">{client.name}</div>
          {client.email && <div className="text-sm text-ink/60 truncate">{client.email}</div>}
        </div>
        {client.archived_at && <ArchivedChip />}
      </div>
    </Link>
  )
}

function ArchivedChip() {
  const t = useTranslations('clients')
  return <Chip tone="neutral">{t('archived')}</Chip>
}
```

- [ ] **Step 2:** Commit
```
git commit -m "feat(clients): ClientList with desktop table and mobile cards"
```

---

### Task 2.10: Empty state component

**Files:** Create `src/features/clients/components/empty-state.tsx`.

- [ ] **Step 1:** Implement
```tsx
import { Button } from '@/components/ui/button'
import { ClientsIcon, PlusIcon } from '@/components/ui/icons'
import Link from 'next/link'
import type { Route } from 'next'
import { useTranslations } from 'next-intl'

export function ClientsEmpty() {
  const t = useTranslations('clients')
  return (
    <div className="rounded-[24px] border border-dashed border-line-2 bg-card p-12 text-center">
      <ClientsIcon className="mx-auto h-10 w-10 text-ink/40" />
      <h2 className="mt-4 text-lg font-semibold tracking-tight">{t('empty')}</h2>
      <p className="mt-1 text-ink/60">{t('emptyHint')}</p>
      <Link href={'/clients/new' as Route} className="inline-block mt-6">
        <Button>
          <PlusIcon className="h-4 w-4" />
          {t('createCta')}
        </Button>
      </Link>
    </div>
  )
}
```

- [ ] **Step 2:** Commit
```
git commit -m "feat(clients): empty state for first-run"
```

---

### Task 2.11: Search and archive toolbar (client component)

**Files:** Create `src/features/clients/components/clients-toolbar.tsx`.

- [ ] **Step 1:** Implement
```tsx
'use client'

import { Input } from '@/components/ui/input'
import { SearchIcon } from '@/components/ui/icons'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useCallback, useState, useTransition } from 'react'

export function ClientsToolbar() {
  const t = useTranslations('clients')
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [search, setSearch] = useState(params.get('q') ?? '')
  const [, startTransition] = useTransition()

  const push = useCallback(
    (next: URLSearchParams) => {
      startTransition(() => router.replace(`${pathname}?${next.toString()}`))
    },
    [pathname, router],
  )

  const onSearchChange = (v: string) => {
    setSearch(v)
    const next = new URLSearchParams(params)
    if (v) next.set('q', v)
    else next.delete('q')
    push(next)
  }

  const onArchivedToggle = (checked: boolean) => {
    const next = new URLSearchParams(params)
    if (checked) next.set('archived', '1')
    else next.delete('archived')
    push(next)
  }

  return (
    <div className="flex flex-col md:flex-row md:items-center gap-3">
      <label className="flex-1 relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/40" />
        <Input
          aria-label={t('search')}
          placeholder={t('search')}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </label>
      <label className="flex items-center gap-2 text-sm text-ink/70">
        <input
          type="checkbox"
          checked={params.get('archived') === '1'}
          onChange={(e) => onArchivedToggle(e.target.checked)}
          className="accent-brand"
        />
        {t('showArchived')}
      </label>
    </div>
  )
}
```

- [ ] **Step 2:** Commit
```
git commit -m "feat(clients): search + archived toolbar with URL state"
```

---

### Task 2.12: Clients list page

**Files:** Modify `app/(app)/clients/page.tsx`.

- [ ] **Step 1:** Replace stub with real page
```tsx
import { Button } from '@/components/ui/button'
import { PlusIcon } from '@/components/ui/icons'
import { ClientList } from '@/features/clients/components/client-list'
import { ClientsEmpty } from '@/features/clients/components/empty-state'
import { ClientsToolbar } from '@/features/clients/components/clients-toolbar'
import { listClients } from '@/features/clients/queries'
import Link from 'next/link'
import type { Route } from 'next'
import { getTranslations } from 'next-intl/server'

interface PageProps {
  searchParams: Promise<{ q?: string; archived?: string }>
}

export default async function ClientsPage({ searchParams }: PageProps) {
  const { q, archived } = await searchParams
  const t = await getTranslations('clients')
  const clients = await listClients({
    search: q,
    includeArchived: archived === '1',
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">{t('title')}</h1>
        <Link href={'/clients/new' as Route}>
          <Button>
            <PlusIcon className="h-4 w-4" />
            {t('newClient')}
          </Button>
        </Link>
      </div>
      <ClientsToolbar />
      {clients.length === 0 ? <ClientsEmpty /> : <ClientList clients={clients} />}
    </div>
  )
}
```

- [ ] **Step 2:** `pnpm typecheck`, `pnpm build`. Commit
```
git commit -m "feat(clients): list page with search, archive toggle, empty state"
```

---

### Task 2.13: Create client page

**Files:** Create `app/(app)/clients/new/page.tsx`.

- [ ] **Step 1:** Implement
```tsx
import { createClientAction } from '@/features/clients/actions'
import { ClientForm } from '@/features/clients/components/client-form'
import type { Route } from 'next'
import { getTranslations } from 'next-intl/server'

export default async function NewClientPage() {
  const t = await getTranslations('clients')
  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h1 className="text-3xl font-semibold tracking-tight">{t('newClient')}</h1>
      <ClientForm
        mode="create"
        action={createClientAction}
        cancelHref={'/clients' as Route}
      />
    </div>
  )
}
```

- [ ] **Step 2:** Commit
```
git commit -m "feat(clients): /clients/new page"
```

---

### Task 2.14: Client detail page (view + archive)

**Files:** Create `app/(app)/clients/[id]/page.tsx`, `src/features/clients/components/client-archive-button.tsx`.

- [ ] **Step 1:** Archive button (client component)
```tsx
'use client'

import { Button } from '@/components/ui/button'
import { archiveClientAction, unarchiveClientAction } from '../actions'
import { useTranslations } from 'next-intl'
import { useTransition } from 'react'

export function ClientArchiveButton({
  id,
  archived,
}: {
  id: string
  archived: boolean
}) {
  const t = useTranslations('clients')
  const [pending, start] = useTransition()
  const confirmKey = archived ? 'actions.confirmUnarchive' : 'actions.confirmArchive'
  const labelKey = archived ? 'unarchive' : 'archive'

  return (
    <Button
      type="button"
      variant={archived ? 'secondary' : 'danger'}
      disabled={pending}
      onClick={() => {
        if (!confirm(t(confirmKey))) return
        start(async () => {
          await (archived ? unarchiveClientAction(id) : archiveClientAction(id))
        })
      }}
    >
      {t(labelKey)}
    </Button>
  )
}
```

- [ ] **Step 2:** Detail page
```tsx
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/chip'
import { ClientArchiveButton } from '@/features/clients/components/client-archive-button'
import { getClient } from '@/features/clients/queries'
import Link from 'next/link'
import type { Route } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ClientDetailPage({ params }: Props) {
  const { id } = await params
  const client = await getClient(id)
  if (!client) notFound()
  const t = await getTranslations('clients')

  const addr = client.address
  const addressLines = [
    addr?.street,
    [addr?.postal, addr?.city].filter(Boolean).join(' '),
    addr?.country,
  ].filter((line) => line && line.length > 0)

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <Link href={'/clients' as Route} className="text-sm text-ink/60 hover:text-ink">
          -�� {t('back')}
        </Link>
      </div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{client.name}</h1>
          {client.archived_at && (
            <div className="mt-2">
              <Chip tone="neutral">{t('archived')}</Chip>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/clients/${client.id}/edit` as Route}>
            <Button variant="secondary">{t('edit')}</Button>
          </Link>
          <ClientArchiveButton id={client.id} archived={Boolean(client.archived_at)} />
        </div>
      </div>

      <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
        {client.email && (
          <>
            <dt className="text-ink/60">{t('fields.email')}</dt>
            <dd>{client.email}</dd>
          </>
        )}
        {client.org_number && (
          <>
            <dt className="text-ink/60">{t('fields.orgNumber')}</dt>
            <dd className="font-mono">{client.org_number}</dd>
          </>
        )}
        {client.vat_number && (
          <>
            <dt className="text-ink/60">{t('fields.vatNumber')}</dt>
            <dd className="font-mono">{client.vat_number}</dd>
          </>
        )}
        {addressLines.length > 0 && (
          <>
            <dt className="text-ink/60">Address</dt>
            <dd>
              {addressLines.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </dd>
          </>
        )}
        {client.notes && (
          <>
            <dt className="text-ink/60">{t('fields.notes')}</dt>
            <dd className="whitespace-pre-wrap">{client.notes}</dd>
          </>
        )}
      </dl>
    </div>
  )
}
```

- [ ] **Step 3:** `pnpm typecheck`, `pnpm build`. Commit
```
git commit -m "feat(clients): detail page with edit + archive actions"
```

---

### Task 2.15: Edit client page

**Files:** Create `app/(app)/clients/[id]/edit/page.tsx`.

- [ ] **Step 1:** Implement
```tsx
import { updateClientAction, type ClientActionResult } from '@/features/clients/actions'
import { ClientForm } from '@/features/clients/components/client-form'
import { getClient } from '@/features/clients/queries'
import type { Route } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditClientPage({ params }: Props) {
  const { id } = await params
  const client = await getClient(id)
  if (!client) notFound()
  const t = await getTranslations('clients')

  const boundAction = async (
    _prev: ClientActionResult,
    formData: FormData,
  ): Promise<ClientActionResult> => {
    'use server'
    return updateClientAction(id, formData)
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h1 className="text-3xl font-semibold tracking-tight">
        {t('edit')} · {client.name}
      </h1>
      <ClientForm
        mode="edit"
        action={boundAction}
        initial={client}
        cancelHref={`/clients/${id}` as Route}
      />
    </div>
  )
}
```

> Note: `useActionState` requires the action's first argument to be `prevState`. We adapt `updateClientAction(id, formData)` into that shape via an inline `'use server'` async function so the form can pass it directly. This pattern keeps the canonical action signature `(id, formData)` while still working with React 19's `useActionState`.

- [ ] **Step 2:** `pnpm typecheck`, `pnpm build`. Commit
```
git commit -m "feat(clients): edit page reuses ClientForm"
```

---

### Task 2.16: Update AGENTS.md with clients-specific notes

**Files:** Modify `AGENTS.md`.

- [ ] **Step 1:** Append a `Clients` section under "Review guidelines"
```markdown
### Clients (P1)
- Hard delete is forbidden --- always set `archived_at` instead.
- Searching is by `name` or `email` only. Don't add full-text search to other columns without spec update.
- `address` is `jsonb` with `{ street?, postal?, city?, country? }`; never store the address as a single text blob.
- Client detail page must call `getClient(id)` (which scopes by `organization_id`), not raw Supabase queries.
```

- [ ] **Step 2:** Commit
```
git commit -m "docs: extend AGENTS.md with clients review guidelines"
```

---

## Phase 2 Acceptance Criteria

Manual verification (requires local Supabase running):

1. `/clients` (empty org) shows the empty state with "Create your first client" CTA.
2. Clicking the CTA opens `/clients/new`. Submitting with valid data lands on `/clients/<id>`.
3. `/clients/<id>` shows all populated fields and hides empty ones. Edit/Archive buttons present.
4. Edit lands on `/clients/<id>/edit` with prefilled values. Saving returns to detail with new values.
5. Archive flips the client to archived state; list page hides it unless "Show archived" is on.
6. Unarchive restores it.
7. Search filters list to matching name or email substrings.
8. RLS: a second organization's client is not visible in the list and `/clients/<other-org-client-id>` returns 404.
9. Mobile (375px): list shows cards instead of table; form is single-column; detail is full-width.
10. SV locale: all clients UI text in Swedish.
11. `pnpm typecheck`, `pnpm lint`, `pnpm test` all green.

## Out of scope (later phases)

- Linked invoices on client detail (Phase 3).
- Bulk import of clients (later).
- Client tags or categories (later).
- Pagination beyond 500 rows (Phase 3 when invoice load motivates it).
