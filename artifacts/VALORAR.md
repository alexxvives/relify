# `/valorar` today and the path to a real report

## What it does today (Round S, step 1)

`/valorar` is a public Costa page (`src/app/valorar/page.tsx`) with a contact form (`src/components/public/valuation-request-form.tsx`).

**Fields**

- CIF de la sociedad (normalized, max 12, Spanish CIF checksum via `isValidSpanishCif`).
- Nombre and correo (required). Teléfono optional. Signed-in visitors can tick “tengo cuenta” to store `userId`.

**On submit**

- Invalid CIF / contact → inline error, nothing persisted.
- Valid → `ValuationRequest` row (`status` received), confirmation “Hemos recibido tu solicitud; te enviaremos la valoración con explicación y gráficas.”, email to info@ (`valuation-request`) and a confirmation to the requester (`valuation-request-confirmation`). Rate-limited 8/hour fail-closed. No charge.

**Valuation computed?** No. Sector multiples still live on the signed-in ficha (`src/lib/valuation-multiples.ts`).

**Admin view?** `/admin/valoraciones` — list, status, notes, status filter only when there are rows.

Sitemap includes `/valorar`. Footer “Mercado” links here.

## INT

The save path is live. Mail follows the INT catch-all (`docs/INT.md`): without `INT_MAILEROO_API_KEY` + `INT_EMAIL_CATCHALL`, `sendMail` logs `INT BLOCKED` and the row still lands.

## Target flow

1. **Request lands in admin + email to info@itsrelify.com** — **shipped in Round S.**  
   Persist `ValuationRequest`. Team alert + requester confirmation. Admin list at `/admin/valoraciones`. INT mail uses the catch-all, not a hard block.

2. **Admin uploads SABI for that company**  
   Reuse `sabiImport` against a draft `Project` created from the request (codename anonymous, legal name/CIF from the Excel). Do not publish it. Link `valuation_request.projectId`. INT already blocks document uploads; keep that and let admin paste/upload only on prod, or allow INT Excel the same way SABI import already works for admins.  
   **Effort:** medium — wire the existing import UI onto the request row; do not invent a second parser. Need a “valuation-only, never catalog” project flag or status so it cannot leak to `/mercado`.

3. **System computes a valuation**  
   Already in code, missing the DFN bridge:  
   - Sector multiples by CNAE (`sectorMultiples` / `valuationSectorFromCnae`)  
   - Weighted EBITDA 50/30/20 (`weightedEbitdaCents`)  
   - Headline EBITDA aj. when approved adjustments exist (Round O/P)  
   - **DFN bridge (new):** equity value ≈ EV − deuda neta, EV ≈ weighted EBITDA × multiple. Use the same year formula as the ficha (`netDebtCents(year)`). If DFN is negative (caja neta), add it. Spell “aproximada” on the page.  
   Persist numbers on `valuation_report` (low/high EV, DFN, equity low/high, sector, multiples, year set).  
   **Effort:** medium — the multiple math exists; the bridge, persistence, and a written skeleton (“en este sector el múltiplo habitual es X–Y veces EBITDA…”) are new.

4. **Admin reviews / edits a written explanation**  
   Markdown or plain text on `valuation_report.explanation`, edited in admin, with the computed tables read-only unless an admin overrides a multiple. Status `drafted`.  
   **Effort:** small–medium — one admin form, no new library.

5. **User receives a polished report page / PDF with charts**  
   Tokenized public (or emailed) URL `/valorar/{id}` with the same Relify report charts already on the ficha (waterfall, bars, KPIs). PDF via the same pattern as deal agreements (`saleContract` / PDF render), not a third framework. Email the person the link (`notificaciones@`, tag `valuation-ready`). Charts: facturación / EBITDA, DFN bridge, multiple band.  
   **Effort:** large — new public report layout, PDF, email, and access control so a guessable id does not leak another company’s accounts. This is the bulk of the work.

**Do not** charge on this path (billing-boundary: quotes and valuations stay off Checkout until a later decision).

**Reuse, don’t rebuild:** SABI import, `estimatePriceRange`, `weightedEbitdaCents`, `headlineEbitda`, `netDebtCents`, `sendMail`, ficha charts, INT email/upload guards.

**Suggested order:** (1) persist + email → (2) SABI on a private project → (3) compute + DFN bridge → (4) admin prose → (5) user page/PDF. Ship (1) alone if needed; `/valorar` then at least records demand.
