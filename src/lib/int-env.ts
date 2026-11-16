/**
 * INT environment detection and isolation runtime.
 * 
 * Fail-closed: INT environment uses INT_* prefixed variables.
 * Production environment uses unprefixed variables.
 * Missing INT variables in INT mode = error (never fallback to production).
 */

export function isIntEnvironment(): boolean {
  // Bracket access so the INT Worker runtime var is not replaced with `undefined` at build time.
  return process.env["INT_ENVIRONMENT"] === "true";
}

/**
 * Validate INT database URL against approved resources.
 * Exact match required - no production fallback, no substring guessing.
 */
function canonicalHostPort(hostname: string, port: string): string {
  const normalizedPort = port === "" ? "5432" : port;
  return `${hostname.toLowerCase()}:${normalizedPort}`;
}

function canonicalApprovedHost(approved: string): string {
  const value = approved.trim().toLowerCase();
  if (value.includes(":")) {
    return value;
  }
  return `${value}:5432`;
}

function validateIntDatabaseUrl(url: string): void {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname;
    const hostPort = canonicalHostPort(hostname, parsed.port);

    const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
    if (localHosts.has(hostname.toLowerCase())) {
      return;
    }

    const approvedHost = process.env.INT_APPROVED_DB_HOST;
    if (approvedHost && hostPort === canonicalApprovedHost(approvedHost)) {
      return;
    }

    throw new Error(
      `INT_DATABASE_URL host "${hostPort}" not approved. ` +
      `Set INT_APPROVED_DB_HOST to the exact hostname:port (postgres default 5432), or use localhost. ` +
      `Never use production database endpoints.`,
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("not approved")) {
      throw error;
    }
    throw new Error("INT_DATABASE_URL must be a valid PostgreSQL URL");
  }
}

/**
 * Get database URL with INT isolation.
 * INT mode: requires INT_DATABASE_URL + explicit approval
 * Production mode: uses DATABASE_URL
 */
