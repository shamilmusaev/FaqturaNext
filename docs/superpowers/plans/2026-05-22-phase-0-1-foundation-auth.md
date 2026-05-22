# Faqtura — Phase 0 + Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bootstrap the Faqtura Next.js + Supabase web application with brand-aligned design primitives, responsive AppShell, internationalization (EN + SV), and a working email/password auth flow with multi-tenant organizations.

**Architecture:** Single Next.js 15 App Router app with feature-based colocation under `src/features/`. Supabase for Postgres + Auth + Storage. Tailwind v4 with brand tokens from existing `colors_and_type.css`. UI primitives ported from the existing `ui.jsx` prototype to TypeScript. No shadcn — only Radix headless primitives where complex a11y is needed.

**Tech Stack:** Next.js 15, React 19, TypeScript (strict), Tailwind v4, Supabase (@supabase/ssr), Radix UI, Lucide icons, next-intl, Biome, Vitest, Playwright, GitHub Actions, pnpm.

**Reference:** [Design spec](../specs/2026-05-22-faqtura-app-design.md)

**Prerequisites the engineer needs locally:**
- Node.js ≥ 20
- pnpm ≥ 9 (`npm install -g pnpm`)
- Docker (for `supabase start` local stack)
- Supabase CLI (`brew install supabase/tap/supabase` or `npm i -g supabase`)
- A Supabase account (free tier) for the hosted project — only needed at the very end of Phase 0

---

## Phase 0 — Foundation

### Task 0.1: Initialize Next.js project in-place

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `next-env.d.ts`, `app/layout.tsx`, `app/page.tsx`, `.gitignore` (merged with existing)

The repo already has files at root (`README.md`, `colors_and_type.css`, `ui_kits/`, `preview/`, `assets/`). We initialize Next.js **inside this same root** without overwriting them.

- [ ] **Step 1: Add `.npmrc` and `package.json` manually**

Create `.npmrc`:
```
engine-strict=true
auto-install-peers=true
```

Create `package.json`:
```json
{
  "name": "faqtura",
  "version": "0.1.0",
  "private": true,
  "engines": { "node": ">=20", "pnpm": ">=9" },
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "typecheck": "tsc --noEmit",
    "lint": "biome check .",
    "format": "biome format --write .",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "db:start": "supabase start",
    "db:stop": "supabase stop",
    "db:reset": "supabase db reset",
    "db:types": "supabase gen types typescript --local > src/lib/supabase/database.types.ts"
  }
}
```

- [ ] **Step 2: Install core dependencies**

Run:
```bash
pnpm add next@^15 react@^19 react-dom@^19
pnpm add -D typescript @types/node @types/react @types/react-dom
```

Expected: installs without peer warnings about React versions.

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "ui_kits", "preview", "docs/legacy-prototype"]
}
```

- [ ] **Step 4: Create `next.config.ts`**

```ts
import type { NextConfig } from 'next'

const config: NextConfig = {
  experimental: { typedRoutes: true },
  images: { remotePatterns: [] },
}

export default config
```

- [ ] **Step 5: Append Next.js entries to `.gitignore`**

Append to existing `.gitignore` (create if missing):
```
# Next.js
.next/
out/
*.tsbuildinfo
next-env.d.ts

# Node
node_modules/
.pnpm-store/

# Env
.env
.env*.local

# Supabase
supabase/.branches
supabase/.temp
```

- [ ] **Step 6: Create placeholder `app/layout.tsx` and `app/page.tsx`**

`app/layout.tsx`:
```tsx
import type { ReactNode } from 'react'

export const metadata = { title: 'Faqtura', description: 'Swedish invoicing, calm and direct.' }

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

`app/page.tsx`:
```tsx
export default function HomePage() {
  return <main>Faqtura — bootstrapping.</main>
}
```

- [ ] **Step 7: Verify dev server boots**

Run: `pnpm dev`
Expected: `Ready in ...` at `http://localhost:3000`, page shows "Faqtura — bootstrapping.". Stop with Ctrl-C.

- [ ] **Step 8: Commit**

```bash
git add .npmrc package.json pnpm-lock.yaml tsconfig.json next.config.ts app/ .gitignore
git commit -m "chore: bootstrap Next.js 15 + React 19 + TypeScript"
```

---

### Task 0.2: Move legacy prototype out of the way

**Files:**
- Move: `ui_kits/web_app/` → `docs/legacy-prototype/`
- Move: `preview/` → `docs/design-system/preview/`

- [ ] **Step 1: Move directories**

```bash
mkdir -p docs/design-system
git mv ui_kits/web_app docs/legacy-prototype
git mv preview docs/design-system/preview
rmdir ui_kits 2>/dev/null || true
```

- [ ] **Step 2: Verify nothing references the old paths**

Run: `git grep -n "ui_kits/web_app" -- ':!docs/legacy-prototype'`
Expected: no matches (or only matches in README — update those references).

If README references the moved files, update them:
- `ui_kits/web_app/` → `docs/legacy-prototype/`
- `preview/*.html` → `docs/design-system/preview/*.html`

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: relocate legacy prototype and design previews under docs/"
```

---

### Task 0.3: Set up Biome (lint + format)

**Files:**
- Create: `biome.json`

- [ ] **Step 1: Install Biome**

```bash
pnpm add -D --save-exact @biomejs/biome
```

- [ ] **Step 2: Create `biome.json`**

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "files": {
    "ignore": ["node_modules", ".next", "out", "docs/legacy-prototype", "supabase/.branches", "supabase/.temp", "src/lib/supabase/database.types.ts"]
  },
  "organizeImports": { "enabled": true },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": { "quoteStyle": "single", "semicolons": "asNeeded", "trailingCommas": "all" }
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "style": { "noNonNullAssertion": "warn" },
      "suspicious": { "noExplicitAny": "error" },
      "a11y": { "recommended": true }
    }
  }
}
```

- [ ] **Step 3: Run formatter to baseline existing files**

Run: `pnpm format`
Expected: formats `app/`, `package.json`, `tsconfig.json`.

- [ ] **Step 4: Run lint**

Run: `pnpm lint`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add biome.json app/ package.json tsconfig.json pnpm-lock.yaml
git commit -m "chore: add Biome for lint and format"
```

---

### Task 0.4: Move design tokens and set up Tailwind v4

**Files:**
- Move: `colors_and_type.css` → `src/styles/tokens.css`
- Create: `app/globals.css`, `postcss.config.mjs`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Install Tailwind v4**

```bash
pnpm add -D tailwindcss@^4 @tailwindcss/postcss postcss
```

- [ ] **Step 2: Move tokens file**

```bash
mkdir -p src/styles
git mv colors_and_type.css src/styles/tokens.css
```

- [ ] **Step 3: Create `postcss.config.mjs`**

```js
export default {
  plugins: { '@tailwindcss/postcss': {} }
}
```

- [ ] **Step 4: Create `app/globals.css` that wires tokens into Tailwind v4**

```css
@import 'tailwindcss';
@import '../src/styles/tokens.css';

@theme {
  --color-ink: var(--ink);
  --color-paper: var(--paper);
  --color-card: var(--card);
  --color-brand: var(--brand);
  --color-accent: var(--accent);
  --color-pos: var(--pos);
  --color-warn: var(--warn);
  --color-neg: var(--neg);
  --color-line-1: var(--line-1, #E2DED4);
  --color-line-2: var(--line-2, #D6D1C5);

  --font-sans: 'Hanken Grotesk', system-ui, sans-serif;
  --font-mono: 'IBM Plex Mono', ui-monospace, monospace;

  --radius-card: 24px;
  --radius-control: 12px;

  --shadow-card: 0 1px 2px rgba(20,17,13,0.04), 0 8px 24px -8px rgba(20,17,13,0.08);
}

@layer base {
  html, body { background: var(--paper); color: var(--ink); }
  body { font-family: var(--font-sans); font-feature-settings: 'tnum' off; }
  .tnum { font-feature-settings: 'tnum'; }
}
```

> If `tokens.css` doesn't already declare `--line-1`/`--line-2`, that's fine — the `var(name, fallback)` covers the gap.

- [ ] **Step 5: Import `globals.css` in root layout**

Modify `app/layout.tsx`:
```tsx
import type { ReactNode } from 'react'
import './globals.css'

export const metadata = { title: 'Faqtura', description: 'Swedish invoicing, calm and direct.' }

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 6: Verify the brand background renders**

Run: `pnpm dev`
Expected: `http://localhost:3000` shows warm gray paper background `#EFEDE7`, ink-colored text. Confirm visually, then Ctrl-C.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(ui): wire brand tokens into Tailwind v4"
```

---

### Task 0.5: Load fonts via next/font

**Files:**
- Create: `src/styles/fonts.ts`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Create `src/styles/fonts.ts`**

```ts
import { Hanken_Grotesk, IBM_Plex_Mono } from 'next/font/google'

export const fontSans = Hanken_Grotesk({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans-loaded',
  display: 'swap',
})

export const fontMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono-loaded',
  display: 'swap',
})
```

- [ ] **Step 2: Apply font variables on `<html>`**

Modify `app/layout.tsx`:
```tsx
import type { ReactNode } from 'react'
import { fontSans, fontMono } from '@/styles/fonts'
import './globals.css'

