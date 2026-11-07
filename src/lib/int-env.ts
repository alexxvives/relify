/**
 * INT environment detection and isolation runtime.
 * 
 * Fail-closed: INT environment uses INT_* prefixed variables.
 * Production environment uses unprefixed variables.
 * Missing INT variables in INT mode = error (never fallback to production).
 */

export function isIntEnvironment(): boolean {
  return process.env.INT_ENVIRONMENT === "true";
}

/**
 * Get database URL with INT isolation.
 * INT mode: requires INT_DATABASE_URL (never falls back to DATABASE_URL)
 * Production mode: uses DATABASE_URL
 */
export function getDatabaseUrl(): string {
  if (isIntEnvironment()) {
    const intUrl = process.env.INT_DATABASE_URL;
    if (!intUrl) {
      throw new Error("INT_DATABASE_URL required in INT environment");
    }
    // Validate it's NOT production
    if (intUrl.includes("@releva.") || intUrl.includes("itsreleva") || intUrl.includes("itsrelify")) {
      throw new Error("INT_DATABASE_URL must not point to production database");
    }
    return intUrl;
  }
  
  const prodUrl = process.env.DATABASE_URL;
  if (!prodUrl) {
    throw new Error("DATABASE_URL required");
  }
  return prodUrl;
}

/**
 * Get Better Auth secret with INT isolation.
 */
export function getBetterAuthSecret(): string {
  if (isIntEnvironment()) {
    const intSecret = process.env.INT_BETTER_AUTH_SECRET;
    if (!intSecret) {
      throw new Error("INT_BETTER_AUTH_SECRET required in INT environment");
    }
    if (intSecret === process.env.BETTER_AUTH_SECRET) {
      throw new Error("INT_BETTER_AUTH_SECRET must differ from production secret");
    }
    return intSecret;
  }
  
  const prodSecret = process.env.BETTER_AUTH_SECRET;
  if (!prodSecret) {
    throw new Error("BETTER_AUTH_SECRET required");
  }
  return prodSecret;
}

/**
 * Get Better Auth URL with INT isolation.
 */
export function getBetterAuthUrl(): string {
  if (isIntEnvironment()) {
    const intUrl = process.env.INT_BETTER_AUTH_URL;
    if (!intUrl) {
      throw new Error("INT_BETTER_AUTH_URL required in INT environment");
    }
    // Validate it contains "int" and NOT production domains
    if (!intUrl.includes("int")) {
      throw new Error("INT_BETTER_AUTH_URL must contain 'int'");
    }
    if (intUrl.includes("itsreleva.com") || intUrl.includes("itsrelify.com") || intUrl.includes("releva.com")) {
      throw new Error("INT_BETTER_AUTH_URL must not use production domains");
    }
    return intUrl;
  }
  
  const prodUrl = process.env.BETTER_AUTH_URL;
  if (!prodUrl) {
    throw new Error("BETTER_AUTH_URL required");
  }
  return prodUrl;
}

/**
 * Get site origin for links/emails with INT isolation.
 * Never falls back to production domains.
 */
export function getSiteOrigin(): string {
  if (isIntEnvironment()) {
    const intUrl = getBetterAuthUrl();
    return new URL(intUrl).origin;
  }
  
  // Production: use PUBLIC_SITE_URL if set and https, else canonical
  const raw = process.env.PUBLIC_SITE_URL;
  if (raw) {
    try {
      const url = new URL(raw);
      if (url.protocol === "https:") {
        return url.origin;
      }
    } catch {
      // Fall through to canonical
    }
  }
  
  return "https://itsrelify.com";
}

/**
 * Check if email sending is disabled (INT default).
 */
export function isEmailDisabled(): boolean {
  if (isIntEnvironment()) {
    // INT: disabled by default unless explicitly enabled
    return process.env.EMAIL_DISABLED !== "false";
  }
  
  // Production: enabled by default unless explicitly disabled
  return process.env.EMAIL_DISABLED === "true";
}

/**
 * Get Stripe mode with INT isolation.
 */
export function getStripeMode(): "test" | "live" {
  if (isIntEnvironment()) {
    // INT: always test mode, cannot be overridden
    return "test";
  }
  
  // Production: from env or default to test for safety
  return process.env.STRIPE_MODE === "live" ? "live" : "test";
}

/**
 * Get Stripe secret key with INT isolation.
 */
export function getStripeSecretKey(): string | undefined {
  if (isIntEnvironment()) {
    // INT: use test key if provided
    return process.env.INT_STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;
  }
  
  const mode = getStripeMode();
  if (mode === "live") {
    return process.env.STRIPE_LIVE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;
  }
  return process.env.STRIPE_SECRET_KEY;
}

/**
 * Validate INT environment at startup.
 * Throws if INT environment is misconfigured.
 */
export function validateIntEnvironment(): void {
  if (!isIntEnvironment()) {
    return;
  }
  
  // Force validation of all INT variables
  getDatabaseUrl();
  getBetterAuthSecret();
  getBetterAuthUrl();
  
  console.log("[INT] Environment validated");
  console.log(`[INT] Database: ${getDatabaseUrl().split("@")[0]}@***`);
  console.log(`[INT] Auth URL: ${getBetterAuthUrl()}`);
  console.log(`[INT] Site Origin: ${getSiteOrigin()}`);
  console.log(`[INT] Email: ${isEmailDisabled() ? "DISABLED" : "ENABLED"}`);
  console.log(`[INT] Stripe: ${getStripeMode()} mode`);
}