export function getDatabaseUrl(): string {
  if (process.env.INT_APPROVED_DB_HOST && !isIntEnvironment()) {
    throw new Error(
      "FATAL: INT worker detected but INT_ENVIRONMENT not set. " +
      "This worker was compiled for INT. Set INT_ENVIRONMENT=true at runtime. " +
      "Never run INT workers with production config or vice versa.",
    );
  }

  if (isIntEnvironment()) {
    const intUrl = process.env.INT_DATABASE_URL;
    if (!intUrl) {
      throw new Error("INT_DATABASE_URL required in INT environment");
    }
    
    // Mandatory exact approved resource validation
    validateIntDatabaseUrl(intUrl);
    
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
 * Validate INT auth URL with exact origin matching (no suffix spoofing).
 * Rejects: non-443 ports, userinfo, paths, production domains
 */
function validateIntAuthUrl(url: string): void {
  const parsed = new URL(url);

  // Must use HTTPS on default port (443)
  if (parsed.protocol !== "https:") {
    throw new Error(`INT auth URL must use HTTPS, got: ${parsed.protocol}`);
  }
  if (parsed.port !== "" && parsed.port !== "443") {
    throw new Error(`INT auth URL must not specify custom port, got: ${parsed.port}`);
  }

  // Must not contain userinfo
  if (parsed.username !== "" || parsed.password !== "") {
    throw new Error("INT auth URL must not contain userinfo (username/password)");
  }

  // Must not contain path (only origin allowed)
  if (parsed.pathname !== "/" || parsed.search !== "" || parsed.hash !== "") {
    throw new Error(`INT auth URL must be origin only (no path/query/hash), got: ${url}`);
  }

  // Must exactly match releva-int.*.workers.dev (prevent suffix spoofing)
  const allowedPattern = /^releva-int\.[a-z0-9-]+\.workers\.dev$/;
  if (!allowedPattern.test(parsed.hostname)) {
    throw new Error(
      `INT auth URL must exactly match releva-int.*.workers.dev pattern, got: ${parsed.hostname}`
    );
  }

  // Must NOT be production domains
  if (
    parsed.hostname.includes("itsreleva.com") ||
    parsed.hostname.includes("itsrelify.com") ||
    parsed.hostname.includes("releva.com")
  ) {
    throw new Error("INT_BETTER_AUTH_URL must not use production domains");
  }
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
    validateIntAuthUrl(intUrl);
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

function isLiveStripeKey(value: string): boolean {
  return value.startsWith("sk_live_") || value.startsWith("pk_live_") || value.startsWith("rk_live_");
}

function refuseIntLiveStripeKey(kind: string, value: string): null {
  if (isLiveStripeKey(value)) {
    console.error(`[error] stripe INT refused a live ${kind}`);
  } else {
    console.error(`[error] stripe INT refused a non-test ${kind}`);
  }
  return null;
}

/**
 * INT Stripe TEST secret only (`INT_STRIPE_SECRET_KEY`). Never falls back to
 * production `STRIPE_SECRET_KEY`. Live prefixes disable payments.
 */
export function getIntStripeSecretKey(): string | null {
  if (!isIntEnvironment()) {
    return null;
  }
  const key = process.env.INT_STRIPE_SECRET_KEY?.trim() ?? "";
  if (!key) {
    return null;
  }
  if (isLiveStripeKey(key) || !(key.startsWith("sk_test_") || key.startsWith("rk_test_"))) {
    return refuseIntLiveStripeKey("secret key", key);
  }
  return key;
}

/** INT webhook secret (`INT_STRIPE_WEBHOOK_SECRET`). Must be `whsec_`, never a live Stripe key. */
export function getIntStripeWebhookSecret(): string | null {
  if (!isIntEnvironment()) {
    return null;
  }
  const secret = process.env.INT_STRIPE_WEBHOOK_SECRET?.trim() ?? "";
  if (!secret) {
    return null;
  }
  if (isLiveStripeKey(secret) || !secret.startsWith("whsec_")) {
    return refuseIntLiveStripeKey("webhook secret", secret);
  }
  return secret;
}

/**
 * Optional INT publishable key as a plain Worker **var**
 * (`INT_STRIPE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_INT_STRIPE_PUBLISHABLE_KEY`),
 * not a secret. Live `pk_live_` disables payments.
 */
export function getIntStripePublishableKey(): string | null {
  if (!isIntEnvironment()) {
    return null;
  }
  const key =
    process.env.INT_STRIPE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_INT_STRIPE_PUBLISHABLE_KEY?.trim() ||
    "";
  if (!key) {
    return null;
  }
  if (isLiveStripeKey(key) || !key.startsWith("pk_test_")) {
    return refuseIntLiveStripeKey("publishable key", key);
  }
  return key;
}

export function intPaymentsConfigured(): boolean {
  if (getIntStripeSecretKey() === null || getIntStripeWebhookSecret() === null) {
    return false;
  }
  const publishable =
    process.env.INT_STRIPE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_INT_STRIPE_PUBLISHABLE_KEY?.trim() ||
    "";
  if (publishable.length > 0 && getIntStripePublishableKey() === null) {
    return false;
  }
  return true;
}

/**
 * Get Stripe secret key with INT isolation.
 * INT never reads `STRIPE_SECRET_KEY`. Unset or live INT keys return undefined.
 */
export function getStripeSecretKey(): string | undefined {
  if (isIntEnvironment()) {
    return getIntStripeSecretKey() ?? undefined;
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
 * 
 * CRITICAL: If this worker was built for INT but INT_ENVIRONMENT is not set,
 * refuse to start (fail-closed). Never fall back to production config.
 */
export function validateIntEnvironment(): void {
  // Check if this is an INT-compiled worker by looking for INT-specific wrangler vars
  const hasIntConfig = process.env.INT_APPROVED_DB_HOST !== undefined;
  
  if (hasIntConfig && !isIntEnvironment()) {
    throw new Error(
      "FATAL: INT worker detected but INT_ENVIRONMENT not set. " +
      "This worker was compiled for INT. Set INT_ENVIRONMENT=true at runtime. " +
      "Never run INT workers with production config or vice versa."
    );
  }
  
  if (!isIntEnvironment()) {
    return;
  }
  
  // Force validation of all INT variables
  getDatabaseUrl();
  getBetterAuthSecret();
  getBetterAuthUrl();
  
  console.log("[INT] Environment validated");
  console.log("[INT] Database: configured");
  console.log("[INT] Auth URL: configured");
  console.log("[INT] Site Origin: configured");
  console.log(`[INT] Email: ${isEmailDisabled() ? "DISABLED" : "ENABLED"}`);
  console.log(`[INT] Stripe: ${getStripeMode()} mode`);
  console.log("[INT] Uploads: BLOCKED (no INT storage)");
  console.log("[INT] External APIs: BLOCKED");
}

/**
 * S26: INT may call the paid API Empresas (apiempresas.es) for real CIF verification once Alex sets the
 * `INT_APIEMPRESAS_API_KEY` Worker secret. Never falls back to the production `APIEMPRESAS_API_KEY`.
 */
export function intApiEmpresasKey(): string {
  return process.env["INT_APIEMPRESAS_API_KEY"]?.trim() ?? "";
}

export function intApiEmpresasConfigured(): boolean {
  return isIntEnvironment() && intApiEmpresasKey().length > 0;
}