export const metadata = { title: 'Faqtura', description: 'Swedish invoicing, calm and direct.' }

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${fontSans.variable} ${fontMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 3: Make `globals.css` consume the loaded variables when available**

Replace the `@theme` font lines in `app/globals.css`:
```css
  --font-sans: var(--font-sans-loaded), 'Hanken Grotesk', system-ui, sans-serif;
  --font-mono: var(--font-mono-loaded), 'IBM Plex Mono', ui-monospace, monospace;
```

- [ ] **Step 4: Verify fonts load**

Run: `pnpm dev`. Open DevTools → Network → filter "font". Expect 1–2 woff2 requests for Hanken Grotesk and IBM Plex Mono.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(ui): load Hanken Grotesk + IBM Plex Mono via next/font"
```

---

### Task 0.6: `cn()` utility

**Files:**
- Create: `src/lib/cn.ts`, `tests/unit/cn.test.ts`

- [ ] **Step 1: Install deps**

```bash
pnpm add clsx tailwind-merge
```

- [ ] **Step 2: Set up Vitest**

```bash
pnpm add -D vitest @vitest/coverage-v8 jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

Create `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.{ts,tsx}'],
  },
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
})
```

Create `tests/setup.ts`:
```ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 3: Write failing test**

Create `tests/unit/cn.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/cn'

describe('cn', () => {
  it('joins class strings', () => {
    expect(cn('a', 'b')).toBe('a b')
  })
  it('drops falsy values', () => {
    expect(cn('a', false && 'b', null, undefined, 'c')).toBe('a c')
  })
  it('merges tailwind conflicts (later wins)', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })
})
```

- [ ] **Step 4: Run, expect failure**

Run: `pnpm test cn`
Expected: FAIL — module not found.

- [ ] **Step 5: Implement**

Create `src/lib/cn.ts`:
```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 6: Run, expect pass**

Run: `pnpm test cn`
Expected: 3 passed.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(lib): add cn() class-name helper with tests"
```

---

### Task 0.7: `money.ts` — SEK formatting

**Files:**
- Create: `src/lib/money.ts`, `tests/unit/money.test.ts`

- [ ] **Step 1: Write failing test**

`tests/unit/money.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { formatMoney, parseMoney, addCents } from '@/lib/money'

describe('formatMoney', () => {
  it('formats SEK with non-breaking thousand separator and comma decimal', () => {
    expect(formatMoney(123450, 'SEK', 'sv-SE')).toMatch(/1\s234,50/)
    expect(formatMoney(123450, 'SEK', 'sv-SE')).toContain('kr')
  })
  it('formats zero', () => {
    expect(formatMoney(0, 'SEK', 'sv-SE')).toMatch(/0,00/)
  })
  it('formats EUR with EN locale', () => {
    expect(formatMoney(123450, 'EUR', 'en-GB')).toContain('€')
    expect(formatMoney(123450, 'EUR', 'en-GB')).toContain('1,234.50')
  })
})

describe('parseMoney', () => {
  it('parses sv-SE format', () => {
    expect(parseMoney('1 234,50', 'sv-SE')).toBe(123450)
    expect(parseMoney('0,00', 'sv-SE')).toBe(0)
  })
  it('rejects garbage', () => {
    expect(() => parseMoney('abc', 'sv-SE')).toThrow()
  })
})

describe('addCents', () => {
  it('sums an array', () => {
    expect(addCents([100, 200, 50])).toBe(350)
  })
})
```

- [ ] **Step 2: Run, expect failure**

Run: `pnpm test money`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

`src/lib/money.ts`:
```ts
export type Currency = 'SEK' | 'EUR' | 'USD' | 'NOK' | 'DKK'

export function formatMoney(cents: number, currency: Currency = 'SEK', locale = 'sv-SE'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100)
}

export function parseMoney(input: string, locale = 'sv-SE'): number {
  const decimalSep = (1.1).toLocaleString(locale).charAt(1)
  const cleaned = input.replace(/\s/g, '').replace(decimalSep === ',' ? /\./g : /,/g, '')
  const normalised = decimalSep === ',' ? cleaned.replace(',', '.') : cleaned
  const n = Number(normalised)
  if (!Number.isFinite(n)) throw new Error(`Cannot parse money: ${input}`)
  return Math.round(n * 100)
}

export function addCents(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0)
}
```

- [ ] **Step 4: Run, expect pass**

Run: `pnpm test money`
Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(lib): money formatter and parser for SEK/EUR with locale support"
```

---

### Task 0.8: `dates.ts` — date helpers

**Files:**
- Create: `src/lib/dates.ts`, `tests/unit/dates.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect } from 'vitest'
import { addBusinessDays, isOverdue, formatDateISO, formatDateLong } from '@/lib/dates'

describe('addBusinessDays', () => {
  it('skips weekends', () => {
    // Friday 2026-05-22 + 1 business day = Monday 2026-05-25
    expect(addBusinessDays(new Date('2026-05-22'), 1)).toEqual(new Date('2026-05-25'))
  })
  it('adds zero days', () => {
    expect(addBusinessDays(new Date('2026-05-22'), 0)).toEqual(new Date('2026-05-22'))
  })
})

describe('isOverdue', () => {
  it('returns true when due_at is before today', () => {
    expect(isOverdue('2020-01-01', new Date('2026-05-22'))).toBe(true)
  })
  it('returns false on the due date itself', () => {
    expect(isOverdue('2026-05-22', new Date('2026-05-22'))).toBe(false)
  })
})

describe('formatDateISO', () => {
  it('returns YYYY-MM-DD', () => {
    expect(formatDateISO(new Date('2026-05-22'))).toBe('2026-05-22')
  })
})

describe('formatDateLong', () => {
  it('formats sv-SE', () => {
    expect(formatDateLong(new Date('2026-05-22'), 'sv-SE')).toMatch(/22 maj 2026/)
  })
})
```

- [ ] **Step 2: Run, expect failure** — `pnpm test dates` — FAIL.

- [ ] **Step 3: Implement**

```ts
export function addBusinessDays(start: Date, days: number): Date {
  const d = new Date(start)
  let added = 0
  while (added < days) {
    d.setUTCDate(d.getUTCDate() + 1)
    const day = d.getUTCDay()
    if (day !== 0 && day !== 6) added++
  }
  return d
}

export function isOverdue(dueAt: string, today = new Date()): boolean {
  const due = new Date(dueAt)
  const t = new Date(today.toISOString().slice(0, 10))
  return due.getTime() < t.getTime()
}

export function formatDateISO(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function formatDateLong(d: Date, locale = 'sv-SE'): string {
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(d)
}
```

