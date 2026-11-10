# Round N INT deploy package

Built with `cloudflare.int.config.ts` swapped over `cloudflare.config.ts`, `prisma generate --no-hints`, `npm run build:vinext`, then `node scripts/package-int-worker.mjs`. `cloudflare.config.ts` was restored to Worker `releva` afterwards.

Worker: `releva-int`. This archive was **not** deployed. Never production Worker `releva`. Never prod DB.

## Reconstruct

```sh
cd artifacts/round-n-int-deploy
cat releva-int-deploy.tar.gz.part-* > releva-int-deploy.tar.gz
sha256sum -c SHA256SUMS
sha256sum releva-int-deploy.tar.gz
```

Expected SHA256 of `releva-int-deploy.tar.gz`:

```
cd941a621628edec81d824b359ba8afa3a2be06b8888fa021c4ab4388611fc37
```

## Operator upload (do not run from this agent)

Unpack, then from the unpacked directory with Wrangler authenticated to account `53808754f4bd94365d6e31351aa426c0`:

```sh
npx wrangler versions upload --name releva-int --keep-vars --message "round N INT"
npx wrangler versions deploy --name releva-int --yes <VERSION_ID>@100 --message "promote round N INT"
```

Secrets required at deploy (already on the Worker; not in this package):

- `INT_DATABASE_URL`
- `INT_BETTER_AUTH_SECRET`
- `INT_BETTER_AUTH_URL`

Vars in this package: `INT_ENVIRONMENT=true`, `INT_APPROVED_DB_HOST` (INT Neon). No email, uploads, IMAGES, AI, or EMAIL bindings.

## Migrations

`20261110190000_seller_financing_negotiable_to_yes` updates leftover `project.seller_financing = 'negotiable'` to `'yes'`. The column is a string, not a Postgres enum, so there is no DROP TYPE. Apply on INT Neon. Do not apply on prod from this agent. Code still reads leftover `negotiable` as Sí.
