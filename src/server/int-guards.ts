/**
 * INT environment runtime guards.
 * Fail-closed enforcement for operations disabled in INT.
 */

import { intPaymentsConfigured, isIntEnvironment } from "../lib/int-env";
import { intMailConfigured } from "../lib/int-mail";

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
 * INT still fail-closed until Alex sets INT_MAILEROO_API_KEY and INT_EMAIL_CATCHALL as Worker secrets.
 * When both are set, sendMail still rewrites every To to the catch-all.
 */
export function shouldBlockEmail(): boolean {
  if (!isIntEnvironment()) {
    return false;
  }
  return !intMailConfigured();
}

/**
 * INT payments stay disabled unless TEST keys are set
 * (`INT_STRIPE_SECRET_KEY` + `INT_STRIPE_WEBHOOK_SECRET`). Live prefixes
 * (`sk_live_` / `pk_live_` / `rk_live_`) log and keep payments off.
 */
export function assertPaymentsEnabled(): void {
  if (!isIntEnvironment()) {
    return;
  }
  if (intPaymentsConfigured()) {
    return;
  }
  throw new Error(
    "Payment operations disabled in INT environment. " +
      "Set INT_STRIPE_SECRET_KEY (sk_test_) and INT_STRIPE_WEBHOOK_SECRET (whsec_) for Stripe TEST mode.",
  );
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
