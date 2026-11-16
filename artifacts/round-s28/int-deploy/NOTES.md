# Round S28 INT deploy notes

Not deployed. Do not deploy to production. Do not merge to main.

S28 is on branch `cursor/round-s28`, stacked on PR #35 (`cursor/round-s27`). Prerequisites and SQL are unchanged from S27; skip any step already applied on INT.

## Prerequisites

- R2 bucket `releva-int-uploads` bound as `INT_UPLOADS` on `releva-int` only (as S26b).
- No Prisma migration.
- Optional secrets on `releva-int`: `INT_APIEMPRESAS_API_KEY` (S26) and `HEALTHCHECK_TOKEN` (S27 deep health check):
  ```bash
  npx wrangler secret put HEALTHCHECK_TOKEN --name releva-int
  curl -s -H "x-health-token: $TOKEN" https://releva-int.<account>.workers.dev/api/health/deep
  ```

## SQL (INT Neon only, never the production database)

Apply in this order if not already applied. All three are additive and idempotent.

```bash
psql "$INT_DATABASE_URL" -v ON_ERROR_STOP=1 -f int-consultoria-years.sql
psql "$INT_DATABASE_URL" -v ON_ERROR_STOP=1 -f int-consultoria-buyer-fixtures.sql
psql "$INT_DATABASE_URL" -v ON_ERROR_STOP=1 -f int-s27-pipeline-advisors.sql
```

`int-s27-pipeline-advisors.sql` adds asesores int-asesor-valoracion / int-asesor-legal / int-asesor-fiscal @test.local with full profiles, seller int-vendedor-cartera@test.local with six published synthetic companies, and one int-comprador@test.local process per step (Conexión, NDA, Preguntas, Preguntas with LOI waiting, Revisión, Contrato). No password in the file: new logins copy the hash of int-asesor@test.local (asesores) or int-vendedor-manual@test.local (seller). See docs/INT.md.

## Pack

- commit: `3424d61d0d80e36a921d026e2b0fd383c1acce5c`
- `releva-int-deploy.tar.gz` SHA256 `fde523008d44e3756086b3ce20559e11d960c839c9d931e5844b6acbdac936a0`
- split parts `releva-int-deploy.tar.gz.part-aa`, `-ab` (cat them back together and check SHA256SUMS)

## Check after deploy

- The orange INT tag hangs from the top-right corner from 1024 px and sits after the bell on phones; "Tu progreso" on Detalles de empresa starts just below it.
- `/tendencias` shows image cards, three per row at 1280.
