# Round S23b INT deploy notes

Not deployed. Do not deploy to production. Do not merge to main.

S23b is a small fix on PR #31: clicking the 3D Folder graphic or peeking papers on `/mi-empresa/documentos` opens the folder view.

## Create before this INT deploy (Alex)

Same as S23. Uploads stay enabled on isolated INT storage.

```bash
npx wrangler r2 bucket create releva-int-uploads
```

Bind `INT_UPLOADS` → `releva-int-uploads` on `releva-int` only. Never bind a production bucket. Object keys are `int/<file-id>`.

## SQL

No Prisma schema migration. Apply existing `int-consultoria-years.sql` and `int-consultoria-buyer-fixtures.sql` on INT if they are missing.

## Pack

- commit: `96e6ffb82864158bdc32d9906189d4b136a304cb`
- `releva-int-deploy.tar.gz` SHA256 `c1dae5b04e5a542409a25f67369bab41c49d1a31ce615f51e96ff14e069783e5`
