# Releva

Confidential marketplace for SME business sales. The product UI follows Deale.

The app runs locally with `npm run dev`. Start at `AGENTS.md`, then `docs/STATUS.md`.

## Deploy (Cloudflare Workers)

Production deploys are **Alex only**, after INT is validated. Agents must never deploy.

`npm run deploy` and `npm run deploy:vinext` call `scripts/deploy-prod.mjs`, which refuses unless all of these are true:

1. `RELIFY_DEPLOY_PROD=yes` in that shell
2. Git branch is `main`
3. The command is on an interactive TTY
4. You type the production worker name `releva` to confirm

Then it runs, in order:

1. `prisma generate`
2. `prisma db push`, which syncs the production schema with `prisma/schema.prisma` before the new Worker goes live. It runs **without** `--accept-data-loss`, so Prisma stops the deploy instead of dropping a column or table. If it stops, write the data migration by hand and run it first.
3. `vinext-cloudflare deploy`

Do not run `npx vinext-cloudflare deploy` or `wrangler deploy` against Worker `releva` to skip the guard. INT uses `scripts/deploy-int.sh`.

`DATABASE_URL` has to point at the production database in the shell that runs the deploy. The Worker reads `DATABASE_URL`, `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` as secrets. For `npm run dev:vinext`, put them in `.dev.vars` (gitignored).
