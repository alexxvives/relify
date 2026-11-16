/**
 * Production Worker deploy. Refuses unless RELIFY_DEPLOY_PROD=yes, the git
 * branch is main, stdin is a TTY, and the operator types `releva`.
 * Agents must never run this. INT uses scripts/deploy-int.sh.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { stdin, stdout, env, exit } from "node:process";
import { prodDeployPreconditions, prodDeployRefusal, PROD_WORKER_NAME } from "./prod-deploy-guard.mjs";

function gitBranch() {
  try {
    return execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", shell: process.platform === "win32" });
  if (result.status !== 0) {
    exit(result.status ?? 1);
  }
}

function refuse(message) {
  stdout.write(`${message}\n`);
  exit(1);
}

const branch = gitBranch();
const isTty = Boolean(stdin.isTTY && stdout.isTTY);

const blockedBeforePrompt = prodDeployPreconditions({
  flag: env.RELIFY_DEPLOY_PROD,
  branch,
  intEnvironment: env.INT_ENVIRONMENT,
  isTty,
});

if (blockedBeforePrompt) {
  refuse(blockedBeforePrompt);
}

stdout.write(
  `This deploys the production Worker \`${PROD_WORKER_NAME}\`.\nOnly Alex should do this after validating INT. Agents must never deploy production.\n`,
);

const rl = createInterface({ input: stdin, output: stdout });
const typed = (await rl.question("Type the worker name to continue: ")).trim();
rl.close();

const blocked = prodDeployRefusal({
  flag: env.RELIFY_DEPLOY_PROD,
  branch,
  intEnvironment: env.INT_ENVIRONMENT,
  isTty: true,
  typedWorker: typed,
});

if (blocked) {
  refuse(blocked);
}

run("npx", ["prisma", "generate"]);
run("npx", ["prisma", "db", "push"]);
run("npx", ["vinext-cloudflare", "deploy"]);
