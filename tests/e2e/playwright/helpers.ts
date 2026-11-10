import { expect, type Page } from "@playwright/test";

export type E2ERole = "seller" | "investor" | "advisor" | "admin";

const envKey: Record<E2ERole, { email: string; password: string }> = {
  seller: { email: "E2E_SELLER_EMAIL", password: "E2E_SELLER_PASSWORD" },
  investor: { email: "E2E_INVESTOR_EMAIL", password: "E2E_INVESTOR_PASSWORD" },
  advisor: { email: "E2E_ADVISOR_EMAIL", password: "E2E_ADVISOR_PASSWORD" },
  admin: { email: "E2E_ADMIN_EMAIL", password: "E2E_ADMIN_PASSWORD" },
};

export function roleCreds(role: E2ERole): { email: string; password: string } | null {
  const email = process.env[envKey[role].email]?.trim() ?? "";
  const password = process.env[envKey[role].password] ?? "";
  if (email.length === 0 || password.length === 0) {
    return null;
  }
  return { email, password };
}

export async function signInAs(page: Page, role: E2ERole): Promise<boolean> {
  const creds = roleCreds(role);
  if (!creds) {
    return false;
  }
  await page.goto("/entrar");
  await page.locator('input[name="email"]').fill(creds.email);
  await page.locator('input[name="password"]').fill(creds.password);
  await page.getByRole("button", { name: /entrar/i }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/entrar"), { timeout: 20_000 });
  return true;
}

export async function expectNoIdentityLeak(page: Page): Promise<void> {
  const html = await page.content();
  for (const secret of ["B11223344", "Avenida Marítima", "Lucía Herrera", "Duna Servicios"]) {
    expect(html, `leaked ${secret}`).not.toContain(secret);
  }
}
