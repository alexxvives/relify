import { describe, expect, it } from "vitest";
import { authDisabledHttpPaths } from "./auth-disabled-paths";

describe("authDisabledHttpPaths", () => {
  it("closes the raw email sign-in and sign-up HTTP routes", () => {
    expect(authDisabledHttpPaths).toContain("/sign-in/email");
    expect(authDisabledHttpPaths).toContain("/sign-up/email");
    expect(authDisabledHttpPaths).toContain("/request-password-reset");
  });
});
