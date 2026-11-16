# Round S27 INT deploy notes

Not deployed. Do not deploy to production. Do not merge to main.

S27 is on branch `cursor/round-s27`, stacked on PR #34 (`cursor/round-s26-polish`).

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

- commit: `e52523ff242846b6ae7665c500fca685f83f6e30`
- `releva-int-deploy.tar.gz` SHA256 `f305430ad0c54db5eb5abc20048aa44604705887811b4726af583df220642f3d`
- split parts `releva-int-deploy.tar.gz.part-aa`, `-ab` (cat them back together and check SHA256SUMS)
