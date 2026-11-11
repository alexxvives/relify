# Design tokens

Single source for Relify type and form controls. Do not override these per page.

## Type

Loaded once in `src/app/layout.tsx` and exposed as CSS variables in `src/app/globals.css` (`@theme inline` + `:root`).

| Token | Family | Use |
| --- | --- | --- |
| `--font-sans` / `--public-font` | DM Sans | Body, UI, forms |
| `--font-heading` / `--public-heading` | Geist | Page and section titles (`h1`–`h3`, `.releva-page-title`, `.releva-section-title`, `.releva-hero-title`) |
| `--font-display` / `--public-display` | Instrument Serif | Accents only (not page titles; not the `/valorar` Relify label) |

Tailwind maps `font-sans` and `font-heading` to those variables. Do not set `font-family` on a page, and do not load a fourth family for `/valorar` or auth. The `/valorar` “Relify” word in Qué te enviaremos uses `--font-heading`.

## Fields

`--field-radius: 0.9rem` is the shared control corner (the squarer waitlist input). `.relify-field` and `.releva-wait-field` share sand fill, public-line border, and ink focus. Browser autofill (`:-webkit-autofill`) keeps that sand fill with an inset box-shadow so Chrome does not paint a blue or yellow field. The form kit (`src/components/ui/form`), login, sign-up, `/valorar`, and Arc (`--radius-control`) read the same token.

## Titles wrap naturally

Do not insert `<br>` in titles or subtitles, and do not clamp them with `max-width: Nch` or a narrow `max-w-*` so they break to a poster layout. `text-wrap: pretty` / `text-balance` is allowed. ESLint flags `<br>` on landing, waitlist, and `/valorar`.