- [ ] **Step 4: Run, expect pass.**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(lib): date helpers (business days, overdue, formatters)"
```

---

### Task 0.9: Lucide icons + `src/components/ui/icons.tsx`

**Files:**
- Create: `src/components/ui/icons.tsx`

- [ ] **Step 1: Install Lucide**

```bash
pnpm add lucide-react
```

- [ ] **Step 2: Create curated icon barrel**

`src/components/ui/icons.tsx`:
```tsx
export {
  Home as HomeIcon,
  FileText as InvoiceIcon,
  Users as ClientsIcon,
  Settings as SettingsIcon,
  Plus as PlusIcon,
  Search as SearchIcon,
  Check as CheckIcon,
  X as CloseIcon,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Menu as MenuIcon,
  Send as SendIcon,
  Download as DownloadIcon,
  AlertCircle as AlertIcon,
  Calendar as CalendarIcon,
  ArrowRight,
  LogOut,
  Building as OrgIcon,
} from 'lucide-react'
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(ui): add Lucide icon barrel"
```

---

### Task 0.10: Port UI primitive — `Button`

**Files:**
- Create: `src/components/ui/button.tsx`, `tests/unit/button.test.tsx`

**Reference for design:** `docs/legacy-prototype/ui.jsx` (the legacy `Button` component) and `docs/design-system/preview/comp-buttons.html`.

- [ ] **Step 1: Write failing test**

`tests/unit/button.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Send invoice</Button>)
    expect(screen.getByRole('button', { name: 'Send invoice' })).toBeInTheDocument()
  })

  it('fires onClick', async () => {
    let clicked = false
    render(<Button onClick={() => { clicked = true }}>Click</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(clicked).toBe(true)
  })

  it('disables when disabled', async () => {
    let clicked = false
    render(<Button disabled onClick={() => { clicked = true }}>Click</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(clicked).toBe(false)
  })

  it('renders secondary variant', () => {
    render(<Button variant="secondary">x</Button>)
    expect(screen.getByRole('button')).toHaveClass(/border/)
  })
})
```

- [ ] **Step 2: Run, expect failure.**

- [ ] **Step 3: Implement**

`src/components/ui/button.tsx`:
```tsx
import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-[12px] transition-colors min-h-11 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand'

const variants: Record<Variant, string> = {
  primary: 'bg-ink text-white hover:bg-ink/90',
  secondary: 'bg-card text-ink border border-line-1 hover:bg-paper',
  ghost: 'text-ink hover:bg-line-1/40',
  danger: 'bg-neg text-white hover:bg-neg/90',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-[15px]',
  lg: 'h-12 px-5 text-base',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, ...props }, ref) => (
    <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} {...props} />
  ),
)
Button.displayName = 'Button'
```

- [ ] **Step 4: Run, expect pass.**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(ui): port Button primitive to TypeScript"
```

---

### Task 0.11: Port UI primitive — `Chip`

**Files:**
- Create: `src/components/ui/chip.tsx`, `tests/unit/chip.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Chip } from '@/components/ui/chip'

describe('Chip', () => {
  it('renders label', () => {
    render(<Chip>Faktura skickad</Chip>)
    expect(screen.getByText('Faktura skickad')).toBeInTheDocument()
  })
  it('applies pos tone class', () => {
    render(<Chip tone="pos">Betald</Chip>)
    expect(screen.getByText('Betald').className).toMatch(/pos/)
  })
})
```

- [ ] **Step 2: Run, expect failure.**

- [ ] **Step 3: Implement**

`src/components/ui/chip.tsx`:
```tsx
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Tone = 'neutral' | 'pos' | 'warn' | 'neg' | 'brand'

const tones: Record<Tone, string> = {
  neutral: 'bg-line-1/50 text-ink border-line-1',
  pos: 'bg-pos/10 text-pos border-pos/30 pos',
  warn: 'bg-warn/10 text-warn border-warn/30 warn',
  neg: 'bg-neg/10 text-neg border-neg/30 neg',
  brand: 'bg-brand/10 text-brand border-brand/30 brand',
}

export function Chip({ children, tone = 'neutral', className }: { children: ReactNode; tone?: Tone; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border', tones[tone], className)}>
      {children}
    </span>
  )
}
```

- [ ] **Step 4: Run, expect pass.**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(ui): port Chip primitive"
```

---

### Task 0.12: Port UI primitive — `Card`

**Files:**
- Create: `src/components/ui/card.tsx`, `tests/unit/card.test.tsx`

- [ ] **Step 1: Test**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Card } from '@/components/ui/card'

describe('Card', () => {
  it('renders content', () => {
    render(<Card>Hello</Card>)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
  it('applies elevated class when elevated', () => {
    const { container } = render(<Card elevated>x</Card>)
    expect(container.firstChild).toHaveClass(/shadow/)
  })
})
```

- [ ] **Step 2: Run, expect failure.**

- [ ] **Step 3: Implement**

`src/components/ui/card.tsx`:
```tsx
import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean
  children: ReactNode
}

export function Card({ elevated, className, children, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'bg-card border border-line-1 rounded-[24px] p-6',
        elevated && 'shadow-[var(--shadow-card)]',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}
```

- [ ] **Step 4: Run, expect pass.**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(ui): port Card primitive"
```

---

### Task 0.13: Port UI primitive — `Input` and `MoneyInput`

**Files:**
- Create: `src/components/ui/input.tsx`, `src/components/ui/money-input.tsx`, `tests/unit/input.test.tsx`

- [ ] **Step 1: Test**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from '@/components/ui/input'
import { MoneyInput } from '@/components/ui/money-input'

describe('Input', () => {
  it('accepts typing', async () => {
    render(<Input aria-label="name" />)
    const el = screen.getByLabelText('name')
    await userEvent.type(el, 'Elin')
    expect(el).toHaveValue('Elin')
  })
})

describe('MoneyInput', () => {
  it('emits cents via onChange', async () => {
    let cents = 0
    render(<MoneyInput aria-label="amount" onValueChange={v => { cents = v }} />)
    const el = screen.getByLabelText('amount')
    await userEvent.type(el, '1234,50')
    expect(cents).toBe(123450)
  })
})
```

- [ ] **Step 2: Run, expect failure.**

- [ ] **Step 3: Implement Input**

`src/components/ui/input.tsx`:
```tsx
import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'flex h-11 w-full rounded-[12px] border border-line-1 bg-card px-3 text-[15px]',
        'placeholder:text-ink/40 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand',
        'disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = 'Input'
```

- [ ] **Step 4: Implement MoneyInput**

`src/components/ui/money-input.tsx`:
```tsx
'use client'

import { forwardRef, useState, type InputHTMLAttributes } from 'react'
import { parseMoney } from '@/lib/money'
import { Input } from './input'

interface MoneyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  /** Cents */
  defaultValueCents?: number
  onValueChange?: (cents: number) => void
  locale?: string
}

export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ defaultValueCents, onValueChange, locale = 'sv-SE', ...props }, ref) => {
    const [text, setText] = useState(
      defaultValueCents != null ? (defaultValueCents / 100).toLocaleString(locale, { minimumFractionDigits: 2 }) : '',
    )
    return (
      <Input
        ref={ref}
        inputMode="decimal"
        className="tnum text-right font-mono"
        value={text}
        onChange={e => {
          const v = e.target.value
          setText(v)
          if (!v) return onValueChange?.(0)
          try { onValueChange?.(parseMoney(v, locale)) } catch { /* ignore until valid */ }
        }}
        {...props}
      />
    )
  },
)
MoneyInput.displayName = 'MoneyInput'
```

- [ ] **Step 5: Run, expect pass.**

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(ui): port Input and MoneyInput primitives"
```

---

### Task 0.14: Port UI primitive — `Avatar`

**Files:**
- Create: `src/components/ui/avatar.tsx`, `tests/unit/avatar.test.tsx`

- [ ] **Step 1: Test**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Avatar } from '@/components/ui/avatar'

describe('Avatar', () => {
  it('shows initials', () => {
    render(<Avatar name="Elin Larsson" />)
    expect(screen.getByText('EL')).toBeInTheDocument()
  })
  it('handles single name', () => {
    render(<Avatar name="Elin" />)
    expect(screen.getByText('E')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run, expect failure.**

- [ ] **Step 3: Implement**

`src/components/ui/avatar.tsx`:
```tsx
import { cn } from '@/lib/cn'

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0 || !parts[0]) return '?'
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase()
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase()
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-full bg-line-1 text-ink text-sm font-medium',
        className,
      )}
      aria-label={name}
    >
      {initials(name)}
    </span>
  )
}
```

- [ ] **Step 4: Run, expect pass.**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(ui): port Avatar primitive"
```

---

### Task 0.15: Add Radix Dialog wrapper (used by drawers)

**Files:**
- Create: `src/components/ui/dialog.tsx`

