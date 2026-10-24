# Releva

Confidential marketplace for SME business sales. The product UI follows Deale.

The app runs locally with `npm run dev`. Start at `AGENTS.md`, then `docs/STATUS.md`.

## Deploy (Cloudflare Workers)

`npm run deploy:vinext` runs, in order:

1. `prisma generate`
2. `prisma db push`, which syncs the production schema with `prisma/schema.prisma` before the new Worker goes live. It runs **without** `--accept-data-loss`, so Prisma stops the deploy instead of dropping a column or table. If it stops, write the data migration by hand and run it first.
3. `vinext-cloudflare deploy`

`DATABASE_URL` has to point at the production database in the shell that runs the deploy. The Worker reads `DATABASE_URL`, `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` as secrets. For `npm run dev:vinext`, put them in `.dev.vars` (gitignored).
