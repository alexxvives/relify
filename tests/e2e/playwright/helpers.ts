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

export async function dismissCookieBanner(page: Page): Promise<void> {
  const reject = page.getByRole("dialog").getByRole("button", { name: /^rechazar$/i });
  if (await reject.isVisible().catch(() => false)) {
    await reject.click();
  }
}

export async function signInAs(page: Page, role: E2ERole): Promise<boolean> {
  const creds = roleCreds(role);
  if (!creds) {
    return false;
  }
  await page.goto("/entrar");
  await page.locator('input[name="email"]').waitFor({ state: "visible" });
  await page.getByRole("dialog").waitFor({ state: "visible", timeout: 3_000 }).catch(() => undefined);
  await dismissCookieBanner(page);
  await page.locator('input[name="email"]').fill(creds.email);
  await page.locator('input[name="password"]').fill(creds.password);
  await page.getByRole("button", { name: /entrar/i }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/entrar"), { timeout: 20_000 });
  await dismissCookieBanner(page);
  return true;
}

type ChromeCheck = {
  ok: boolean;
  message: string;
};

export async function expectLastContentControlAboveChrome(page: Page): Promise<void> {
  await page.locator(".shell-content").waitFor({ state: "visible" });
  const destroyed = "Execution context was destroyed";
  try {
    await measureLastContentControl(page);
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes(destroyed)) {
      throw error;
    }
    await page.locator(".shell-content").waitFor({ state: "visible" });
    await measureLastContentControl(page);
  }
}

async function measureLastContentControl(page: Page): Promise<void> {
  await page.evaluate(() => {
    const html = document.documentElement;
    html.style.setProperty("scroll-behavior", "auto", "important");
    document.body.style.setProperty("scroll-behavior", "auto", "important");
    const top = Math.max(html.scrollHeight, document.body.scrollHeight, document.scrollingElement?.scrollHeight ?? 0);
    window.scrollTo({ top, behavior: "instant" });
    const scroller = document.scrollingElement ?? html;
    scroller.scrollTop = scroller.scrollHeight;
    const content = document.querySelector(".shell-content");
    if (content) {
      content.scrollTop = content.scrollHeight;
    }
  });
  await page.waitForFunction(() => {
    const scroller = document.scrollingElement ?? document.documentElement;
    const max = scroller.scrollHeight - scroller.clientHeight;
    return max <= 4 || scroller.scrollTop >= max - 8;
  });
  const result = await page.evaluate((): ChromeCheck => {
    const content = document.querySelector(".shell-content");
    if (!(content instanceof HTMLElement)) {
      return { ok: false, message: "missing .shell-content" };
    }
    const tabbar = document.querySelector(".shell-tabbar");
    const sticky = document.querySelector(".shell-sticky-cta");
    const shown = (el: Element | null): DOMRect | null => {
      if (!(el instanceof HTMLElement)) {
        return null;
      }
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") {
        return null;
      }
      const rect = el.getBoundingClientRect();
      if (rect.height < 1) {
        return null;
      }
      return rect;
    };
    const tabTop = shown(tabbar)?.top ?? window.innerHeight;
    const stickyTop = shown(sticky)?.top ?? window.innerHeight;
    const chromeTop = Math.min(tabTop, stickyTop);
    const blocked = new Set(["shell-tabbar", "shell-sticky-cta", "shell-sidebar", "relify-consent"]);
    const candidates = [...content.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )].filter((el) => {
      if (el.closest("[hidden], [aria-hidden='true']")) {
        return false;
      }
      for (const name of blocked) {
        if (el.closest(`.${name}`)) {
          return false;
        }
      }
      return shown(el) !== null;
    });
    if (candidates.length === 0) {
      return { ok: true, message: "no content controls" };
    }
    const last = candidates[candidates.length - 1];
    if (!last) {
      return { ok: true, message: "no content controls" };
    }
    const rect = last.getBoundingClientRect();
    const label = (last.textContent ?? last.getAttribute("aria-label") ?? last.tagName).trim().slice(0, 48);
    const path = `${location.pathname}${location.search}`;
    if (rect.bottom > chromeTop + 2) {
      return {
        ok: false,
        message: `${path} ${label} bottom ${rect.bottom.toFixed(1)} sits under chrome at ${chromeTop.toFixed(1)} (scroll ${document.scrollingElement?.scrollTop ?? 0}/${(document.scrollingElement?.scrollHeight ?? 0) - (document.scrollingElement?.clientHeight ?? 0)})`,
      };
    }
    return { ok: true, message: `${path} ${label} above chrome` };
  });
  expect(result.ok, result.message).toBe(true);
}

export async function expectNoIdentityLeak(page: Page): Promise<void> {
  const html = await page.content();
  for (const secret of ["B11223344", "Avenida Marítima", "Lucía Herrera", "Duna Servicios"]) {
    expect(html, `leaked ${secret}`).not.toContain(secret);
  }
}
