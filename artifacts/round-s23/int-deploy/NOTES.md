# Round S23 INT deploy notes

Not deployed. Do not deploy to production. Do not merge to main.

## Create before this INT deploy (Alex)

Uploads are enabled on INT in this pack. Storage is isolated from prod.

```bash
npx wrangler r2 bucket create releva-int-uploads
```

The pack already binds `INT_UPLOADS` → `releva-int-uploads` in `wrangler.toml` and `worker.config.json`. Object keys are `int/<file-id>`. Never bind a production R2 bucket here.

If the bucket is missing, Worker uploads fall through to ephemeral disk and files will not persist.

Size cap remains 20 MB. Existing type allowlists stay.

## SQL

No Prisma schema migration. Apply existing `int-consultoria-years.sql` and `int-consultoria-buyer-fixtures.sql` on INT if they are missing.

## Pack

- commit: `4eac3dc11e9cbda8d42c828347fba0852a88a5bf`
- `releva-int-deploy.tar.gz` SHA256 `4935550b1534c9b960f97eeb046550721567211d3382f926333bb35790b27d67`
