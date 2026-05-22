---
name: faqtura-design
description: Use this skill to generate well-branded interfaces and assets for Faqtura, the Swedish invoicing SaaS for freelancers and small businesses. Contains design guidelines, color and type tokens, brand assets, and a UI kit covering the dashboard, invoice list, invoice editor, clients, and detail drawer.
user-invocable: true
---

Read `README.md` first — it covers product context, voice, visual foundations, and iconography. Then explore:

- `colors_and_type.css` — CSS variables: color, type, radii, shadows, spacing. Import this from any HTML you build.
- `preview/` — small specimen cards for each token category.
- `ui_kits/web_app/` — interactive web app prototype. `README.md` inside lists screens and components. Copy components (Avatar, Chip, Button, Card, Money, Field, Input, Toast, Sidebar, TopBar) verbatim — they're the canonical implementations.
- `assets/` — logo mark and lockup.

If creating visual artifacts (slides, mocks, throwaway prototypes), copy assets and tokens out and produce static HTML. Match the voice rules in README's "Content fundamentals" — sentence case, second person, plain English, occasional Swedish status terms (faktura skickad, betald, förfallen, ROT/RUT), never emoji or exclamation marks.

If the user invokes this skill without other guidance, ask what they want to build, ask several questions to nail tone and scope, and act as an expert designer who outputs HTML artifacts or production code as needed.
