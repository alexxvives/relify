---
name: advisor-mandates
description: >-
  Add or change Releva advisor sale mandates. Use when working on /mandatos,
  Añadir nuevo mandato de venta, advisor services, or a mandate linked to a
  seller project.
---

# Advisor mandates

A mandate is an advisor-owned engagement to sell a client company. `/mandatos` is the advisor home. With no mandates it shows "Aún no tienes mandatos de venta". "Añadir nuevo mandato de venta" saves that client's company as a draft. The first published company is free. Each later company needs the 149 € listing payment before it goes live. The board shows the codename and public figures. It does not show the legal name, CIF, or address. An advisor does not attach a mandate to a company someone else published. `/mis-servicios` stores corporate data, service price ranges, and closed operations. Documents on that page are not stored. Nothing there opens a data room. Service quotes stay records.

Build mandates after the data room and messages, unless the user explicitly asks now.

## When a mandate becomes real

1. Guard `/mandatos` with `requireRole("advisor")`. The advisor sidebar has no Ser premium.
2. One service in `src/server` creates the mandate. The action only parses input and calls it.
3. The advisor publishes their own client company. The UI shows the codename and public figures. It does not show legal name, CIF, address, shareholders, or data-room file names. Follow the confidential-reads skill.
4. Saving datos corporativos on `/mis-servicios` still unlocks the later panels. An invalid NIF still disables Guardar. Do not invent a website field.
5. Sign in as an advisor and confirm the board matches what was stored. Sign in as an investor and confirm `/mandatos` returns to `/inversor`.
