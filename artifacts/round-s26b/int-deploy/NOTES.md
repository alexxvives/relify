# Round S26b INT deploy notes

Not deployed. Do not deploy to production. Do not merge to main.

S26b is on PR #34 (`cursor/round-s26-polish`), on top of S26.

## Fix

Signing the Acuerdo con Relify from the shell dialog redirected to the role home, which is usually the page the user was already on (e.g. /mi-empresa). That same-route redirect did not re-render the (app) shell, so the open dialog stayed and asked to sign again (the signature *was* saved; only a manual reload hid it). The action now returns `{ ok: true }`; the dialog shows "Acuerdo firmado", closes itself, refreshes the shell and fires the welcome confetti once.

## Prerequisites

Same as S26: R2 bucket `releva-int-uploads` bound as `INT_UPLOADS` on `releva-int` only; no Prisma migration; existing SQL files if missing; optional `INT_APIEMPRESAS_API_KEY`.

## Pack

- commit: `4a3f8427c47158d337459879125f705a8fb1ab74`
- `releva-int-deploy.tar.gz` SHA256 `d00c1916877a3615f47387d8820a460c85484897b2d8a82a322f35fe33ae9268`
