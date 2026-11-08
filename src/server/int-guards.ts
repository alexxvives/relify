/**
 * INT environment runtime guards.
 * Fail-closed enforcement for operations disabled in INT.
 */

import { isIntEnvironment } from "../lib/int-env";

/**
 * Block all file uploads in INT until dedicated persistent storage is wired.
 * Throws error in INT mode, no-op in production.
 */
export function assertUploadsEnabled(): void {
  if (isIntEnvironment()) {
    throw new Error(
      "File uploads disabled in INT environment. " +
      "INT requires dedicated isolated persistent storage binding. " +
      "Configure INT_UPLOADS_ENABLED=true only after storage isolation verified."
    );
  }
}

/**
 * Block all outbound email in INT (fail-closed, no accidental enable).
 * Returns true if email should be blocked.
 */
export function shouldBlockEmail(): boolean {
  return isIntEnvironment();
}

/**
 * Block all payment creation/webhooks in INT (fail-closed, no override).
 */
export function assertPaymentsEnabled(): void {
  if (isIntEnvironment()) {
    throw new Error(
      "Payment operations disabled in INT environment. " +
      "No INT payment override is accepted.",
    );
  }
}

/**
 * Block external billable API calls in INT (fail-closed, no override).
 */
export function shouldBlockExternalApi(apiName: string): boolean {
  if (!isIntEnvironment()) {
    return false;
  }
  console.log(`[INT] External API blocked: ${apiName}`);
  return true;
}

/**
 * Block webhook delivery in INT (fail-closed).
 * Returns true if webhook should be blocked.
 */
export function shouldBlockWebhook(webhookType: string): boolean {
  if (!isIntEnvironment()) {
    return false;
  }
  
  console.log(`[INT] Webhook blocked: ${webhookType}`);
  return true;
}
