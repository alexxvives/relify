import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  getBetterAuthUrl,
  getDatabaseUrl,
  getIntStripePublishableKey,
  getIntStripeSecretKey,
  getIntStripeWebhookSecret,
  intPaymentsConfigured,
  isIntEnvironment,
  validateIntEnvironment,
} from "@/lib/int-env";
import {
  assertPaymentsEnabled,
  assertUploadsEnabled,
  shouldBlockEmail,
  shouldBlockExternalApi,
} from "@/lib/server/int-guards";

const NEON_HOST = "ep-steep-boat-b954u39t.c-7.eu-central-1.aws.neon.tech";
const NEON_URL = `postgresql://int_user:pass@${NEON_HOST}/neondb?sslmode=require`;
const AUTH_ORIGIN = "https://releva-int.account.workers.dev";

describe("INT environment isolation", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.INT_ENVIRONMENT;
    delete process.env.INT_DATABASE_URL;
    delete process.env.INT_APPROVED_DB_HOST;
    delete process.env.INT_BETTER_AUTH_URL;
    delete process.env.INT_BETTER_AUTH_SECRET;
    delete process.env.DATABASE_URL;
    delete process.env.BETTER_AUTH_URL;
    delete process.env.BETTER_AUTH_SECRET;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("database host allowlist", () => {
    it("accepts the approved Neon URL with default postgres port 5432", () => {
      process.env.INT_ENVIRONMENT = "true";
      process.env.INT_APPROVED_DB_HOST = `${NEON_HOST}:5432`;
      process.env.INT_DATABASE_URL = NEON_URL;
      expect(getDatabaseUrl()).toBe(NEON_URL);
    });

    it("accepts hostname-only INT_APPROVED_DB_HOST as hostname:5432", () => {
      process.env.INT_ENVIRONMENT = "true";
      process.env.INT_APPROVED_DB_HOST = NEON_HOST;
      process.env.INT_DATABASE_URL = NEON_URL;
      expect(getDatabaseUrl()).toBe(NEON_URL);
    });

    it("rejects a Neon URL on port 443 against approved :5432", () => {
      process.env.INT_ENVIRONMENT = "true";
      process.env.INT_APPROVED_DB_HOST = `${NEON_HOST}:5432`;
      process.env.INT_DATABASE_URL = `postgresql://int_user:pass@${NEON_HOST}:443/neondb`;
      expect(() => getDatabaseUrl()).toThrow(/not approved/);
    });

    it("rejects an unapproved host even when INT_ENVIRONMENT is set", () => {
      process.env.INT_ENVIRONMENT = "true";
      process.env.INT_APPROVED_DB_HOST = `${NEON_HOST}:5432`;
      process.env.INT_DATABASE_URL = "postgresql://user@prod.neon.tech:5432/db";
      expect(() => getDatabaseUrl()).toThrow(/not approved/);
    });

    it("accepts localhost without matching the Neon allowlist", () => {
      process.env.INT_ENVIRONMENT = "true";
      process.env.INT_APPROVED_DB_HOST = `${NEON_HOST}:5432`;
      process.env.INT_DATABASE_URL = "postgresql://int_user:pass@127.0.0.1:5432/releva_int_test";
      expect(getDatabaseUrl()).toContain("127.0.0.1");
    });

    it("refuses production DATABASE_URL when INT_APPROVED_DB_HOST is present without INT_ENVIRONMENT", () => {
      process.env.INT_APPROVED_DB_HOST = `${NEON_HOST}:5432`;
      process.env.DATABASE_URL = "postgresql://prod@prod.neon.tech/db";
      expect(() => getDatabaseUrl()).toThrow(/INT_ENVIRONMENT not set/);
      expect(() => validateIntEnvironment()).toThrow(/INT_ENVIRONMENT not set/);
    });
  });

  describe("auth origin", () => {
    beforeEach(() => {
      process.env.INT_ENVIRONMENT = "true";
    });

    it("accepts the exact workers.dev origin", () => {
      process.env.INT_BETTER_AUTH_URL = AUTH_ORIGIN;
      expect(getBetterAuthUrl()).toBe(AUTH_ORIGIN);
    });

    it("rejects a suffix-spoofed hostname", () => {
      process.env.INT_BETTER_AUTH_URL = "https://evil-releva-int.account.workers.dev";
      expect(() => getBetterAuthUrl()).toThrow(/exactly match/);
    });

    it("rejects a custom port", () => {
      process.env.INT_BETTER_AUTH_URL = "https://releva-int.account.workers.dev:8443";
      expect(() => getBetterAuthUrl()).toThrow(/custom port/);
    });

    it("rejects userinfo", () => {
      process.env.INT_BETTER_AUTH_URL = "https://user:pass@releva-int.account.workers.dev";
      expect(() => getBetterAuthUrl()).toThrow(/userinfo/);
    });

    it("rejects a path", () => {
      process.env.INT_BETTER_AUTH_URL = "https://releva-int.account.workers.dev/userinfo";
      expect(() => getBetterAuthUrl()).toThrow(/origin only/);
    });

    it("rejects http", () => {
      process.env.INT_BETTER_AUTH_URL = "http://releva-int.account.workers.dev";
      expect(() => getBetterAuthUrl()).toThrow(/HTTPS/);
    });
  });

  describe("fail-closed guards", () => {
    it("blocks payments, mail, and paid APIs when INT_ENVIRONMENT=true, and allows isolated uploads", () => {
      process.env.INT_ENVIRONMENT = "true";
      process.env.INT_PAYMENTS_ENABLED = "true";
      process.env.INT_EMAIL_ENABLED = "true";
      process.env.INT_EXTERNAL_APIS_ENABLED = "true";
      delete process.env.INT_STRIPE_SECRET_KEY;
      delete process.env.INT_STRIPE_WEBHOOK_SECRET;
      expect(isIntEnvironment()).toBe(true);
      expect(shouldBlockEmail()).toBe(true);
      expect(shouldBlockExternalApi("APIEMPRESAS")).toBe(true);
      expect(() => assertPaymentsEnabled()).toThrow(/disabled in INT/);
      expect(() => assertUploadsEnabled()).not.toThrow();
    });

    it("does not block those operations when INT_ENVIRONMENT is unset", () => {
      expect(isIntEnvironment()).toBe(false);
      expect(shouldBlockEmail()).toBe(false);
      expect(shouldBlockExternalApi("APIEMPRESAS")).toBe(false);
      expect(() => assertPaymentsEnabled()).not.toThrow();
      expect(() => assertUploadsEnabled()).not.toThrow();
    });
  });

  describe("INT Stripe TEST isolation", () => {
    beforeEach(() => {
      process.env.INT_ENVIRONMENT = "true";
      delete process.env.INT_STRIPE_SECRET_KEY;
      delete process.env.INT_STRIPE_WEBHOOK_SECRET;
      delete process.env.INT_STRIPE_PUBLISHABLE_KEY;
      delete process.env.NEXT_PUBLIC_INT_STRIPE_PUBLISHABLE_KEY;
      process.env.STRIPE_SECRET_KEY = "sk_live_should_never_be_read";
    });

    it("does not fall back to production STRIPE_SECRET_KEY", () => {
      expect(getIntStripeSecretKey()).toBeNull();
      expect(intPaymentsConfigured()).toBe(false);
      expect(() => assertPaymentsEnabled()).toThrow(/INT_STRIPE_SECRET_KEY/);
    });

    it("refuses live prefixes and keeps payments off", () => {
      process.env.INT_STRIPE_SECRET_KEY = "sk_live_xxx";
      process.env.INT_STRIPE_WEBHOOK_SECRET = "whsec_xxx";
      expect(getIntStripeSecretKey()).toBeNull();
      expect(intPaymentsConfigured()).toBe(false);
      process.env.INT_STRIPE_SECRET_KEY = "sk_test_xxx";
      process.env.INT_STRIPE_PUBLISHABLE_KEY = "pk_live_xxx";
      expect(getIntStripePublishableKey()).toBeNull();
      expect(intPaymentsConfigured()).toBe(false);
    });

    it("enables payments only with TEST secret and webhook", () => {
      process.env.INT_STRIPE_SECRET_KEY = "sk_test_xxx";
      process.env.INT_STRIPE_WEBHOOK_SECRET = "whsec_xxx";
      expect(getIntStripeSecretKey()).toBe("sk_test_xxx");
      expect(getIntStripeWebhookSecret()).toBe("whsec_xxx");
      expect(intPaymentsConfigured()).toBe(true);
      expect(() => assertPaymentsEnabled()).not.toThrow();
    });
  });
});
