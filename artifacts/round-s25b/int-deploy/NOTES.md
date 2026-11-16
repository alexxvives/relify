# Round S25b INT deploy notes

Not deployed. Do not deploy to production. Do not merge to main.

S25b is on PR #33 (same branch as S25). Fix: Ubicación counts as complete whenever the wizard shows it filled (for example the seed seller Prado's `08022, Barcelona` kept only in the composed `address`), with the same rule in the wizard, the Inicio checklist and the publish/approve checks.

## Prerequisites

Same as S25/S24: R2 bucket `releva-int-uploads` bound as `INT_UPLOADS` on `releva-int` only. No Prisma schema migration. Apply existing `int-consultoria-years.sql` and `int-consultoria-buyer-fixtures.sql` on INT if missing. CSP connect-src allows Photon and Nominatim (from S25).

## Pack

- commit: `f5080b1fe81d0e3e164c075776f4da3bb83af6d2`
- `releva-int-deploy.tar.gz` SHA256 `78355e873036b88d7772127c19ef468155e9933fbcae010643a4a014f2b2c2ca`
