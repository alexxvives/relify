# Relify

Confidential marketplace for SME business sales. The product UI follows Deale.

Start at `AGENTS.md`, then `docs/STATUS.md`. Layout and domain rules: `ARCHITECTURE.md`.

## Structure

```
src/app/                    Next.js App Router (routes must live under src/)
src/components/ui/          shadcn primitives
src/components/<feature>/   feature UI
src/lib/                    shared helpers and Zod schemas
src/lib/client/             browser-only helpers
src/lib/server/             auth and domain services
src/lib/db/                 Prisma client
tests/unit/                 Vitest
tests/e2e/                  Playwright (`tests/e2e/playwright.config.ts`)
scripts/                    INT pack, seeds, deploy guards
docs/                       product docs
prisma/                     schema and migrations
```

Root configs that the tools require: `next.config.ts`, `vite.config.ts`, `vitest.config.ts`, `cloudflare.config.ts`, `tsconfig.json`, `eslint.config.mjs`.

## Commands

| Script | What it does |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run test` | Vitest (`tests/unit`) |
| `npm run e2e` | Playwright (desktop 1280 and mobile 390) |
| `npm run build:vinext` | Cloudflare Worker build |
| `npm run deploy` | Production Worker **Alex only** (guarded) |

INT packaging is `node scripts/package-int-worker.mjs` after `npm run build:vinext`. Deploy INT with `scripts/deploy-int.sh`. Agents must never deploy production.

Copy `.env.example` to `.env`. Required names are in `TECH_STACK.md`.

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

## Free launch mode (`LAUNCH_FREE_MODE`)

Server-only flag, off by default. With `LAUNCH_FREE_MODE=true` on the Worker:

- every buyer gets the unlimited plan through the central entitlement (`loadBuyerPlan`); no Stripe subscription or billing row is created;
- advisors appear in the directory and accept encargos without the advisor subscription;
- the advisor deposit is waived: "Aceptar encargo" stamps the encargo as accepted with 0 € and no Checkout session, so no refund applies (such encargos stay accepted if the flag is later turned off);
- sellers publish additional companies without the listing payment;
- every checkout and upgrade CTA shows "Gratis durante el lanzamiento", and the checkout starters refuse to call Stripe.

Buyers who already pay a real subscription can still manage or cancel it at `/premium/suscripcion`. Success fees at closing and the advisor's 15 % platform fee are not affected. The buyer plan stored at match time stays the real one.

INT sets it as a plain var in `scripts/package-int-worker.mjs`. For production, Alex adds the plain var `LAUNCH_FREE_MODE = "true"` to Worker `releva` (Cloudflare dashboard, Settings, Variables, or the `[vars]` of the prod config) and redeploys. To end the launch, remove the var or set it to anything else.
