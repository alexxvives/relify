import { expect, test } from "@playwright/test";
import { destinationsForRole } from "../../../src/lib/shell";
import {
  expectLastContentControlAboveChrome,
  roleCreds,
  signInAs,
  type E2ERole,
} from "./helpers";

const extraPaths: Record<E2ERole, readonly string[]> = {
  seller: ["/cuenta"],
  investor: ["/cuenta"],
  advisor: ["/cuenta"],
  admin: ["/cuenta"],
};

test.describe("signed-in compact chrome", () => {
  for (const role of ["seller", "investor", "advisor", "admin"] as const) {
    test(`${role} last content control stays above the tab bar`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== "mobile-390", "tab bar is compact-only");
      test.skip(!roleCreds(role), `Set E2E_${role.toUpperCase()}_EMAIL and password`);
      test.setTimeout(90_000);
      const signedIn = await signInAs(page, role);
      expect(signedIn).toBe(true);
      const paths = [...destinationsForRole(role).map((item) => item.href), ...extraPaths[role]];
      for (const path of paths) {
        await page.goto(path);
        const content = page.locator(".shell-content");
        if ((await content.count()) === 0) {
          continue;
        }
        await expect(content).toBeVisible();
        await expectLastContentControlAboveChrome(page).catch((error: unknown) => {
          throw new Error(`${path}: ${error instanceof Error ? error.message : String(error)}`);
        });
      }
    });
  }
});