- [ ] **Step 1: Install Radix Dialog**

```bash
pnpm add @radix-ui/react-dialog
```

- [ ] **Step 2: Create wrapper**

`src/components/ui/dialog.tsx`:
```tsx
'use client'

import * as RadixDialog from '@radix-ui/react-dialog'
import { type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { CloseIcon } from './icons'

export const Dialog = RadixDialog.Root
export const DialogTrigger = RadixDialog.Trigger

export function DialogContent({
  children,
  side = 'right',
  className,
}: {
  children: ReactNode
  side?: 'right' | 'center'
  className?: string
}) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="fixed inset-0 bg-ink/30 data-[state=open]:animate-in data-[state=open]:fade-in" />
      <RadixDialog.Content
        className={cn(
          'fixed bg-card focus:outline-none',
          side === 'right'
            ? 'right-0 top-0 h-screen w-full md:w-[720px] border-l border-line-1'
            : 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-lg rounded-[24px] border border-line-1',
          className,
        )}
      >
        {children}
        <RadixDialog.Close
          className="absolute right-4 top-4 p-2 rounded-md hover:bg-line-1/40"
          aria-label="Close"
        >
          <CloseIcon className="h-5 w-5" />
        </RadixDialog.Close>
      </RadixDialog.Content>
    </RadixDialog.Portal>
  )
}

export function DialogTitle({ children }: { children: ReactNode }) {
  return <RadixDialog.Title className="text-xl font-semibold tracking-tight">{children}</RadixDialog.Title>
}

export function DialogDescription({ children }: { children: ReactNode }) {
  return <RadixDialog.Description className="text-ink/60 text-sm">{children}</RadixDialog.Description>
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(ui): add Radix Dialog wrapper for drawers and modals"
```

---

### Task 0.16: Add Toast primitive (Radix)

**Files:**
- Create: `src/components/ui/toast.tsx`

- [ ] **Step 1: Install**

```bash
pnpm add sonner
```

> We use `sonner` instead of Radix Toast — it's the de-facto modern Toast in React 19 and has less boilerplate. Brand styling via props.

- [ ] **Step 2: Create wrapper**

`src/components/ui/toast.tsx`:
```tsx
'use client'

import { Toaster as SonnerToaster, toast } from 'sonner'

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        className: 'rounded-[12px] border border-line-1 bg-card text-ink shadow-[var(--shadow-card)]',
      }}
    />
  )
}

export { toast }
```

- [ ] **Step 3: Mount in root layout**

Modify `app/layout.tsx` body:
```tsx
import { Toaster } from '@/components/ui/toast'
// ...
<body>
  {children}
  <Toaster />
</body>
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(ui): add Toaster (sonner) wired into root layout"
```

---

### Task 0.17: Initialize Supabase locally

**Files:**
- Create: `supabase/config.toml` (generated), `supabase/seed.sql`, `.env.local.example`

- [ ] **Step 1: Init Supabase**

```bash
supabase init
```

Expected: creates `supabase/config.toml`, `supabase/.gitignore`, `supabase/seed.sql`.

- [ ] **Step 2: Configure Auth in `supabase/config.toml`**

Open `supabase/config.toml`, find `[auth.email]` section, and set:
```toml
[auth.email]
enable_signup = true
enable_confirmations = false
```

- [ ] **Step 3: Start local stack**

```bash
supabase start
```

Expected: outputs API URL (`http://127.0.0.1:54321`), anon key, service role key. Note them.

- [ ] **Step 4: Create `.env.local.example`**

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<paste anon key from supabase start>
SUPABASE_SERVICE_ROLE_KEY=<paste service role key>
SUPABASE_PROJECT_REF=local
```

Engineer copies to `.env.local` with real values:
```bash
cp .env.local.example .env.local
# then edit with real keys
```

- [ ] **Step 5: Commit**

```bash
git add supabase/config.toml supabase/.gitignore supabase/seed.sql .env.local.example
git commit -m "chore(supabase): initialize local Supabase stack with confirmations off"
```

---

### Task 0.18: Supabase client helpers

**Files:**
- Create: `src/lib/supabase/server.ts`, `src/lib/supabase/client.ts`, `src/lib/supabase/middleware.ts`

- [ ] **Step 1: Install**

```bash
pnpm add @supabase/ssr @supabase/supabase-js
```

- [ ] **Step 2: Create server client**

`src/lib/supabase/server.ts`:
```ts
import 'server-only'
import { createServerClient as supaCreateServer } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createServerClient() {
  const cookieStore = await cookies()
  return supaCreateServer(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: list => {
          for (const { name, value, options } of list) {
            try { cookieStore.set(name, value, options) } catch { /* called from RSC */ }
          }
        },
      },
    },
  )
}
```

- [ ] **Step 3: Create browser client**

`src/lib/supabase/client.ts`:
```ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
```

- [ ] **Step 4: Create middleware client**

`src/lib/supabase/middleware.ts`:
```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: list => {
          for (const { name, value, options } of list) {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          }
        },
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()
  return { response, user, supabase }
}
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(supabase): server, client and middleware Supabase helpers"
```

---

### Task 0.19: Set up next-intl with EN + SV

**Files:**
- Create: `src/i18n/config.ts`, `src/i18n/request.ts`, `src/i18n/messages/en.json`, `src/i18n/messages/sv.json`
- Modify: `next.config.ts`, `app/layout.tsx`

- [ ] **Step 1: Install**

```bash
pnpm add next-intl
```

- [ ] **Step 2: Create config**

`src/i18n/config.ts`:
```ts
export const locales = ['en', 'sv'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'
```

- [ ] **Step 3: Initial messages**

`src/i18n/messages/en.json`:
```json
{
  "common": {
    "appName": "Faqtura",
    "signIn": "Sign in",
    "signOut": "Sign out",
    "signUp": "Create account",
    "save": "Save",
    "cancel": "Cancel",
    "loading": "Loading"
  },
  "nav": {
    "overview": "Overview",
    "invoices": "Invoices",
    "clients": "Clients",
    "settings": "Settings"
  },
  "auth": {
    "loginTitle": "Sign in",
    "signupTitle": "Create your account",
    "email": "Email",
    "password": "Password",
    "noAccount": "No account yet?",
    "haveAccount": "Already have an account?"
  },
  "onboarding": {
    "title": "Set up your company",
    "companyName": "Company name",
    "orgNumber": "Organization number",
    "vatNumber": "VAT number",
    "create": "Create company"
  },
  "invoiceStatus": {
    "draft": "Utkast",
    "sent": "Faktura skickad",
    "paid": "Betald",
    "overdue": "Förfallen",
    "cancelled": "Avbruten"
  }
}
```

`src/i18n/messages/sv.json`:
```json
{
  "common": {
    "appName": "Faqtura",
    "signIn": "Logga in",
    "signOut": "Logga ut",
    "signUp": "Skapa konto",
    "save": "Spara",
    "cancel": "Avbryt",
    "loading": "Laddar"
  },
  "nav": {
    "overview": "Översikt",
    "invoices": "Fakturor",
    "clients": "Kunder",
    "settings": "Inställningar"
  },
  "auth": {
    "loginTitle": "Logga in",
    "signupTitle": "Skapa ditt konto",
    "email": "E-post",
    "password": "Lösenord",
    "noAccount": "Inget konto än?",
    "haveAccount": "Har du redan ett konto?"
  },
  "onboarding": {
    "title": "Ställ in ditt företag",
    "companyName": "Företagsnamn",
    "orgNumber": "Organisationsnummer",
    "vatNumber": "Momsregistreringsnummer",
    "create": "Skapa företag"
  },
  "invoiceStatus": {
    "draft": "Utkast",
    "sent": "Faktura skickad",
    "paid": "Betald",
    "overdue": "Förfallen",
    "cancelled": "Avbruten"
  }
}
```

- [ ] **Step 4: Create request config (locale lives in a cookie, not URL)**

`src/i18n/request.ts`:
```ts
import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'
import { defaultLocale, locales, type Locale } from './config'

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get('locale')?.value as Locale | undefined
  const locale: Locale = cookieLocale && (locales as readonly string[]).includes(cookieLocale) ? cookieLocale : defaultLocale
  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  }
})
```

- [ ] **Step 5: Wire into Next config**

Modify `next.config.ts`:
```ts
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const config: NextConfig = {
  experimental: { typedRoutes: true },
}

