# Round P — `/valorar` today and the path to a real report

## What it does today

`/valorar` is a public Costa page (`src/app/valorar/page.tsx`) with a CIF form (`src/components/valuation-soon.tsx`).

**Fields**

- One text field: CIF de la sociedad (normalized, max 12, Spanish CIF checksum via `isValidSpanishCif`).

**On submit**

- Invalid CIF → inline error, nothing else.
- Valid CIF → client-side status: “La valoración todavía no está abierta. El CIF tiene forma válida y no lo hemos guardado.”
- No server action, no database write, no SABI lookup, no email, no admin row, no PDF.

**Valuation computed?** No. The page copy says so. Sector multiples, weighted EBITDA and the seller’s orientative price range live on the signed-in ficha (`src/lib/valuation-multiples.ts`, used from `company-draft-form.tsx`), not on `/valorar`.

**Admin view?** None. There is no `valuation_request` table.

Sitemap includes `/valorar`. Footer “Mercado” links here.

## INT

Same page as prod. It is entirely client-side, so INT does not block or break it. CIF is not stored, so there is nothing for INT guards (`shouldBlockEmail`, upload block) to touch. The form “works” in the sense that checksum validation and the coming-soon message render; nothing behind it is wired.

## Target flow

1. **Request lands in admin + email to info@itsrelify.com**  
   User enters CIF (and, to reply, an email + name). Persist a `ValuationRequest`. Reuse `sendMail` + `senderFor` so info@ writes to itself, same as SABI alerts. INT `shouldBlockEmail` stays.  
   **Data model:** `valuation_request` (`id`, `cif`, `contactName`, `contactEmail`, `status` received → sabi_loaded → drafted → sent, `projectId` nullable, timestamps). Optional `userId` if they already have an account.  
   **Effort:** small — one table, one server action, one admin list at `/admin/valoraciones`, one email builder cloned from `sabi-request-email.ts`. CIF validation already exists.

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
