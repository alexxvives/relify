# Round S29b INT deploy notes

Not deployed. Do not deploy to production. Do not merge to main.

S29b is on branch `cursor/round-s29` (PR #37, stacked on PR #36 / `cursor/round-s28`). Prerequisites are unchanged; the first four SQL files are the S27/S29 ones (skip if applied) and `int-s29b-tajo-contrato.sql` is new.

## Prerequisites

- R2 bucket `releva-int-uploads` bound as `INT_UPLOADS` on `releva-int` only (as S26b).
- No Prisma migration. `project_access.diligence_passed_at` stays in the schema and is no longer read.
- Optional secrets on `releva-int`: `INT_APIEMPRESAS_API_KEY` (S26) and `HEALTHCHECK_TOKEN` (S27 deep health check).

## SQL (INT Neon only, never the production database)

Apply in this order if not already applied. All five are additive and idempotent.

```bash
psql "$INT_DATABASE_URL" -v ON_ERROR_STOP=1 -f int-consultoria-years.sql
psql "$INT_DATABASE_URL" -v ON_ERROR_STOP=1 -f int-consultoria-buyer-fixtures.sql
psql "$INT_DATABASE_URL" -v ON_ERROR_STOP=1 -f int-s27-pipeline-advisors.sql
psql "$INT_DATABASE_URL" -v ON_ERROR_STOP=1 -f int-s29-national-ids.sql
psql "$INT_DATABASE_URL" -v ON_ERROR_STOP=1 -f int-s29b-tajo-contrato.sql
```

`int-s27-pipeline-advisors.sql` only changed in two comments (Agencia Tajo is now shown at Contrato); its rows are the same. `int-s29b-tajo-contrato.sql` needs no data change for the step itself (an accepted LOI now opens the contract). It adds two avisos, "Sube el contrato de Agencia Tajo" for int-vendedor-cartera@test.local and "Agencia Tajo está en Contrato" for int-comprador@test.local, with `ON CONFLICT (id) DO NOTHING`. It skips both if the Tajo process is missing.

## Pack

- commit: `ff102fb4e5dfa7559ac457aa31dbbf76766dd3d1`
- `releva-int-deploy.tar.gz` SHA256 `b21d6eb4ceae706c1ad61efd0326b4adb71da8b165dc2f7ae7cd6b39a64e31a8`
- split parts `releva-int-deploy.tar.gz.part-aa`, `-ab` (cat them back together and check SHA256SUMS)

## Check after deploy

- Mis procesos shows seven steps (Solicitud, Conexión, NDA, Preguntas, LOI, Contrato, Venta); there is no Revisión and no "Seguir a documentación".
- As int-vendedor-cartera, Agencia Tajo is at Contrato and the contract upload is open; Contacta con un asesor stays in the bottom-right row from Preguntas through Contrato.
- Asesoramiento cards read "Desde X €" (or one price when from = to).
- The Acuerdo con Relify dialog and /acuerdo have no DNI/NIE field and show "Firmas con el DNI/NIE de tu cuenta: …" (masked). An onboarded, unsigned account without a DNI/NIE goes to /onboarding?paso=dni first.
