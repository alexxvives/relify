---
name: advisor-mandates
description: >-
  Add or change Releva advisor sale mandates. Use when working on /mandatos,
  Añadir nuevo mandato de venta, advisor services, or a mandate linked to a
  seller project.
---

# Advisor mandates

`/mandatos` is the advisor home. `/mandatos/venta` is Mis procesos: one card per company, with the sale bar. Qué sigue sits on the same row as the lane title. Only a step still to do, such as the deposit or the advisor NDA, sits in red beside the company title. A finished step does not get a tag. A buyer hire shows that buyer's process, including before the deposit. A seller hire, once the seller opens the process, shows each buyer as Inversor 1, Inversor 2, without a name or an email. Opening an encargo shows the company page the investor sees: the detailed figures stay closed until the advisor's own NDA, and until the investor has signed when an investor hired them. The investor's public card sticks to the side and can be collapsed. The deposit sits at the end of that page. On Encargos, the investor who hired this advisor is named. Do not add a new mandate or make the advisor publish the client's company. The 149 € listing fee belongs to the seller. The deposit is 50 € plus 0.5% of the asking price. `/mis-servicios` stores the public profile: name, NIF, postal code, description, sectors, and a price range inside each service. A finished profile appears to investors and sellers with the commercial name, sectors, services, and range. It does not show the NIF, the email, or documents. A half profile stays off that list. The marketplace preview matches the height of the services list. Service quotes stay unpaid records.

Build mandates after the data room and messages, unless the user explicitly asks now.

## When a mandate becomes real

1. Guard `/mandatos`, `/mandatos/encargos`, and `/mandatos/venta` with `requireRole("advisor")`. The advisor sidebar has no Ser premium.
2. One service in `src/server` creates the mandate. The action only parses input and calls it.
3. The board shows the codename and public figures of an existing draft. It does not show legal name, CIF, address, shareholders, or data-room file names. Follow the confidential-reads skill. Do not add a publish or pay button for the advisor.
4. Saving datos corporativos on `/mis-servicios` still unlocks the later panels. An invalid NIF still disables Guardar. Do not invent a website field.
5. Sign in as an advisor and confirm the board matches what was stored. Sign in as an investor and confirm `/mandatos` returns to `/inversor`.
