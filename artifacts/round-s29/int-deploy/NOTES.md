# Round S29 INT deploy notes

Not deployed. Do not deploy to production. Do not merge to main.

S29 is on branch `cursor/round-s29`, stacked on PR #36 (`cursor/round-s28`). Prerequisites are unchanged; the first three SQL files are the S27 ones (skip if applied) and `int-s29-national-ids.sql` is new.

## Prerequisites

- R2 bucket `releva-int-uploads` bound as `INT_UPLOADS` on `releva-int` only (as S26b).
- No Prisma migration.
- Optional secrets on `releva-int`: `INT_APIEMPRESAS_API_KEY` (S26) and `HEALTHCHECK_TOKEN` (S27 deep health check):
  ```bash
  npx wrangler secret put HEALTHCHECK_TOKEN --name releva-int
  curl -s -H "x-health-token: $TOKEN" https://releva-int.<account>.workers.dev/api/health/deep
  ```

## SQL (INT Neon only, never the production database)

Apply in this order if not already applied. All four are additive and idempotent.

```bash
psql "$INT_DATABASE_URL" -v ON_ERROR_STOP=1 -f int-consultoria-years.sql
psql "$INT_DATABASE_URL" -v ON_ERROR_STOP=1 -f int-consultoria-buyer-fixtures.sql
psql "$INT_DATABASE_URL" -v ON_ERROR_STOP=1 -f int-s27-pipeline-advisors.sql
psql "$INT_DATABASE_URL" -v ON_ERROR_STOP=1 -f int-s29-national-ids.sql
```

`int-s27-pipeline-advisors.sql` adds asesores int-asesor-valoracion / int-asesor-legal / int-asesor-fiscal @test.local with full profiles, seller int-vendedor-cartera@test.local with six published synthetic companies, and one int-comprador@test.local process per step (Conexión, NDA, Preguntas, Preguntas with LOI waiting, Revisión, Contrato). No password in the file: new logins copy the hash of int-asesor@test.local (asesores) or int-vendedor-manual@test.local (seller). See docs/INT.md.

## Pack

- commit: `439c96c1adcd30cf95b6aedf6c440b08335e359a`
- `releva-int-deploy.tar.gz` SHA256 `d63d9f9873a1dad3579a75e6b919863c5f29bc4288db6f4b28ab673efbe5ce8a`
- split parts `releva-int-deploy.tar.gz.part-aa`, `-ab` (cat them back together and check SHA256SUMS)

## Check after deploy

- Contrato in Mis procesos is the green step pill; the Avisos panel is ~360 px wide on desktop.
- After `int-s29-national-ids.sql`, signing as an @test.local account shows "Firmas con el DNI/NIE de tu cuenta: …" instead of a DNI field; no "Declaro que los datos…" checkbox anywhere.
