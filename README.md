# Faqtura Design System

**Faqtura** is a Swedish invoicing SaaS for freelancers and small businesses. The name plays on the Swedish word *faktura* (invoice). The product covers the full invoicing workflow: clients, line items, e-invoice (e-faktura) delivery, payment tracking, reminders, ROT/RUT deductions, VAT, expense capture, and simple bookkeeping handoff for accountants.

Audience: solo freelancers, consultants, and small teams (1---10 people) in Sweden who want something modern, calm, and dead-simple --- not heavy accounting software like Fortnox or Visma.

This design system is a complete kit for building product UI, marketing material, slides, and assets in the Faqtura brand.

---

## INDEX

| File | Purpose |
|---|---|
| `README.md` | This file --- start here |
| `SKILL.md` | Agent skill manifest |
| `colors_and_type.css` | Tokenized CSS variables (color, type, radius, shadow, spacing) |
| `docs/design-system/preview/*.html` | Design system preview cards |
| `docs/legacy-prototype/` | The Faqtura web app UI kit --- components + interactive prototype |
| `fonts/` | (none --- uses Google Fonts: Hanken Grotesk, IBM Plex Mono) |
| `assets/` | Logos and brand marks |

---

## CONTENT FUNDAMENTALS

Faqtura speaks like a calm, practical Swedish accountant friend --- direct, helpful, never showy. Sentence case everywhere. No exclamation marks. No emoji. No "magic," "wow," or "delight." Numbers and dates are the heroes; words exist to label them.

**Voice rules:**
- **Second person**, present tense. *"You have 3 invoices due this week."* Not *"There are 3..."*
- **Sentence case** for headings, buttons, nav, everything.
- **Short**. "Send invoice." not "Click here to send the invoice now."
- **Bilingual where natural**. Status chips and key product terms can appear in Swedish when it's clearer (*Faktura skickad*, *Betald*, *FÃ¶rfallen*, *ROT/RUT*) --- but the UI chrome is English-first so the system reads as a *product*, not a translation.
- **Honest about money**. *"-‚¬2,450 overdue from 2 clients"* --- never softened to *"action needed."*
- **No jargon**. *"Send"* not *"Dispatch."* *"Reminder"* not *"Dunning notice."*

**Examples --- yes:**
- "Good morning, Elin."
- "3 invoices, -‚¬4,820 --- due this week"
- "Mark as paid"
- "Send a friendly reminder"
- "Drag in a receipt"

**Examples --- no:**
- "Welcome back! ðŸŽ‰"
- "Awesome --- you're crushing it"
- "Streamline your invoicing workflow"
- "Click below to continue"

---

## VISUAL FOUNDATIONS

**Palette.** Built on two colors: warm orange and ink black, on a light warm-neutral gray paper. Orange is the energy and the brand; ink is the structure and primary action; everything else is restraint.

- `--ink` `#14110D` --- primary text, primary button background, sidebar active, chart secondary
- `--paper` `#EFEDE7` --- page background, light warm gray (not cream, not bluish)
- `--card` `#FFFFFF` --- elevated surface
- `--brand` `#EC5A2A` --- Faqtura orange. Used for the hero stat fill, accent chips, key CTAs. The visual anchor.
- `--accent` `#EC5A2A` --- same orange; the role differs (small highlights and chips), the color does not.
- `--pos` `#1F7A4D` --- paid
- `--warn` `#C8881F` --- pending / due soon
- `--neg` `#B43A2C` --- overdue

White text on orange. Orange icon on ink. Black text on paper. Status uses its own semantic colors so it doesn't fight the brand.

**Type.**
- **Hanken Grotesk** --- one family for both UI and display. A serious, neutral grotesque in the SÃ¶hne / GT America family. Differentiated by *weight* and *tracking*, not by family change:
  - Display (hero numbers, section heroes): 600 Â· `-0.03em`
  - UI / body: 400---500 Â· `-0.015em` at large sizes, normal at body size
  - Buttons / labels: 500
- **IBM Plex Mono** --- invoice numbers (`INV-2026-0312`), VAT IDs, money in tables (tabular figures). Technical, no flourishes.

Body is plain `normal`. Tabular numerals (`font-feature-settings: 'tnum'`) on all money columns.

**Backgrounds.** Always a light warm gray `--paper`. No gradients. No textures. No imagery on chrome. Cards are pure white with a soft warm border (`#E2DED4`) and either no shadow (flat) or a single soft elevated shadow `0 1px 2px rgba(20,17,13,0.04), 0 8px 24px -8px rgba(20,17,13,0.08)`.

**Corner radii.**
- Cards: 24px
- Inputs/buttons (default): 12px
- Pill buttons & nav: 999px (full pill)
- Chips/badges: 999px
- Tiny tokens (status dots): circle

**Borders.** 1px `--line` (`#E2DED4`) on cards and inputs. Active inputs get a 2px `--ink` ring with no shadow.

**Spacing.** 4px base. Tokens: `2 / 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 56 / 80`. Card padding is usually 24px or 28px.

**Shadows.**
- `--shadow-flat`: none
- `--shadow-soft`: `0 1px 2px rgba(20,17,13,0.04), 0 8px 24px -8px rgba(20,17,13,0.08)`
- `--shadow-pop`: `0 2px 4px rgba(20,17,13,0.06), 0 16px 40px -12px rgba(20,17,13,0.14)` (menus, popovers)

**Hover & press.**
- Buttons: bg darkens by ~8% on hover; scale `0.98` and bg darkens by ~14% on press.
- Cards / list rows: row gets `--paper` tint on hover; press = no transform.
- Links: underline offset 4px on hover, never default.

**Animation.** Almost none in chrome. Where used: 180ms ease for menus and tabs, 120ms ease for hover color shifts. Page transitions are instant. No bouncy easings.

**Iconography.** **Lucide** icons at 1.5px stroke (CDN). Always currentColor. 16px in dense UI, 20px in nav, 24px in empty states. Never decorative --- every icon labels an action or status. No emoji ever.

**Layout rules.**
- Max content width on dashboard: 1440px, content-padded at 32px.
- Sidebar nav (icon-only) 72px wide.
- Top bar 72px tall with horizontal pill nav centered.
- Two-column data layouts use a 12-col grid with 24px gutters.

**Imagery.** Faqtura uses very little imagery --- this is a financial tool. The only "imagery" is: client avatars (initial-circle placeholders with deterministic warm tints), country/currency flag chips, and one product hero illustration (a stylized invoice document) used on marketing surfaces. Never stock photos. Never people.

**Transparency / blur.** Avoided. Surfaces are crisp and opaque. Modals dim the background with solid `rgba(20,17,13,0.32)`, no blur.

---

## ICONOGRAPHY

Faqtura uses **Lucide** at 1.5px stroke (CDN). Icons inherit `currentColor`. Sizes: 16 (dense UI), 20 (nav, buttons), 24 (empty states, large CTAs). The brand mark is a stylized "Æ’" (lowercase f with a forward bar) --- see `assets/logo.svg`. No emoji. No unicode glyphs as icons.

---

## SOURCES

This design system was created from scratch for Faqtura. The visual aesthetic was informed by one reference screenshot (a fintech dashboard with rounded card chrome, pill nav, and a single warm accent color) --- Faqtura uses an entirely original palette, type pairing, and brand mark.