export default withNextIntl(config)
```

- [ ] **Step 6: Wrap root layout with NextIntlClientProvider**

Modify `app/layout.tsx`:
```tsx
import type { ReactNode } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { fontSans, fontMono } from '@/styles/fonts'
import { Toaster } from '@/components/ui/toast'
import './globals.css'

export const metadata = { title: 'Faqtura', description: 'Swedish invoicing, calm and direct.' }

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale()
  const messages = await getMessages()
  return (
    <html lang={locale} className={`${fontSans.variable} ${fontMono.variable}`}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
        <Toaster />
      </body>
    </html>
  )
}
```

- [ ] **Step 7: Verify dev server still works**

Run: `pnpm dev`. Expected: same homepage, no errors.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(i18n): next-intl with en + sv messages, cookie-based locale"
```

---

### Task 0.20: AppShell — Sidebar component

**Files:**
- Create: `src/components/chrome/sidebar.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/cn'
import { HomeIcon, InvoiceIcon, ClientsIcon, SettingsIcon } from '@/components/ui/icons'

const nav = [
  { href: '/overview', icon: HomeIcon, key: 'overview' as const },
  { href: '/invoices', icon: InvoiceIcon, key: 'invoices' as const },
  { href: '/clients', icon: ClientsIcon, key: 'clients' as const },
  { href: '/settings', icon: SettingsIcon, key: 'settings' as const },
]

export function Sidebar() {
  const pathname = usePathname()
  const t = useTranslations('nav')
  return (
    <aside className="hidden md:flex md:flex-col md:w-[240px] md:shrink-0 border-r border-line-1 bg-card h-screen sticky top-0">
      <div className="px-6 py-6 text-xl font-semibold">Faqtura</div>
      <nav className="px-3 flex flex-col gap-1">
        {nav.map(({ href, icon: Icon, key }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 h-11 rounded-[12px] text-[15px]',
                active ? 'bg-ink text-white' : 'text-ink hover:bg-line-1/40',
              )}
            >
              <Icon className="h-5 w-5" />
              {t(key)}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat(chrome): Sidebar with active state and i18n labels"
```

---

### Task 0.21: AppShell — TopBar component

**Files:**
- Create: `src/components/chrome/topbar.tsx`, `src/components/chrome/locale-switcher.tsx`

- [ ] **Step 1: LocaleSwitcher**

`src/components/chrome/locale-switcher.tsx`:
```tsx
'use client'

import { useRouter } from 'next/navigation'
import { locales, type Locale } from '@/i18n/config'

export function LocaleSwitcher({ current }: { current: Locale }) {
  const router = useRouter()
  return (
    <select
      value={current}
      aria-label="Language"
      className="h-9 bg-card border border-line-1 rounded-[12px] px-2 text-sm"
      onChange={e => {
        document.cookie = `locale=${e.target.value}; path=/; max-age=31536000`
        router.refresh()
      }}
    >
      {locales.map(l => (
        <option key={l} value={l}>{l.toUpperCase()}</option>
      ))}
    </select>
  )
}
```

- [ ] **Step 2: TopBar**

`src/components/chrome/topbar.tsx`:
```tsx
import { getLocale } from 'next-intl/server'
import type { Locale } from '@/i18n/config'
import { LocaleSwitcher } from './locale-switcher'

export async function TopBar({ userEmail }: { userEmail: string }) {
  const locale = (await getLocale()) as Locale
  return (
    <header className="h-16 border-b border-line-1 bg-card flex items-center justify-between px-4 md:px-6">
      <div className="md:hidden font-semibold">Faqtura</div>
      <div className="flex-1" />
      <div className="flex items-center gap-3">
        <LocaleSwitcher current={locale} />
        <span className="text-sm text-ink/60 hidden sm:inline">{userEmail}</span>
      </div>
    </header>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(chrome): TopBar with locale switcher"
```

---

### Task 0.22: AppShell — Bottom tab bar (mobile) + layout glue

**Files:**
- Create: `src/components/chrome/bottom-tabs.tsx`, `src/components/chrome/app-shell.tsx`

- [ ] **Step 1: BottomTabs**

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/cn'
import { HomeIcon, InvoiceIcon, ClientsIcon, SettingsIcon } from '@/components/ui/icons'

const tabs = [
  { href: '/overview', icon: HomeIcon, key: 'overview' as const },
  { href: '/invoices', icon: InvoiceIcon, key: 'invoices' as const },
  { href: '/clients', icon: ClientsIcon, key: 'clients' as const },
  { href: '/settings', icon: SettingsIcon, key: 'settings' as const },
]

export function BottomTabs() {
  const pathname = usePathname()
  const t = useTranslations('nav')
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-line-1 bg-card flex">
      {tabs.map(({ href, icon: Icon, key }) => {
        const active = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn('flex-1 flex flex-col items-center justify-center gap-0.5 text-xs', active ? 'text-ink' : 'text-ink/50')}
          >
            <Icon className="h-5 w-5" />
            {t(key)}
          </Link>
        )
      })}
    </nav>
  )
}
```

- [ ] **Step 2: AppShell**

`src/components/chrome/app-shell.tsx`:
```tsx
import type { ReactNode } from 'react'
import { Sidebar } from './sidebar'
import { TopBar } from './topbar'
import { BottomTabs } from './bottom-tabs'

export function AppShell({ userEmail, children }: { userEmail: string; children: ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar userEmail={userEmail} />
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">{children}</main>
      </div>
      <BottomTabs />
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(chrome): AppShell with responsive sidebar and mobile bottom tabs"
```

---

### Task 0.23: Marketing landing page (basic)

**Files:**
- Create: `app/(marketing)/layout.tsx`, `app/(marketing)/page.tsx`
- Delete: `app/page.tsx`

- [ ] **Step 1: Move root to marketing group**

```bash
rm app/page.tsx
mkdir -p 'app/(marketing)'
```

- [ ] **Step 2: Create marketing layout**

`app/(marketing)/layout.tsx`:
```tsx
import type { ReactNode } from 'react'
import Link from 'next/link'

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="h-16 px-6 flex items-center justify-between">
        <Link href="/" className="text-xl font-semibold">Faqtura</Link>
        <nav className="flex items-center gap-4">
          <Link href="/login" className="text-sm">Sign in</Link>
          <Link href="/signup" className="text-sm font-medium px-4 py-2 rounded-[12px] bg-ink text-white">Create account</Link>
        </nav>
      </header>
      {children}
    </div>
  )
}
```

- [ ] **Step 3: Create landing**

`app/(marketing)/page.tsx`:
```tsx
export default function HomePage() {
  return (
    <main className="px-6 py-24 max-w-3xl mx-auto">
      <h1 className="text-5xl font-semibold tracking-tight">Invoicing for Swedish freelancers.</h1>
      <p className="mt-6 text-lg text-ink/70">
        Send invoices, track payments, file VAT. Calm, direct, dead-simple.
      </p>
    </main>
  )
}
```

- [ ] **Step 4: Verify**

Run: `pnpm dev`. Open `http://localhost:3000`. Expected: marketing landing with header and brand hero.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(marketing): basic landing page in (marketing) route group"
```

---

### Task 0.24: Stub `(app)` route group with overview placeholder

**Files:**
- Create: `app/(app)/layout.tsx`, `app/(app)/overview/page.tsx`

- [ ] **Step 1: App layout (auth-gated later — for now just renders shell)**

`app/(app)/layout.tsx`:
```tsx
import type { ReactNode } from 'react'
import { AppShell } from '@/components/chrome/app-shell'

export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell userEmail="signed-out@local">{children}</AppShell>
}
```

- [ ] **Step 2: Overview placeholder**

`app/(app)/overview/page.tsx`:
```tsx
export default function OverviewPage() {
  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Overview</h1>
      <p className="mt-2 text-ink/60">Phase 0 placeholder. Auth and data wire up in Phase 1.</p>
    </div>
  )
}
```

- [ ] **Step 3: Verify**

Run `pnpm dev`, navigate to `/overview`. Expected: AppShell renders with sidebar (desktop) / bottom tabs (mobile), overview placeholder content.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(app): stub (app) route group with overview placeholder"
```

