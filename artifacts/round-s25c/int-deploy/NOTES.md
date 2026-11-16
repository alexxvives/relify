# Round S25c INT deploy notes

Not deployed. Do not deploy to production. Do not merge to main.

S25c is on PR #33 (same branch). The S25b "Ubicación missing" report was a false alarm: Prado's location is empty and the wizard's hardcoded placeholder `08022, Barcelona` looked like a value. Placeholders are now example-style ("Ej.: …") or neutral in a lighter regular-weight colour, and the Ubicación checklist items (wizard and Inicio) focus the location input. The S25b shared location rule stays.

## Prerequisites

Same as S25/S24: R2 bucket `releva-int-uploads` bound as `INT_UPLOADS` on `releva-int` only. No Prisma schema migration. Apply existing `int-consultoria-years.sql` and `int-consultoria-buyer-fixtures.sql` on INT if missing.

## Pack

- commit: `3d56318df7ca2af85d6dbb6a2bd900b9c24365f4`
- `releva-int-deploy.tar.gz` SHA256 `bc80a385aa0541a1138ea954061215312317af655871e6090be805899ccf3f40`
