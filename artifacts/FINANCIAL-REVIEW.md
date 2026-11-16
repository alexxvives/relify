# Round O — Financial review of SABI usage

Reviewed as an M&A analyst against the code on this branch and two fixture companies:

| Company | Source | Facturación | EBITDA cuentas | EBITDA aj. | Precio | Deuda neta (columna) |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| **Empresa Tecnología** | INT seed (`int-vendedor-sabi`) | 5,00 M€ | 750 k€ | 800 k€ (+50 k, status omitted → treated as **approved**) | 4,00 M€ | 500 k€ |
| **Proyecto Olivo** | Local `prisma/seed.sql` (full `project_year` rows) | 1,25 M€ | 310 k€ | 340 k€ | 980 k€ | 120 k€ |

INT Tecnología has `sabi_imported_at` but **empty year shells**, so Tus cifras, ficha tables, solidez and due diligence have nothing to compute. Olivo is the company with real year arithmetic.

Approval today: each adjustment row is `pending` until an admin taps Aceptar. Only approved rows change `adjustedEbitdaCents`. Buyers never see pending rows. Round O makes that approved figure the **primary** EBITDA (card, Resumen, ROI, recommended sort). Pending-only keeps reported EBITDA and shows **Ajuste en revisión**.

---

## (a) Errors and calculation bugs

Fixed in this round (display / ranking, not the stored SABI mapping):

1. **ROI / payback used two EBITDAs.** Marketplace card: `precio / EBITDA aj.` once adjustments are approved (Olivo 980 / 340 = **2,9 años**; Tecnología 4,00 / 0,80 = **5,0 años**). Resumen and the default marketplace sort used `precio / EBITDA cuentas` (Olivo 980 / 310 = **3,2 años**; Tecnología **5,3 años**). Formula used: `askingPriceCents / ebitdaCents`. Correct when an approved adjustment exists: `askingPriceCents / adjustedEbitdaCents`. Reported stays in the tooltip.

Not changed (mapping / seed, not a one-line formula typo):

2. **Headline Facturación ≠ year “ingresos”.** Import writes `project.revenue_cents` from SABI **ventas** (`salesCents`). Year series use `operatingRevenueCents ?? salesCents`. Fixture pattern in the parser tests: ventas 200 k€ vs ingresos de explotación 210 k€. Same label family, two bases.

3. **Olivo deuda neta / fondo de maniobra disagree with the year.** Column: deuda neta 120 k€, FM 85 k€. From 2025 lines: DFN = (110 + 60) − 95 = **75 k€**; FM = 400 − 160 = **240 k€**. Tus cifras / solidez use the year formula; marketplace/project columns keep the other number.

---

## (b) Logic flaws / inconsistencies

| Issue | What happens | Why it misleads |
| --- | --- | --- |
| **Averages vs year-end** | Tus cifras, solidez, DFN/EBITDA, runway, NOF all take the **last year with a value**. Valuation range uses weighted 3-year EBITDA 50/30/20 on positive years. | A buyer comparing “deuda neta 75 k€” to “precio 5,9× EBITDA aj.” is mixing one year-end stock with a smoothed flow. |
| **Sign** | P&L costs are stored negative; debt and cash positive. Margins are `part / revenue` including negatives (loss years go red, not n/s except when revenue is tiny). | Correct for Spanish accounts; a −16× interest cover used to print until Round N forced n/s on negative EBIT. |
| **Units** | Cents in DB; UI `formatCardEur` (1,25 M €). SABI ratios stay % / days / × as filed. Headcount “keur/empleado” is SABI’s unit. | Mixing compact euros with a 1,25 M€ tile and a 1.250.000 € ficha line is already unified; ratio tables are a different unit system. |
| **Missing years** | Window is last **4 closed**. A hole is a gap (n/s), not interpolated. Partial years (`months ≠ 12`) are flagged in diligence, not annualised. | CAGR skips a tiny first year (≥5 % of peak); good. A 2023 hole still lets 2024–25 look like a trend. |
| **Runway** | `(caja_{t−1} − caja_t) / 12`; if tesorería rose → “No aplica (genera caja)”. Olivo 80 k€ → 95 k€ → generates. | Not cash burn from opex. Seasonality or a one-off collection looks like a healthy runway. |
| **DFN/EBITDA in solidez** | Uses **accounts** EBITDA, not adjusted. Olivo 75 k / 310 k = 0,2× (or 120 k / 310 k if the column were used). | After Round O the card ROI is on 340 k€. Leverage is still on 310 k€. |
| **ROE vs table** | Chart: `resultado neto / patrimonio` (Olivo 92 k / 430 k ≈ **21 %** if net result is the project figure). Indicator table: SABI `financialReturn` (often PBT). | Two “rentabilidad financiera” numbers. |
| **Margen de beneficio** | Chart: neto / ingresos. Table: SABI JSON. | Same name, two formulas. |
| **INT Tecnología** | Published + SABI flag, no usable `project_year` rows. | Diligence, Tus cifras and 4-year charts are empty while Resumen shows 5 M€ / 750–800 k€. |

