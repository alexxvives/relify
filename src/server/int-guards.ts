/**
 * INT environment runtime guards.
 * Fail-closed enforcement for operations disabled in INT.
 */

import { isIntEnvironment } from "@/lib/int-env";

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
  if (!isIntEnvironment()) {
    return false;
  }
  
  // INT: blocked by default, explicit override required
  return process.env.INT_EMAIL_ENABLED !== "true";
}

/**
 * Block all payment creation/webhooks in INT (fail-closed).
 * Throws error in INT mode unless explicitly enabled.
 */
export function assertPaymentsEnabled(): void {
  if (isIntEnvironment() && process.env.INT_PAYMENTS_ENABLED !== "true") {
    throw new Error(
      "Payment operations disabled in INT environment. " +
      "Set INT_PAYMENTS_ENABLED=true only for explicit INT payment testing."
    );
  }
}

/**
 * Block external billable API calls in INT (fail-closed).
 * Returns true if external API should be blocked.
 */
export function shouldBlockExternalApi(apiName: string): boolean {
  if (!isIntEnvironment()) {
    return false;
  }
  
  // INT: external APIs blocked by default
  const enabled = process.env.INT_EXTERNAL_APIS_ENABLED === "true";
  if (!enabled) {
    console.log(`[INT] External API blocked: ${apiName}`);
  }
  return !enabled;
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
