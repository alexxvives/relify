# S30: vinext KV cache and Prisma baseline (prod and INT)

Prepared by Grok Bot on 2026-11-16 on branch `cursor/round-s30`. The bot didn't create anything on prod or change it. Every prod step below is for Alex to run.

## 1. `VINEXT_KV_CACHE` (vinext ISR / data cache)

**Why.** Workers Build `bfb15169` (main, ce3d49c) failed in `npx @vinext/cloudflare deploy` with: "This app uses ISR / caching but no cache adapter is configured… Configure the VINEXT_KV_CACHE namespace binding in cloudflare.config.ts."

**What changed in code.**
- `vite.config.ts`: `vinext({ cache: { data: kvDataAdapter() } })` from `@vinext/cloudflare/cache/kv-data-adapter`. The adapter reads the `VINEXT_KV_CACHE` binding and throws at runtime if it is missing.
- `cloudflare.config.ts` (prod worker `releva`): `VINEXT_KV_CACHE: bindings.kv({ id: RELEVA_VINEXT_KV_CACHE_ID })`. The id is a deliberate placeholder, `REPLACE_WITH_RELEVA_VINEXT_CACHE_NAMESPACE_ID`. Leaving the id out would make `cf deploy` auto-provision a namespace nobody tracks.
- `cloudflare.int.config.ts` and `scripts/package-int-worker.mjs` (INT worker `releva-int`): the binding points to the INT namespace `releva-int-vinext-cache`, id `5657d0bd1ac44f9a8b344f93cbc43d17`. The bot created that namespace (INT only). The packaged `wrangler.toml` and `worker.config.json` both carry it.

**Prod steps (Alex).**
1. Create the namespace, either in the dashboard (Storage & Databases → KV → Create, name `releva-vinext-cache`) or with `npx wrangler kv namespace create releva-vinext-cache`. The account is the Releva one (`53808754f4bd94365d6e31351aa426c0`).
2. Copy the namespace id it prints and replace `REPLACE_WITH_RELEVA_VINEXT_CACHE_NAMESPACE_ID` in `cloudflare.config.ts` (`RELEVA_VINEXT_KV_CACHE_ID`). Commit that one-line change on the PR branch, or right after the merge.
3. Merge. Workers Builds runs `npx @vinext/cloudflare deploy` with the binding.

If the PR is merged while the placeholder is still there, the Workers Build deploy step fails because the KV id doesn't exist, and the live version stays as it is. Set the real id first.

No secret is needed. The binding is a KV namespace id, not a credential.

## 2. Prisma Migrate baseline

**State (read-only checks, 2026-11-16).**

| Database | `_prisma_migrations` | Schema vs `prisma/migrations` |
| --- | --- | --- |
| Prod: Neon RELEVA `delicate-cloud-90142183`, db `neondb`, 46 tables | missing (no baseline) | identical: catalog fingerprint `ebac9f393bef5dec5b50871d05b4164d` (956 items) = fresh replay of all 51 migrations |
| INT: Neon RELEVA-INT `silent-rain-47735324`, db `releva_int`, 46 tables | missing (no baseline) | `9d039539729cf26394ae010e8bb416a2` (954 items): `advisor_profile.sectors` and `advisory_quote.services` are nullable (migrations: NOT NULL, 0 NULL rows on INT), plus one cosmetic NOT NULL constraint name on `listing_payment` |

The fingerprint is `scripts/schema-catalog-hash.sql`, which is read-only and covers columns, types, nullability, defaults, constraints, indexes and enums in `public`. The schema had drifted since `20261111120000_stripe_event`. The new migration `20261116220000_schema_catch_up`, generated with `prisma migrate diff --from-migrations --to-schema --script`, closes that drift. `prisma migrate diff --from-migrations prisma/migrations --to-schema prisma/schema.prisma --exit-code` is now empty. Existing databases must mark it applied, not run it.

**Script.** `scripts/prisma-baseline.mjs`:
- Check (the default, read-only on the target): `prisma migrate diff --from-config-datasource --to-migrations prisma/migrations --exit-code`. The migrations are replayed on `SHADOW_DATABASE_URL`, an empty scratch database that must never be the target.
- `--apply --yes`: only when the check is empty, runs `prisma migrate resolve --applied <name>` for every migration, oldest first, then `prisma migrate status`. That creates `_prisma_migrations` and inserts the rows. It runs no migration SQL. A re-run is a no-op.
- It never prints connection strings.
- Tested locally on Postgres 18: on a fresh replay the check is empty; apply marks all 51 and status reports "Database schema is up to date!"; a re-run does nothing.

**Prod steps (Alex, after the PR is merged).**
```bash
# Connection string: the RELEVA prod Neon string (the value of the worker secret DATABASE_URL). Don't paste it into files.
# Shadow: an empty scratch database, e.g. a new empty Neon branch/database or a local Postgres.
export BASELINE_DATABASE_URL='<RELEVA prod DATABASE_URL>'
export SHADOW_DATABASE_URL='<empty scratch database URL>'
node scripts/prisma-baseline.mjs              # expect: "target matches prisma/migrations (51 migrations, empty diff)."
node scripts/prisma-baseline.mjs --apply --yes
```
To do it by hand instead: run `npx prisma migrate resolve --applied <name>` for each folder in `prisma/migrations`, in name order (the check prints the exact list), with `DATABASE_URL` pointing at prod. Then run `npx prisma migrate status`.

From then on, deploy schema changes with `npx prisma migrate deploy`, never `db push`.

**INT steps (Alex).**
1. Apply `prisma/int-s30-align-array-not-null.sql` to `releva_int` (Neon SQL editor or `psql "$INT_DATABASE_URL" -f …`). It is idempotent. After it, the column fingerprint equals the migrations (verified on the local dev DB, which had the same drift).
2. `BASELINE_DATABASE_URL="$INT_DATABASE_URL" SHADOW_DATABASE_URL='<empty scratch>' node scripts/prisma-baseline.mjs`, then the same command with `--apply --yes`.
