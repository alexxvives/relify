/** Production Worker name in `cloudflare.config.ts`. INT uses `releva-int`. */
export const PROD_WORKER_NAME = "releva";

export const PROD_DEPLOY_FLAG = "RELIFY_DEPLOY_PROD";

export function prodDeployPreconditions(input) {
  if (input.intEnvironment === "true") {
    return "Production deploy refused: INT_ENVIRONMENT=true. Use the INT deploy script, never the production Worker.";
  }

  if (input.flag !== "yes") {
    return `Production deploy refused: set ${PROD_DEPLOY_FLAG}=yes in the same shell, then confirm interactively on main.`;
  }

  if (input.branch !== "main") {
    return `Production deploy refused: branch is '${input.branch}', not main.`;
  }

  if (!input.isTty) {
    return "Production deploy refused: interactive confirmation requires a TTY. Agents must never deploy production.";
  }

  return null;
}

export function prodDeployRefusal(input) {
  const early = prodDeployPreconditions(input);

  if (early) {
    return early;
  }

  if (input.typedWorker !== PROD_WORKER_NAME) {
    return `Production deploy refused: type the production worker name (${PROD_WORKER_NAME}) to confirm.`;
  }

  return null;
}