---

### Task 0.25: Playwright setup

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/smoke.spec.ts`

- [ ] **Step 1: Install**

```bash
pnpm add -D @playwright/test
pnpm dlx playwright install chromium --with-deps
```

- [ ] **Step 2: Config**

`playwright.config.ts`:
```ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
})
```

- [ ] **Step 3: Smoke test**

`tests/e2e/smoke.spec.ts`:
```ts
import { test, expect } from '@playwright/test'

test('landing page renders', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Swedish freelancers')
})

test('overview placeholder renders', async ({ page }) => {
  await page.goto('/overview')
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible()
})
```

- [ ] **Step 4: Run**

```bash
pnpm test:e2e
```

Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "test(e2e): Playwright config + landing/overview smoke tests"
```

---

### Task 0.26: GitHub Actions CI

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create workflow**

`.github/workflows/ci.yml`:
```yaml
name: CI

on:
  push: { branches: [main] }
  pull_request:

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm build
        env:
          NEXT_PUBLIC_SUPABASE_URL: http://127.0.0.1:54321
          NEXT_PUBLIC_SUPABASE_ANON_KEY: dummy
  e2e:
    runs-on: ubuntu-latest
    needs: check
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm dlx playwright install chromium --with-deps
      - run: pnpm test:e2e
        env:
          NEXT_PUBLIC_SUPABASE_URL: http://127.0.0.1:54321
          NEXT_PUBLIC_SUPABASE_ANON_KEY: dummy
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "ci: typecheck, lint, unit, build, and e2e on PR + main"
```

---

## Phase 0 Complete

At this point the engineer has:
- Working Next.js app with brand tokens and fonts
- UI primitives ported (Button, Chip, Card, Input, MoneyInput, Avatar, Dialog, Toast)
- Responsive AppShell (Sidebar / TopBar / BottomTabs)
- i18n with EN + SV
- Local Supabase stack
- Test infrastructure (Vitest + Playwright)
- CI pipeline

**Manual checkpoint before Phase 1:**
1. `pnpm typecheck` — clean
2. `pnpm lint` — clean
3. `pnpm test` — all green
4. `pnpm test:e2e` — both smoke tests pass
5. Visit `/` (marketing), `/overview` (app shell) in browser at mobile (375px) and desktop (1440px) widths; layouts should be correct.

---

## Phase 1 — Auth + Tenancy

### Task 1.1: First migration — organizations + memberships

**Files:**
- Create: `supabase/migrations/0001_organizations.sql`

- [ ] **Step 1: Create migration**

```bash
supabase migration new organizations
# This creates supabase/migrations/<timestamp>_organizations.sql — rename to 0001 for clarity
```

- [ ] **Step 2: Write SQL**

`supabase/migrations/0001_organizations.sql`:
```sql
create extension if not exists "pgcrypto";

create table organizations (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  org_number      text,
  vat_number      text,
  address         jsonb,
  iban            text,
  bankgiro        text,
  plusgiro        text,
  swish_number    text,
  default_vat_rate numeric(5,2) not null default 25,
  default_payment_terms_days int not null default 30,
  locale          text not null default 'sv-SE',
  currency        text not null default 'SEK',
  invoice_number_template text not null default 'INV-{YYYY}-{NNNN}',
  logo_url        text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table memberships (
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  role            text not null check (role in ('owner','admin','member')),
  created_at      timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create index memberships_user_idx on memberships (user_id);

create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger organizations_updated_at
  before update on organizations
  for each row execute function set_updated_at();
```

- [ ] **Step 3: Apply locally**

```bash
supabase db reset
```

Expected: migration applied, tables created.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0001_organizations.sql
git commit -m "feat(db): organizations and memberships tables"
```

---

### Task 1.2: RLS policies

**Files:**
- Create: `supabase/migrations/0002_rls.sql`

- [ ] **Step 1: Write SQL**

`supabase/migrations/0002_rls.sql`:
```sql
alter table organizations enable row level security;
alter table memberships enable row level security;

-- organizations: members see their orgs
create policy "members read orgs"
  on organizations for select
  using (id in (select organization_id from memberships where user_id = auth.uid()));

create policy "owners update orgs"
  on organizations for update
  using (id in (select organization_id from memberships where user_id = auth.uid() and role in ('owner','admin')));

-- memberships: users see their own memberships
create policy "users read own memberships"
  on memberships for select
  using (user_id = auth.uid());

create policy "owners manage memberships"
  on memberships for all
  using (organization_id in (select organization_id from memberships where user_id = auth.uid() and role = 'owner'));
```

- [ ] **Step 2: Apply**

```bash
supabase db reset
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(db): RLS policies for organizations and memberships"
```

---

### Task 1.3: `create_organization` RPC

**Files:**
- Create: `supabase/migrations/0003_create_organization_rpc.sql`

- [ ] **Step 1: Write SQL**

```sql
create or replace function create_organization(
  p_name text,
  p_org_number text default null,
  p_vat_number text default null
) returns organizations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_org organizations;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  insert into organizations (name, org_number, vat_number)
  values (p_name, p_org_number, p_vat_number)
  returning * into v_org;

  insert into memberships (organization_id, user_id, role)
  values (v_org.id, v_user, 'owner');

  return v_org;
end $$;

revoke all on function create_organization(text, text, text) from public;
grant execute on function create_organization(text, text, text) to authenticated;
```

- [ ] **Step 2: Apply + commit**

```bash
supabase db reset
git add -A
git commit -m "feat(db): create_organization RPC with security definer"
```

---

### Task 1.4: Generate Supabase types

**Files:**
- Create: `src/lib/supabase/database.types.ts` (generated)

- [ ] **Step 1: Generate**

```bash
mkdir -p src/lib/supabase
pnpm db:types
```

Expected: `src/lib/supabase/database.types.ts` contains `Database` type with `organizations`, `memberships`.

- [ ] **Step 2: Wire types into clients**

Modify `src/lib/supabase/server.ts`, `client.ts`, `middleware.ts`:

- Replace `supaCreateServer(...)` → `supaCreateServer<Database>(...)`
- Replace `createServerClient(...)` → `createServerClient<Database>(...)`
- Replace `createBrowserClient(...)` → `createBrowserClient<Database>(...)`

Add at top of each file:
```ts
import type { Database } from './database.types'
```

- [ ] **Step 3: Verify typecheck**

```bash
pnpm typecheck
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore(supabase): generate database types and wire into clients"
```

---

### Task 1.5: `requireUser()` and active org helpers

**Files:**
- Create: `src/lib/auth.ts`, `tests/unit/auth.test.ts`

- [ ] **Step 1: Implement**

`src/lib/auth.ts`:
```ts
import 'server-only'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'

export type AuthContext = {
  userId: string
  email: string
  organizationId: string
  role: 'owner' | 'admin' | 'member'
}

const ACTIVE_ORG_COOKIE = 'active_org_id'

export async function requireUser(): Promise<AuthContext> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const cookieStore = await cookies()
  const preferredOrg = cookieStore.get(ACTIVE_ORG_COOKIE)?.value

  const { data: memberships } = await supabase
    .from('memberships')
    .select('organization_id, role')
    .eq('user_id', user.id)

  if (!memberships || memberships.length === 0) redirect('/onboarding')

  const active =
    memberships.find(m => m.organization_id === preferredOrg) ?? memberships[0]!

  return {
    userId: user.id,
    email: user.email!,
    organizationId: active.organization_id,
    role: active.role as AuthContext['role'],
  }
}

