# Relify design rules

Source of truth for how Relify looks and behaves. Built on the
[UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) rules (MIT), vendored in
`.cursor/skills/ui-ux-pro-max/`. Read this file before any UI change; query the skill for details:

```bash
python3 .cursor/skills/ui-ux-pro-max/scripts/search.py "<2-5 terms>" --domain ux
python3 .cursor/skills/ui-ux-pro-max/scripts/search.py "react tailwind" --stack nextjs
```

Full rule text: `.cursor/skills/ui-ux-pro-max/references/quick-reference.md`; pre-delivery checklist:
`.cursor/skills/ui-ux-pro-max/references/pro-rules.md`.

## Product and style

- B2B marketplace for buying and selling Spanish SMEs (pymes). Tone: trustworthy, calm, financial. Spanish copy, `es-ES` number and currency formats (`999.999,00 €`).
- Style: clean "trust and authority" flat UI with soft depth. No glassmorphism on app pages, no emoji as icons (use `lucide-react`), no decorative gradients behind data.
- Stack: Next 16 via vinext on Cloudflare Workers, React 19, Tailwind v4. Use utility classes and the tokens below; do not add a CSS framework or component library.

## Tokens

| Use | Value |
| --- | --- |
| App ink / headings | `#1c2740` |
| Body muted | `#5c6b78`, `#667085` |
| Card border | `#e7eaee` |
| Soft panel | `#f4f7ff`, `#eef1f8` |
| Success / verified | text `#1b7a45`, bg `#e7f6ee` |
| Public (marketing) ink / paper | `public-ink #12343a`, `public-paper #e5eef0` |
| Public primary (clay) | `public-clay #0f6e73`, hover `public-clay-deep #0b5559` |
| Seller CTA | `#0c7c78` |
| App primary button (signed-in pages) | `#465ab4`; every other button is secondary (white, `border-[#e1e6ee]`). Green `#17663a` only for sign/accept steps; teal `public-clay` only on public pages. |
| Fonts | DM Sans (UI, `font-sans`), Instrument Serif (public display only) |
| Radius | cards `rounded-2xl`/`rounded-3xl`, buttons and chips `rounded-full` |

Prefer the `public-*` Tailwind tokens on marketing pages. On app pages, reuse the hex values above rather than inventing new shades.

## Rules (priority order)

1. **Accessibility (critical).** Text contrast ≥ 4.5:1 (≥ 3:1 for large text). Every image has `alt` (empty `alt=""` only when decorative). Icon-only buttons need `aria-label`. Never remove focus rings; use `focus-visible:outline`. Toggles expose `aria-pressed`; live updates use `aria-live="polite"`.
2. **Touch and interaction (critical).** Hit targets ≥ 44×44 px on mobile (buttons `h-11`/`h-12`; `h-9` only for dense admin rows). Show pending state on every submit (`useActionState` `pending` → disabled + "…ando" label). No hover-only affordances.
3. **Performance.** Use `next/image` with `sizes`; reserve space with `aspect-*` frames (no CLS). Images under ~150 KB; JPEG/WebP.
4. **Style consistency.** One card pattern: `rounded-2xl border border-[#e7eaee] bg-white p-5`. Status as small rounded-full chips. Badges (e.g. "Verificado") use `VerifiedBadge` from `src/components/project-photo.tsx`.
5. **Layout and responsive.** Mobile first; check 390 px and 1440 px. No horizontal scroll. Grids: `md:grid-cols-2 xl:grid-cols-3` for cards.
6. **Typography and color.** Base 16 px, body line-height ~1.5, minimum 12 px for meta text (11 px only for image tags). Use `tabular-nums` for money and figures.
7. **Animation.** 150–300 ms, opacity/transform only, respect `prefers-reduced-motion`.
8. **Forms and feedback.** Visible labels (never placeholder-only), errors next to the field, success/error notes right below the action. Multi-step flows show the step count.
9. **Navigation.** Predictable back links, deep-linkable pages (query params for tabs and filters).
10. **Data.** Charts need labels or legends; never encode meaning by color alone.

## Product-specific rules

- **Confidential figures.** Keep the blurred `999.999,00 €` placeholders exactly as they are for locked data.
- **AI imagery.** Sector default pictures in `public/sectors/` are AI-generated and generic. Wherever one is shown instead of the company's own photo, render `AiImageTag` ("Imagen generada con IA") so nobody mistakes it for the real business.
- **Plans.** Pricing cards are incremental: paid plans start with "Todo lo de X, más:" and list only what they add.
- **Money copy.** Show prices with "+ IVA" or the gross "con IVA" figure next to the net one.
