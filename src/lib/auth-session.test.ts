import { describe, expect, it } from "vitest";
import { authSessionOptions, authoritativeSessionQuery } from "./auth-session";

describe("authSessionOptions", () => {
  it("keeps cookieCache off so logout revocation is not delayed", () => {
    expect(authSessionOptions.cookieCache.enabled).toBe(false);
    expect(authoritativeSessionQuery.disableCookieCache).toBe(true);
  });
});
