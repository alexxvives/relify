import { describe, expect, it } from "vitest";
import { betterAuthCredentialAccountId } from "./better-auth-credential";

describe("betterAuthCredentialAccountId", () => {
  it("maps the credential account_id to the user id, not the email", () => {
    const userId = "11111111-1111-1111-1111-111111111111";
    expect(betterAuthCredentialAccountId(userId)).toBe(userId);
    expect(betterAuthCredentialAccountId(userId)).not.toBe("int-comprador@test.local");
  });
});
