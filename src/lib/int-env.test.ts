import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  isIntEnvironment,
  getDatabaseUrl,
  getBetterAuthSecret,
  getBetterAuthUrl,
  getSiteOrigin,
  isEmailDisabled,
  getStripeMode,
} from "./int-env";

describe("INT environment isolation", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("isIntEnvironment", () => {
    it("returns true when INT_ENVIRONMENT=true", () => {
      process.env.INT_ENVIRONMENT = "true";
      expect(isIntEnvironment()).toBe(true);
    });

    it("returns false when INT_ENVIRONMENT not set", () => {
      delete process.env.INT_ENVIRONMENT;
      expect(isIntEnvironment()).toBe(false);
    });
  });

  describe("getDatabaseUrl", () => {
    it("requires INT_DATABASE_URL in INT mode", () => {
      process.env.INT_ENVIRONMENT = "true";
      delete process.env.INT_DATABASE_URL;
      
      expect(() => getDatabaseUrl()).toThrow("INT_DATABASE_URL required");
    });

    it("rejects production DB in INT mode", () => {
      process.env.INT_ENVIRONMENT = "true";
      process.env.INT_DATABASE_URL = "postgresql://user@releva.neon.tech/db";
      
      expect(() => getDatabaseUrl()).toThrow("not approved");
    });

    it("rejects itsreleva domains in INT mode", () => {
      process.env.INT_ENVIRONMENT = "true";
      process.env.INT_DATABASE_URL = "postgresql://user@itsreleva.com/db";
      
      expect(() => getDatabaseUrl()).toThrow("not approved");
    });

    it("accepts valid INT database URL", () => {
      process.env.INT_ENVIRONMENT = "true";
      process.env.INT_DATABASE_URL = "postgresql://int_user:pass@localhost:5432/releva_int";
      
      expect(getDatabaseUrl()).toBe("postgresql://int_user:pass@localhost:5432/releva_int");
    });

    it("uses DATABASE_URL in production mode", () => {
      delete process.env.INT_ENVIRONMENT;
      process.env.DATABASE_URL = "postgresql://prod@prod.neon.tech/db";
      
      expect(getDatabaseUrl()).toBe("postgresql://prod@prod.neon.tech/db");
    });
  });

  describe("getBetterAuthUrl", () => {
    it("requires INT_BETTER_AUTH_URL in INT mode", () => {
      process.env.INT_ENVIRONMENT = "true";
      delete process.env.INT_BETTER_AUTH_URL;
      
      expect(() => getBetterAuthUrl()).toThrow("INT_BETTER_AUTH_URL required");
    });

    it("requires 'int' in URL in INT mode", () => {
      process.env.INT_ENVIRONMENT = "true";
      process.env.INT_BETTER_AUTH_URL = "https://releva.workers.dev";
      
      expect(() => getBetterAuthUrl()).toThrow("must contain 'int'");
    });

    it("rejects production domains in INT mode", () => {
      process.env.INT_ENVIRONMENT = "true";
      process.env.INT_BETTER_AUTH_URL = "https://int.itsreleva.com";
      
      expect(() => getBetterAuthUrl()).toThrow("must not use production domains");
    });

    it("accepts valid INT URL", () => {
      process.env.INT_ENVIRONMENT = "true";
      process.env.INT_BETTER_AUTH_URL = "https://releva-int.account.workers.dev";
      
      expect(getBetterAuthUrl()).toBe("https://releva-int.account.workers.dev");
    });
  });

  describe("getSiteOrigin", () => {
    it("uses INT auth URL origin in INT mode", () => {
      process.env.INT_ENVIRONMENT = "true";
      process.env.INT_BETTER_AUTH_URL = "https://releva-int.workers.dev/callback";
      
      expect(getSiteOrigin()).toBe("https://releva-int.workers.dev");
    });

    it("never falls back to production in INT mode", () => {
      process.env.INT_ENVIRONMENT = "true";
      process.env.INT_BETTER_AUTH_URL = "https://releva-int.workers.dev";
      delete process.env.PUBLIC_SITE_URL;
      
      expect(getSiteOrigin()).not.toContain("itsrelify.com");
      expect(getSiteOrigin()).not.toContain("itsreleva.com");
    });
  });

  describe("isEmailDisabled", () => {
    it("is disabled by default in INT mode", () => {
      process.env.INT_ENVIRONMENT = "true";
      delete process.env.EMAIL_DISABLED;
      
      expect(isEmailDisabled()).toBe(true);
    });

    it("can be explicitly enabled in INT mode", () => {
      process.env.INT_ENVIRONMENT = "true";
      process.env.EMAIL_DISABLED = "false";
      
      expect(isEmailDisabled()).toBe(false);
    });

    it("is enabled by default in production mode", () => {
      delete process.env.INT_ENVIRONMENT;
      delete process.env.EMAIL_DISABLED;
      
      expect(isEmailDisabled()).toBe(false);
    });
  });

  describe("getStripeMode", () => {
    it("always returns test mode in INT environment", () => {
      process.env.INT_ENVIRONMENT = "true";
      process.env.STRIPE_MODE = "live";
      
      expect(getStripeMode()).toBe("test");
    });

    it("respects STRIPE_MODE in production", () => {
      delete process.env.INT_ENVIRONMENT;
      process.env.STRIPE_MODE = "live";
      
      expect(getStripeMode()).toBe("live");
    });
  });
});