export async function setActiveOrg(orgId: string) {
  const cookieStore = await cookies()
  cookieStore.set(ACTIVE_ORG_COOKIE, orgId, { httpOnly: true, sameSite: 'lax', path: '/' })
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat(auth): requireUser() and active org cookie"
```

---

### Task 1.6: Middleware — protect (app) routes

**Files:**
- Create: `middleware.ts` (repo root)

- [ ] **Step 1: Create middleware**

```ts
import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request)
  const url = request.nextUrl

  const isApp = url.pathname.startsWith('/overview')
    || url.pathname.startsWith('/invoices')
    || url.pathname.startsWith('/clients')
    || url.pathname.startsWith('/settings')
  const isOnboarding = url.pathname.startsWith('/onboarding')
  const isAuthPage = url.pathname === '/login' || url.pathname === '/signup'

  if (isApp && !user) {
    const redirect = new URL('/login', request.url)
    redirect.searchParams.set('next', url.pathname)
    return NextResponse.redirect(redirect)
  }

  if (isOnboarding && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isAuthPage && user) {
    return NextResponse.redirect(new URL('/overview', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
```

- [ ] **Step 2: Verify**

Run `pnpm dev`. Try `http://localhost:3000/overview` in incognito. Expected: redirect to `/login?next=/overview` (page doesn't exist yet — 404 is fine; we build it next).

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(auth): middleware redirects unauthenticated users from (app) to /login"
```

---

### Task 1.7: Auth layout + login page

**Files:**
- Create: `app/(auth)/layout.tsx`, `app/(auth)/login/page.tsx`, `src/features/auth/login-form.tsx`, `src/features/auth/actions.ts`, `src/features/auth/schema.ts`

- [ ] **Step 1: Zod schemas**

`src/features/auth/schema.ts`:
```ts
import { z } from 'zod'

export const CredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})
export type Credentials = z.infer<typeof CredentialsSchema>
```

```bash
pnpm add zod
```

- [ ] **Step 2: Server actions**

`src/features/auth/actions.ts`:
```ts
'use server'

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { CredentialsSchema } from './schema'

export type AuthActionResult = { error?: string }

export async function loginAction(formData: FormData): Promise<AuthActionResult> {
  const parsed = CredentialsSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const supabase = await createServerClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) return { error: error.message }

  redirect('/overview')
}

export async function signupAction(formData: FormData): Promise<AuthActionResult> {
  const parsed = CredentialsSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const supabase = await createServerClient()
  const { error } = await supabase.auth.signUp(parsed.data)
  if (error) return { error: error.message }

  redirect('/onboarding')
}

export async function logoutAction() {
  const supabase = await createServerClient()
  await supabase.auth.signOut()
  redirect('/login')
}
```

- [ ] **Step 3: Auth layout**

`app/(auth)/layout.tsx`:
```tsx
import type { ReactNode } from 'react'
import Link from 'next/link'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-16 px-6 flex items-center">
        <Link href="/" className="text-xl font-semibold">Faqtura</Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  )
}
```

- [ ] **Step 4: LoginForm**

`src/features/auth/login-form.tsx`:
```tsx
'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { loginAction, type AuthActionResult } from './actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const initialState: AuthActionResult = {}

export function LoginForm() {
  const t = useTranslations()
  const [state, action, pending] = useActionState(
    async (_prev: AuthActionResult, formData: FormData) => loginAction(formData),
    initialState,
  )
  return (
    <form action={action} className="flex flex-col gap-4">
      <h1 className="text-3xl font-semibold tracking-tight">{t('auth.loginTitle')}</h1>
      <label className="flex flex-col gap-1.5 text-sm">
        {t('auth.email')}
        <Input name="email" type="email" autoComplete="email" required />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        {t('auth.password')}
        <Input name="password" type="password" autoComplete="current-password" required minLength={8} />
      </label>
      {state.error && <p className="text-sm text-neg">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? t('common.loading') : t('common.signIn')}
      </Button>
      <p className="text-sm text-ink/60">
        {t('auth.noAccount')} <Link href="/signup" className="underline">{t('common.signUp')}</Link>
      </p>
    </form>
  )
}
```

- [ ] **Step 5: Login page**

`app/(auth)/login/page.tsx`:
```tsx
import { LoginForm } from '@/features/auth/login-form'

export default function LoginPage() {
  return <LoginForm />
}
```

- [ ] **Step 6: Verify**

`pnpm dev` → `/login`. Expected: form renders with EN labels. Try submitting empty (browser native validation). Try with `notarealuser@x.com` / `password123` → error from Supabase.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(auth): login page with server-action form and i18n"
```

---

### Task 1.8: Signup page

**Files:**
- Create: `app/(auth)/signup/page.tsx`, `src/features/auth/signup-form.tsx`

- [ ] **Step 1: SignupForm**

`src/features/auth/signup-form.tsx`:
```tsx
'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { signupAction, type AuthActionResult } from './actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const initialState: AuthActionResult = {}

export function SignupForm() {
  const t = useTranslations()
  const [state, action, pending] = useActionState(
    async (_prev: AuthActionResult, formData: FormData) => signupAction(formData),
    initialState,
  )
  return (
    <form action={action} className="flex flex-col gap-4">
      <h1 className="text-3xl font-semibold tracking-tight">{t('auth.signupTitle')}</h1>
      <label className="flex flex-col gap-1.5 text-sm">
        {t('auth.email')}
        <Input name="email" type="email" autoComplete="email" required />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        {t('auth.password')}
        <Input name="password" type="password" autoComplete="new-password" required minLength={8} />
      </label>
      {state.error && <p className="text-sm text-neg">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? t('common.loading') : t('common.signUp')}
      </Button>
      <p className="text-sm text-ink/60">
        {t('auth.haveAccount')} <Link href="/login" className="underline">{t('common.signIn')}</Link>
      </p>
    </form>
  )
}
```

- [ ] **Step 2: Signup page**

`app/(auth)/signup/page.tsx`:
```tsx
import { SignupForm } from '@/features/auth/signup-form'

export default function SignupPage() {
  return <SignupForm />
}
```

- [ ] **Step 3: Verify signup creates a user**

Run `pnpm dev`. Open `http://127.0.0.1:54323` (Supabase Studio). Go to `/signup`, register `test@faqtura.local` / `password123`. After redirect to `/onboarding` (404 for now), check Studio → Authentication → Users. Expected: test user listed.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(auth): signup page that creates Supabase user and redirects to onboarding"
```

---

### Task 1.9: Onboarding page

**Files:**
- Create: `app/onboarding/page.tsx`, `src/features/auth/onboarding-form.tsx`, add `createOrganizationAction` to `actions.ts`

- [ ] **Step 1: Extend actions**

Append to `src/features/auth/actions.ts`:
```ts
import { z } from 'zod'

const OrgSchema = z.object({
  name: z.string().min(1).max(120),
  org_number: z.string().optional(),
  vat_number: z.string().optional(),
})

export async function createOrganizationAction(formData: FormData): Promise<AuthActionResult> {
  const parsed = OrgSchema.safeParse({
    name: formData.get('name'),
    org_number: formData.get('org_number') || undefined,
    vat_number: formData.get('vat_number') || undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const supabase = await createServerClient()
  const { error } = await supabase.rpc('create_organization', {
    p_name: parsed.data.name,
    p_org_number: parsed.data.org_number ?? null,
    p_vat_number: parsed.data.vat_number ?? null,
  })
  if (error) return { error: error.message }

  redirect('/overview')
}
```

- [ ] **Step 2: Onboarding form**

`src/features/auth/onboarding-form.tsx`:
```tsx
'use client'

import { useActionState } from 'react'
import { useTranslations } from 'next-intl'
import { createOrganizationAction, type AuthActionResult } from './actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const initialState: AuthActionResult = {}

export function OnboardingForm() {
  const t = useTranslations('onboarding')
  const [state, action, pending] = useActionState(
    async (_prev: AuthActionResult, formData: FormData) => createOrganizationAction(formData),
    initialState,
  )
  return (
    <form action={action} className="flex flex-col gap-4">
      <h1 className="text-3xl font-semibold tracking-tight">{t('title')}</h1>
      <label className="flex flex-col gap-1.5 text-sm">
        {t('companyName')}
        <Input name="name" required maxLength={120} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        {t('orgNumber')}
        <Input name="org_number" placeholder="XXXXXX-XXXX" />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        {t('vatNumber')}
        <Input name="vat_number" placeholder="SE..." />
      </label>
      {state.error && <p className="text-sm text-neg">{state.error}</p>}
      <Button type="submit" disabled={pending}>{t('create')}</Button>
    </form>
  )
}
```

- [ ] **Step 3: Page**

`app/onboarding/page.tsx`:
```tsx
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { OnboardingForm } from '@/features/auth/onboarding-form'

export default async function OnboardingPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: memberships } = await supabase.from('memberships').select('organization_id').limit(1)
  if (memberships && memberships.length > 0) redirect('/overview')

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm"><OnboardingForm /></div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(auth): onboarding page that creates organization via RPC"
```

---

### Task 1.10: Wire (app) layout to require auth + show real email + logout

**Files:**
- Modify: `app/(app)/layout.tsx`
- Create: `src/components/chrome/logout-button.tsx`

- [ ] **Step 1: Logout button**

`src/components/chrome/logout-button.tsx`:
```tsx
'use client'

import { logoutAction } from '@/features/auth/actions'
import { Button } from '@/components/ui/button'
import { LogOut } from '@/components/ui/icons'

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <Button type="submit" variant="ghost" size="sm">
        <LogOut className="h-4 w-4" />
      </Button>
    </form>
  )
}
```

- [ ] **Step 2: Add LogoutButton to TopBar**

Modify `src/components/chrome/topbar.tsx`:
```tsx
import { getLocale } from 'next-intl/server'
import type { Locale } from '@/i18n/config'
import { LocaleSwitcher } from './locale-switcher'
import { LogoutButton } from './logout-button'