---

## (c) Misleading labels

- **“EBITDA” vs “EBITDA aj.”** — now aligned: aj. is primary only after admin approval. Pending is “Ajuste en revisión”, not a quiet second number.
- **“Caja (runway)”** — reads as months of opex; it is months of last year’s treasury drop.
- **“Caja operativa aproximada”** — EBITDA − ΔNOF, before tax, interest and capex. Not CFO.
- **“Inversión aproximada (capex)”** — Δ activo no corriente + (EBITDA − EBIT). Includes financial investments and revaluations; the hint says so, the label does not.
- **“Deuda neta”** — bank DFN, not TEV debt (no leases unless SABI booked them as financial debt).
- **Facturación** on the card is ventas; some charts say ingresos.

---

## (d) Noise

- Forecast year in P&L next to closed years (Olivo 2026) without a hard visual break.
- Solidez repeats DFN/EBITDA, liquidity and solvency that Detalle de cuentas already lists as SABI ratios.
- Capital donut from slices plus a later “Propiedad” block with the same idea.
- Marketplace margin chip and Resumen margin line once adjusted exists (same bp twice).
- Activity/locked sample figures before NDA: useful veil, but the dummy amounts sit on the same chrome as real KPIs (Resumen stays real).

---

## (e) Missing SABI / DD items a buyer would expect

Priority = what changes a bid or a walk-away. Effort = data already in SABI vs new mapping + UI.

| # | Item | Priority | Effort | Notes |
| --- | --- | --- | --- | --- |
| 1 | **DFN / EBITDA aj.** as the headline leverage | P0 | S | Same cents; switch the denominator when adjustments are approved. |
| 2 | **NOF and ΔNOF / ventas** on Tus cifras, not only diligence | P0 | S | `operatingWorkingCapital` already exists. Olivo 2025: CA 400 − caja 95 − (CL 160 − ST 60) = **205 k€** (16 % de ventas). |
| 3 | **CFO vs EBITDA** (or EBITDA − ΔNOF − tax proxy) in Resumen | P0 | M | Today only in Revisión, and it skips tax. |
| 4 | **Capex / ventas** next to growth | P1 | S | Proxy exists; surface a 3-year average. |
| 5 | **Plantilla, coste medio, ingresos/empleado** | P1 | S | Already in Equipo; not on the card or Tus cifras (Olivo has no employees on the year row). |
| 6 | **Periodo medio cobro / pago** | P1 | S | SABI `collectionDays` / `creditDays` already in solidez. Put them on the card of a working-capital-heavy target. |
| 7 | **Concentración clientes** | P1 | M | Top-5 % was dropped; ficha can sum slices. SABI does not always have it. |
| 8 | **Auditor y opinión** | P1 | S | Diligence already prints it when `sabi.auditor` exists. INT Tecnología says audited with no opinion text. |
| 9 | **Cargas / incidencias / contingencias** | P2 | L | Not in the mapped SABI extract. Needs a new block or a data-room flag. |
| 10 | **Accionistas y participadas** | P2 | M | Registry holders are admin/post-NDA. Public ficha correctly hides names; a count (“4 socios, ninguna participada”) would help without identity. |
| 11 | **Deuda financiera neta bridge to equity value** | P2 | M | Price is treated as equity-ish; DFN is shown separately. Spell “equity value vs EV” on the price hint. |
| 12 | **Covenant / debt schedule** | P3 | L | SABI has maturity split (short vs long). Not a full schedule. |

---

## What we did not change in formulas

Runway, ROE (neto / patrimonio), margen neto, cobertura n/s, gross line `(ventas − aprovisionamientos)/ventas` stay as Round N. No new SABI mapping. No production DB.
