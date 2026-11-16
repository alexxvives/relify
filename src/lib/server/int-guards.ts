/**
 * INT environment runtime guards.
 * Fail-closed enforcement for operations disabled in INT.
 */

import { intApiEmpresasConfigured, intPaymentsConfigured, isIntEnvironment } from "../int-env";
import { intMailConfigured } from "../int-mail";

/**
 * Uploads are allowed in INT with isolated storage (`INT_UPLOADS` R2 / `data/data-room/int`).
 * Size and type checks stay in the write path. Never points INT at prod storage.
 */
export function assertUploadsEnabled(): void {
  return;
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
 * Block external billable API calls in INT (fail-closed). S26: API Empresas is allowed only when
 * `INT_APIEMPRESAS_API_KEY` is set (Alex authorised the spend for testing the real CIF flow).
 */
export function shouldBlockExternalApi(apiName: string): boolean {
  if (!isIntEnvironment()) {
    return false;
  }
  if (apiName === "APIEMPRESAS" && intApiEmpresasConfigured()) {
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
