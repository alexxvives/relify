---
name: confidential-reads
description: >-
  Keep Releva company identity off public and investor reads. Use when adding
  or changing a project query, serializer, page, notice, or test that could
  show a legal name, CIF, address, shareholder, or data-room file name.
---

# Confidential reads

Releva sells anonymized SME projects. Identity stays on the seller's own draft. An NDA acceptance does not reveal it and does not open the data room.

## Who may see what

| Audience | Allowed | Kept off the response |
| --- | --- | --- |
| Public visitor | Codename, region, revenue, EBITDA, adjusted EBITDA, asking price. Deuda neta, capital circulante, and resultado neto render as bloqueado. | `legalName`, `cif`, address, shareholder names, `dataRoomFiles` / file names |
| Signed-in investor | `investorProjectSelect` in `src/lib/investor-project.ts`: profile, CNAE, anonymous activity slices, headcount band, year statements | Same identity fields. NDA does not add them |
| Seller, own draft | Legal name, CIF, and address on `/mi-empresa/detalles` only | Those fields on `/proyectos`, `/mercado`, notices, or another user's page |
| Advisor, public list | Sectors, services, price range. The card says Asesor | Person's name, commercial name, NIF, email, documents, company legal name |
| Advisor hired by an investor, before their own NDA | Public ficha of that one company | Legal name, CIF, address, files. The investor's NDA does not open them |
| Advisor hired by an investor, after their own NDA | The same company view that investor can already see, including documents that investor can see | Other companies, and files that investor cannot see |
| Advisor hired by the seller | Folders and the process the seller opened | Other investors, and folders the seller did not open |
| Admin, on `/admin/empresas` only | Legal name, CIF, address, shareholder names, and data-room file names. A process chat is read-only and does not include an email | Those strings on every other route, including `/admin` Inicio and an investor page after the NDA |

Seller notices say "Un inversor" plus the codename. They do not include the investor's name or email. Copy lives in `src/lib/notifications.ts`.

## When changing a read

1. Parse input with Zod. Call a service in `src/server`. Do not query Prisma from a page or action.
2. Reuse `publicProjectSelect` / `publicProjectWhere` or `investorProjectSelect`. Add a column to the select only when this table allows that audience to see it.
3. Extend the matching test in `src/lib/public-project.test.ts` or `src/lib/investor-project.test.ts` so the private keys stay absent.
4. Money stays integer cents and is formatted in the UI.
5. For a rendered page, sign in as that role in the Cursor IDE browser and confirm the HTML does not contain the seeded identity strings: Duna Servicios, B11223344, Avenida Marítima, Lucía Herrera, impuestos-duna.pdf. A draft slug returns 404 on `/proyectos/[slug]`.
