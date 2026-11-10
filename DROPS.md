# Dropped columns

## Round P — `project.net_debt_cents`, `project.working_capital_cents`

Migration: `prisma/migrations/20261110200000_drop_project_net_debt_working_capital/migration.sql`

These were snapshot columns on the company, filled on SABI import and then left stale. Deuda neta and fondo de maniobra are now always computed from that year's balance:

- Deuda neta (DFN) = deuda financiera a largo + deuda financiera a corto − caja
- Fondo de maniobra = activo corriente − pasivo corriente

`project_year.working_capital_cents` stays as the SABI-stored line; the UI does not read it for the headline figure.

Apply to INT first; Alex applies to prod. Prisma no longer maps the two project columns, so leftover prod columns are ignored until the DROP runs.

---

# Round M dropped columns

Prisma no longer maps these fields, so a `findMany` / `select` never includes them. Extra columns that still exist on production until this migration is applied there are ignored by the client.

Migration: `prisma/migrations/20261110180000_drop_unused_project_profile_columns/migration.sql`

No tables were dropped. Audit: every `model` in `prisma/schema.prisma` is still written or read by a live flow (auth, drafts, SABI, data room, messages, billing, waitlist, notices). The only unused **columns** were the three below.

## `project.seasonality`

- Added in `20261109200000_business_profile_and_price_includes`.
- Round L hid the Estacionalidad control; the form posted a hidden leftover and `saveCompanyDraft` still wrote it.
- No remaining UI, validation, seed, or ficha display reads it after Round M.
- Evidence: `rg seasonality src prisma` after this change is empty except this file and the additive INT migration that created it.

## `project.seasonality_note`

- Same additive migration. The seller UI stopped asking for a note in Round L (`seasonalityNote: ""` on every save; `getCompanyDraft` always returned `""`).
- Never shown on the ficha (`toInvestorProject` forced `seasonalityNote: null`).
- Evidence: no form control, no report Fact, no seed value.

## `project.top5_clients_pct`

- Same additive migration. Round L dropped the “peso de los 5 principales clientes” input; saves sent `""` and the column was not updated.
- The ficha figure (when shown) was **derived** from `activity_slice` client rows via `topClientsWeightPct`, never from this column.
- After Round M the derived figure is gone too (business-profile Facts removed from the ficha). The helper stays for tests.
- Evidence: `saveCompanyDraft` had an explicit comment that the UI no longer writes this column.

## Prod tolerance

Removing the fields from `schema.prisma` means the generated Prisma Client will not SELECT or UPDATE them. Production may keep the three columns until Alex runs this DROP. That is safe: unused extra columns are ignored.
