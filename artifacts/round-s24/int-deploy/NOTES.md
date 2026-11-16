# Round S24 INT deploy notes

Not deployed. Do not deploy to production. Do not merge to main.

S24 is stacked on PR #31. Registro/profile polish, Precio de venta filter, honest INT CIF lookup (mock CIF `B12345674` → Obrador Ficticio; no billable APIs), seller financing Sí/No.

## Create before this INT deploy (Alex)

Same as S23. Uploads stay enabled on isolated INT storage.

```bash
npx wrangler r2 bucket create releva-int-uploads
```

Bind `INT_UPLOADS` → `releva-int-uploads` on `releva-int` only. Never bind a production bucket. Object keys are `int/<file-id>`.

## SQL

No Prisma schema migration. Apply existing `int-consultoria-years.sql` and `int-consultoria-buyer-fixtures.sql` on INT if they are missing.

## CIF mock (INT only)

`B12345674` returns the seed company Obrador Ficticio Norte S.L. Any other CIF returns a miss. Completing a miss does not claim data was filled.

## Pack

- commit: `2a3e8d27d91fec1259eda1e47df1089c6a559005`
- `releva-int-deploy.tar.gz` SHA256 `75752b0f1fc31222ec1f3f771b380409fa07c9516b7bc2be4f192846fc1af305`
