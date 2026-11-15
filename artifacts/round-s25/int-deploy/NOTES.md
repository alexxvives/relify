# Round S25 INT deploy notes

Not deployed. Do not deploy to production. Do not merge to main.

S25 is stacked on PR #32. Signed-in density, ficha (open sections, one-line section bar, Ver planes top-left), /procesos actions, /cuenta layout, buyer Ubicación with OpenStreetMap autocomplete (Photon, Nominatim fallback; keyless, no billable APIs), Añadir sector combobox, seller wizard (Estructura step 2, Datos de la ficha step 3, unlimited secondary CNAEs, saves never blocked by missing fields, Falta para publicar list, retry re-sends the same save).

## Create before this INT deploy (Alex)

Same as S24: R2 bucket `releva-int-uploads` bound as `INT_UPLOADS` on `releva-int` only. Never bind a production bucket.

## SQL

No Prisma schema migration. Apply existing `int-consultoria-years.sql` and `int-consultoria-buyer-fixtures.sql` on INT if they are missing.

## CSP

connect-src now also allows `https://photon.komoot.io` and `https://nominatim.openstreetmap.org` (browser-side place lookups).

## Pack

- commit: `d744897ded7e0e1bd38a4cb7237791b84be4c27e`
- `releva-int-deploy.tar.gz` SHA256 `256301a7877894495f01a7f2eda772d7618b8452c41ded89b3f16ebae1f96c70`
