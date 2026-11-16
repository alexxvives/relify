# Round S26 INT deploy notes

Not deployed. Do not deploy to production. Do not merge to main.

S26 is a new PR stacked on PR #33 (`cursor/round-s25-density-forms`).

## Prerequisites

- Same as S25/S24: R2 bucket `releva-int-uploads` bound as `INT_UPLOADS` on `releva-int` only. No Prisma schema migration. Apply existing `int-consultoria-years.sql` and `int-consultoria-buyer-fixtures.sql` on INT if missing.
- Optional (paid, authorised by Alex): `npx wrangler secret put INT_APIEMPRESAS_API_KEY --name releva-int` to verify real CIFs with API Empresas (apiempresas.es). Without it INT keeps the B12345674 mock only. The production `APIEMPRESAS_API_KEY` is never read in INT.

## Behaviour changes to check on INT

- Accounts created since S22 (and INT seed accounts stamped at creation without a signature) are asked to sign the Acuerdo con Relify on their next visit.

## Pack

- commit: `0b7eca3c49dad7aa5fa63c51a443c65962d0c478`
- `releva-int-deploy.tar.gz` SHA256 `061a7192b9e3a13c54d7d6a26101d0c2b16894e527cc9d0279f3cb0e98a77d67`
- split parts `releva-int-deploy.tar.gz.part-aa/ab` (20 MiB); `cat releva-int-deploy.tar.gz.part-* > releva-int-deploy.tar.gz`
