/**
 * Package a credential-free INT Worker deploy directory from the vinext build.
 * Does not deploy. Rewrites generated production worker.config.json.
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, ".cloudflare/output/v0/workers/default");
const staging = "/tmp/releva-int-pack";
const approvedHost = "ep-steep-boat-b954u39t.c-7.eu-central-1.aws.neon.tech:5432";
const commit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
const lockHash = createHash("sha256").update(readFileSync(join(root, "package-lock.json"))).digest("hex");

rmSync(staging, { recursive: true, force: true });
mkdirSync(staging, { recursive: true });
cpSync(source, staging, { recursive: true });

writeFileSync(
  join(staging, "wrangler.toml"),
  `name = "releva-int"
main = "bundle/index.js"
compatibility_date = "2026-10-03"
compatibility_flags = ["nodejs_compat"]
account_id = "53808754f4bd94365d6e31351aa426c0"
workers_dev = true

[observability]
enabled = true

[vars]
INT_ENVIRONMENT = "true"
INT_APPROVED_DB_HOST = "${approvedHost}"

[assets]
directory = "assets"
binding = "ASSETS"
`,
);

writeFileSync(
  join(staging, "worker.config.json"),
  `${JSON.stringify(
    {
      name: "releva-int",
      account_id: "53808754f4bd94365d6e31351aa426c0",
      workers_dev: true,
      compatibility_date: "2026-10-03",
      compatibility_flags: ["nodejs_compat"],
      vars: {
        INT_ENVIRONMENT: "true",
        INT_APPROVED_DB_HOST: approvedHost,
      },
      secrets: ["INT_DATABASE_URL", "INT_BETTER_AUTH_SECRET", "INT_BETTER_AUTH_URL"],
      bindings: [{ name: "ASSETS", type: "assets", directory: "assets" }],
    },
    null,
    2,
  )}\n`,
);

writeFileSync(
  join(staging, "INT-BUILD-MANIFEST.json"),
  `${JSON.stringify(
    {
      commit,
      package_lock_sha256: lockHash,
      built_at: new Date().toISOString(),
      worker: {
        name: "releva-int",
        account_id: "53808754f4bd94365d6e31351aa426c0",
        workers_dev: true,
        assets: "assets",
      },
      vars: {
        INT_ENVIRONMENT: "true",
        INT_APPROVED_DB_HOST: approvedHost,
      },
      secrets_required: ["INT_DATABASE_URL", "INT_BETTER_AUTH_SECRET", "INT_BETTER_AUTH_URL"],
      absent: [
        "MAILEROO_API_KEY",
        "EMAIL",
        "AI",
        "IMAGES",
        "STRIPE_SECRET_KEY",
        "CONTEXT7_API_KEY",
        "EINFORMA_API_KEY",
        "APIEMPRESAS_API_KEY",
      ],
    },
    null,
    2,
  )}\n`,
);

const archive = "/tmp/releva-int-deploy.tar.gz";
execFileSync("tar", ["czf", archive, "-C", staging, "."]);
console.log(`packed ${archive} commit=${commit}`);