export async function TopBar({ userEmail }: { userEmail: string }) {
  const locale = (await getLocale()) as Locale
  return (
    <header className="h-16 border-b border-line-1 bg-card flex items-center justify-between px-4 md:px-6">
      <div className="md:hidden font-semibold">Faqtura</div>
      <div className="flex-1" />
      <div className="flex items-center gap-3">
        <LocaleSwitcher current={locale} />
        <span className="text-sm text-ink/60 hidden sm:inline">{userEmail}</span>
        <LogoutButton />
      </div>
    </header>
  )
}
```

- [ ] **Step 3: Modify (app) layout to call requireUser()**

`app/(app)/layout.tsx`:
```tsx
import type { ReactNode } from 'react'
import { AppShell } from '@/components/chrome/app-shell'
import { requireUser } from '@/lib/auth'

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { email } = await requireUser()
  return <AppShell userEmail={email}>{children}</AppShell>
}
```

- [ ] **Step 4: Verify the full flow manually**

1. `pnpm dev`
2. Visit `/overview` in incognito → redirected to `/login`
3. Click "Create account", register `e2e@test.local` / `password1`
4. Redirected to `/onboarding`, fill in "Test Co", submit
5. Redirected to `/overview`, AppShell shows with `e2e@test.local` in top bar
6. Click logout → back to `/login`
7. Log in with same credentials → back to `/overview` (already onboarded)

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(auth): protect (app) routes via requireUser() and add logout"
```

---

### Task 1.11: E2E test — full auth flow

**Files:**
- Create: `tests/e2e/auth-flow.spec.ts`

- [ ] **Step 1: Test**

```ts
import { test, expect } from '@playwright/test'

test('signup → onboarding → overview, then logout and login again', async ({ page }) => {
  const email = `e2e-${Date.now()}@faqtura.local`
  const password = 'password123'

  // Signup
  await page.goto('/signup')
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/password/i).fill(password)
  await page.getByRole('button', { name: /create account/i }).click()

  // Onboarding
  await expect(page).toHaveURL(/\/onboarding/)
  await page.getByLabel(/company name/i).fill('Playwright AB')
  await page.getByRole('button', { name: /create company/i }).click()

  // Overview
  await expect(page).toHaveURL(/\/overview/)
  await expect(page.getByText(email)).toBeVisible()

  // Logout
  await page.getByRole('button', { name: '' }).click() // logout icon button (consider adding aria-label)
  await expect(page).toHaveURL(/\/login/)

  // Login again
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/password/i).fill(password)
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).toHaveURL(/\/overview/)
})

test('unauthenticated overview redirects to login', async ({ page }) => {
  await page.goto('/overview')
  await expect(page).toHaveURL(/\/login/)
})
```

> Improvement: add `aria-label="Sign out"` to the logout `Button` so the test can target it reliably. Update `logout-button.tsx`:
```tsx
<Button type="submit" variant="ghost" size="sm" aria-label="Sign out">
  <LogOut className="h-4 w-4" />
</Button>
```

And update the test to: `await page.getByRole('button', { name: /sign out/i }).click()`.

- [ ] **Step 2: Make sure local Supabase is running before the test**

The test depends on `supabase start` running. Add to project README or `playwright.config.ts` precondition (manual for now; CI uses hosted Supabase or a separate workflow with Supabase actions — out of MVP scope).

- [ ] **Step 3: Run**

```bash
supabase start
pnpm test:e2e
```

Expected: 4 passed (2 prior smoke + 2 new).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "test(e2e): full signup/onboarding/login/logout flow"
```

---

### Task 1.12: Settings stub page

**Files:**
- Create: `app/(app)/settings/page.tsx`, `app/(app)/invoices/page.tsx`, `app/(app)/clients/page.tsx`

- [ ] **Step 1: Stubs**

`app/(app)/settings/page.tsx`:
```tsx
import { requireUser } from '@/lib/auth'

export default async function SettingsPage() {
  const { email, organizationId, role } = await requireUser()
  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
      <dl className="mt-6 grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
        <dt className="text-ink/60">Email</dt><dd>{email}</dd>
        <dt className="text-ink/60">Organization</dt><dd className="font-mono">{organizationId}</dd>
        <dt className="text-ink/60">Role</dt><dd>{role}</dd>
      </dl>
    </div>
  )
}
```

`app/(app)/invoices/page.tsx`:
```tsx
export default function InvoicesPage() {
  return <h1 className="text-3xl font-semibold tracking-tight">Invoices</h1>
}
```

`app/(app)/clients/page.tsx`:
```tsx
export default function ClientsPage() {
  return <h1 className="text-3xl font-semibold tracking-tight">Clients</h1>
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat(app): stub Invoices, Clients, Settings pages so sidebar nav works"
```

---

## Phase 1 Complete — Acceptance Criteria

Before declaring Phase 1 done, manually verify:

1. ✅ Visiting any `(app)` route while signed out redirects to `/login?next=<path>`.
2. ✅ Sign-up with email/password creates a user (visible in Supabase Studio at `http://127.0.0.1:54323`).
3. ✅ After signup, user is redirected to `/onboarding`.
4. ✅ Submitting onboarding creates an `organizations` row and a `memberships` row with `role='owner'`.
5. ✅ User is then redirected to `/overview` and sees their email in the top bar.
6. ✅ Logout returns to `/login`.
7. ✅ Visiting `/onboarding` after onboarding is already complete redirects to `/overview`.
8. ✅ All sidebar / bottom-tab links navigate to existing pages.
9. ✅ Locale switcher changes UI from EN to SV and persists in a cookie.
10. ✅ `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm test:e2e` all green.
11. ✅ RLS smoke check: in Supabase Studio, run `select * from organizations` as anon — returns 0 rows. As a logged-in user (via app) — returns only that user's org.

---

## Notes for the engineer

- **`pnpm db:reset` is destructive** — it wipes the local Supabase DB. Safe in local dev; never run against a hosted project.
- **`server-only` package imports** — if you accidentally import `src/lib/supabase/server.ts` from a client component, the build will throw a clear error. Trust it.
- **Server actions throw `redirect()`** — never wrap them in `try/catch` that swallows errors, or redirects break (this is a Next.js quirk: `redirect` is thrown internally).
- **`requireUser()` does `redirect('/login')` on failure** — that's why it returns a non-nullable `AuthContext`. Don't add a `?` to its return type.
- **No `.env.local` checked in** — `.env.local.example` documents the keys, real values come from `supabase start` output.
- **`docs/legacy-prototype/`** is `tsconfig` and `biome` excluded — it's reference material, not built code. Read its components when porting, but don't edit it.
- **i18n strings** — every user-visible string in components must go through `useTranslations`. New strings: add to BOTH `en.json` and `sv.json` (Biome can be configured to warn on missing keys; not done here to keep MVP simple).

---

## What's NOT in Phase 0 / Phase 1

Reserved for later phases:
- Clients CRUD (Phase 2)
- Invoices, line items, PDF, email (Phases 3–4)
- Overview dashboard with real data (Phase 5)
- Reminders, cron, polish (Phase 6)
- Email confirmation enabling (production prep)
- BankID, 2FA, audit log
- Multi-org switcher UI (defer until a user actually has >1 org; helpers in place already)
