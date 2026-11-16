#!/usr/bin/env node
/**
 * S30: baseline Prisma Migrate on a database that was built with `prisma db push` (no _prisma_migrations table).
 *
 *   BASELINE_DATABASE_URL=… SHADOW_DATABASE_URL=… node scripts/prisma-baseline.mjs            # check only (default)
 *   BASELINE_DATABASE_URL=… SHADOW_DATABASE_URL=… node scripts/prisma-baseline.mjs --apply --yes
 *
 * Check: `prisma migrate diff --from-config-datasource --to-migrations prisma/migrations --exit-code`. It only reads
 * the target's catalog; the migrations are replayed on the SHADOW database (an empty scratch database, never the
 * target). Apply: only when the check is empty, `prisma migrate resolve --applied <name>` for every migration, oldest
 * first. That creates _prisma_migrations and inserts one row per migration; it runs no migration SQL.
 * Connection strings are read from the environment and never printed.
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const migrationsDir = join(root, "prisma/migrations");
const apply = process.argv.includes("--apply");
const confirmed = process.argv.includes("--yes");
const target = process.env.BASELINE_DATABASE_URL ?? "";
const shadow = process.env.SHADOW_DATABASE_URL ?? "";

function fail(message) {
  console.error(`baseline: ${message}`);
  process.exit(1);
}

if (!target || !shadow) fail("set BASELINE_DATABASE_URL (target) and SHADOW_DATABASE_URL (empty scratch database).");
if (target === shadow) fail("the shadow database must not be the target.");
if (apply && !confirmed) fail("--apply also needs --yes.");

const migrations = readdirSync(migrationsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && /^\d{14}_/.test(entry.name))
  .map((entry) => entry.name)
  .sort();

// Inside the repo so the config can import prisma/config from node_modules; removed in finally.
const dir = mkdtempSync(join(root, ".prisma-baseline-"));
// process.exit skips finally blocks; an exit handler always removes the temporary config.
process.on("exit", () => rmSync(dir, { recursive: true, force: true }));
const config = join(dir, "prisma.config.mjs");
writeFileSync(
  config,
  `import { defineConfig } from "prisma/config";
export default defineConfig({
  schema: ${JSON.stringify(join(root, "prisma/schema.prisma"))},
  migrations: { path: ${JSON.stringify(migrationsDir)} },
  datasource: { url: process.env.BASELINE_DATABASE_URL, shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL },
});
`,
);

function prisma(args) {
  return spawnSync("npx", ["prisma", ...args, "--config", config], { cwd: root, encoding: "utf8", env: process.env });
}

{
  const diff = prisma(["migrate", "diff", "--from-config-datasource", "--to-migrations", migrationsDir, "--script", "--exit-code"]);
  if (diff.status === 1) fail(`migrate diff failed:\n${diff.stderr}`);
  if (diff.status === 2) {
    console.log("baseline: the target differs from prisma/migrations. SQL that would align it (not run):\n");
    console.log(diff.stdout);
    fail("not baselined. Fix the drift first.");
  }
  console.log(`baseline: target matches prisma/migrations (${migrations.length} migrations, empty diff).`);

  if (!apply) {
    console.log("baseline: check only. Re-run with --apply --yes to mark them applied:");
    for (const name of migrations) console.log(`  npx prisma migrate resolve --applied ${name}`);
    process.exit(0);
  }

  const before = prisma(["migrate", "status"]);
  if (before.status === 0 && /Database schema is up to date/.test(before.stdout)) {
    console.log("baseline: _prisma_migrations already lists every migration. Nothing to do.");
    process.exit(0);
  }

  for (const name of migrations) {
    const result = prisma(["migrate", "resolve", "--applied", name]);
    if (result.status !== 0) fail(`resolve ${name} failed:\n${result.stderr}${result.stdout}`);
    console.log(`baseline: marked ${name} as applied`);
  }
  const status = prisma(["migrate", "status"]);
  console.log(status.stdout.split("\n").filter((line) => /migration|schema is up to date|not yet been applied/i.test(line)).join("\n"));
  process.exit(status.status ?? 1);
}
