import { expect, type Locator, type Page } from "@playwright/test";

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
  await page.evaluate(async () => {
    const html = document.documentElement;
    html.style.setProperty("scroll-behavior", "auto", "important");
    document.body.style.setProperty("scroll-behavior", "auto", "important");
    const scroller = document.scrollingElement ?? html;
    for (let i = 0; i < 20; i += 1) {
      const top = Math.max(html.scrollHeight, document.body.scrollHeight, scroller.scrollHeight);
      window.scrollTo({ top, behavior: "instant" });
      scroller.scrollTop = top;
      const content = document.querySelector(".shell-content");
      if (content) {
        content.scrollTop = content.scrollHeight;
      }
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          resolve();
        });
      });
    }
  });
  await page.waitForFunction(() => {
    const scroller = document.scrollingElement ?? document.documentElement;
    const max = scroller.scrollHeight - scroller.clientHeight;
    return max <= 4 || scroller.scrollTop >= max - 8;
  }, undefined, { timeout: 4_000 }).catch(() => undefined);
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
    const blocked = new Set(["shell-tabbar", "shell-sticky-cta", "shell-sidebar", "relify-consent", "shell-header"]);
    const candidates = [...content.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )].flatMap((el) => {
      if (el.closest("[hidden], [aria-hidden='true']")) {
        return [];
      }
      if (el.closest("[data-sticky-twin], [data-shell-chrome]")) {
        return [];
      }
      if (sticky instanceof HTMLElement && sticky.contains(el)) {
        return [];
      }
      if (tabbar instanceof HTMLElement && tabbar.contains(el)) {
        return [];
      }
      for (const name of blocked) {
        if (el.closest(`.${name}`)) {
          return [];
        }
      }
      const rect = shown(el);
      if (!rect || rect.width < 8 || rect.height < 8 || rect.height > 160) {
        return [];
      }
      if (rect.bottom <= 0 || rect.top >= window.innerHeight) {
        return [];
      }
      const stickyBox = shown(sticky);
      if (stickyBox) {
        const overlap = Math.min(rect.bottom, stickyBox.bottom) - Math.max(rect.top, stickyBox.top);
        if (overlap > rect.height * 0.6) {
          return [];
        }
      }
      return [{ el, rect }];
    });
    const last = candidates.sort((a, b) => a.rect.bottom - b.rect.bottom).at(-1);
    if (!last) {
      return { ok: true, message: "no content controls in view" };
    }
    const rect = last.rect;
    const label = (last.el.textContent ?? last.el.getAttribute("aria-label") ?? last.el.tagName).trim().slice(0, 48);
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

type HitCheck = {
  ok: boolean;
  message: string;
};

export async function placeJustAboveChrome(page: Page, locator: Locator): Promise<void> {
  await locator.scrollIntoViewIfNeeded();
  await page.evaluate(() => {
    const html = document.documentElement;
    html.style.setProperty("scroll-behavior", "auto", "important");
    document.body.style.setProperty("scroll-behavior", "auto", "important");
  });
  await locator.evaluate((el) => {
    const tabbar = document.querySelector(".shell-tabbar");
    const tabTop = tabbar instanceof HTMLElement ? tabbar.getBoundingClientRect().top : window.innerHeight;
    const rect = el.getBoundingClientRect();
    window.scrollBy({ top: rect.bottom - (tabTop - 8), behavior: "instant" });
    window.dispatchEvent(new Event("scroll"));
  });
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resolve();
      });
    });
  }));
  await page.waitForFunction(() => {
    const sticky = document.querySelector(".shell-sticky-cta");
    if (!(sticky instanceof HTMLElement)) {
      return true;
    }
    const twin = sticky.closest("[data-sticky-twin]")
      ?? sticky.parentElement?.querySelector("[data-sticky-twin]")
      ?? document.querySelector("[data-sticky-twin]");
    if (!(twin instanceof HTMLElement)) {
      return true;
    }
    const rect = twin.getBoundingClientRect();
    const onScreen = rect.bottom > 0 && rect.top < window.innerHeight && rect.height >= 1;
    if (!onScreen) {
      return true;
    }
    return sticky.getAttribute("data-occluded") === "true";
  }, undefined, { timeout: 3_000 }).catch(() => undefined);
}

export async function expectControlCenterTappable(page: Page, locator: Locator): Promise<void> {
  await expect(locator).toBeVisible();
  const result = await locator.evaluate((el): HitCheck => {
    const rect = el.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const hit = document.elementFromPoint(x, y);
    const label = (el.textContent ?? el.getAttribute("aria-label") ?? el.tagName).trim().slice(0, 48);
    const point = `${x.toFixed(0)},${y.toFixed(0)}`;
    if (!hit) {
      return { ok: false, message: `${label} elementFromPoint(${point}) is null` };
    }
    if (hit.closest(".shell-sticky-cta")) {
      return { ok: false, message: `${label} center (${point}) hit sticky CTA` };
    }
    if (hit.closest(".shell-tabbar")) {
      return { ok: false, message: `${label} center (${point}) hit tab bar` };
    }
    if (el === hit || el.contains(hit)) {
      return { ok: true, message: `${label} tappable at ${point}` };
    }
    const text = (hit.textContent ?? "").trim().slice(0, 40);
    return { ok: false, message: `${label} center (${point}) hit ${hit.tagName} ${text}` };
  });
  expect(result.ok, result.message).toBe(true);
}

export async function expectLastContentControlTappable(page: Page): Promise<void> {
  await expectLastContentControlAboveChrome(page);
  const result = await page.evaluate((): HitCheck => {
    const content = document.querySelector(".shell-content");
    if (!(content instanceof HTMLElement)) {
      return { ok: false, message: "missing .shell-content" };
    }
    const tabbar = document.querySelector(".shell-tabbar");
    const sticky = document.querySelector(".shell-sticky-cta");
    const shownRect = (el: Element | null): DOMRect | null => {
      if (!(el instanceof HTMLElement)) {
        return null;
      }
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden" || style.pointerEvents === "none") {
        return null;
      }
      const rect = el.getBoundingClientRect();
      if (rect.height < 1 || rect.width < 1) {
        return null;
      }
      return rect;
    };
    const tabTop = shownRect(tabbar)?.top ?? window.innerHeight;
    const stickyRect = shownRect(sticky);
    const chromeTop = Math.min(tabTop, stickyRect?.top ?? window.innerHeight);
    const blocked = new Set(["shell-tabbar", "shell-sticky-cta", "shell-sidebar", "relify-consent", "shell-header"]);
    const candidates = [...content.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )].flatMap((el) => {
      if (el.closest("[hidden], [aria-hidden='true']")) {
        return [];
      }
      if (el.closest("[data-sticky-twin], [data-shell-chrome]")) {
        return [];
      }
      if (sticky instanceof HTMLElement && sticky.contains(el)) {
        return [];
      }
      if (tabbar instanceof HTMLElement && tabbar.contains(el)) {
        return [];
      }
      for (const name of blocked) {
        if (el.closest(`.${name}`)) {
          return [];
        }
      }
      const rect = shownRect(el);
      if (!rect || rect.width < 8 || rect.height < 8 || rect.height > 160) {
        return [];
      }
      if (rect.bottom <= 0 || rect.top >= window.innerHeight) {
        return [];
      }
      if (stickyRect) {
        const overlap = Math.min(rect.bottom, stickyRect.bottom) - Math.max(rect.top, stickyRect.top);
        if (overlap > rect.height * 0.6) {
          return [];
        }
      }
      return [{ el, rect }];
    });
    const last = candidates.sort((a, b) => a.rect.bottom - b.rect.bottom).at(-1);
    if (!last) {
      return { ok: true, message: "no content controls in view" };
    }
    const visTop = Math.max(last.rect.top, 0);
    const visBottom = Math.min(last.rect.bottom, chromeTop);
    const x = last.rect.left + last.rect.width / 2;
    const y = visBottom - visTop >= 8 ? (visTop + visBottom) / 2 : last.rect.top + last.rect.height / 2;
    const hit = document.elementFromPoint(x, y);
    const label = (last.el.textContent ?? last.el.getAttribute("aria-label") ?? last.el.tagName).trim().slice(0, 48);
    const path = `${location.pathname}${location.search}`;
    const point = `${x.toFixed(0)},${y.toFixed(0)}`;
    if (!hit) {
      return { ok: false, message: `${path} ${label} elementFromPoint(${point}) is null` };
    }
    if (hit.closest(".shell-sticky-cta")) {
      return { ok: false, message: `${path} ${label} center (${point}) hit sticky CTA` };
    }
    if (hit.closest(".shell-tabbar")) {
      return { ok: false, message: `${path} ${label} center (${point}) hit tab bar` };
    }
    if (last.el === hit || last.el.contains(hit) || hit.contains(last.el)) {
      return { ok: true, message: `${path} ${label} tappable at ${point}` };
    }
    if (
      x >= last.rect.left &&
      x <= last.rect.right &&
      y >= last.rect.top &&
      y <= last.rect.bottom &&
      !hit.closest(".shell-sticky-cta") &&
      !hit.closest(".shell-tabbar")
    ) {
      return { ok: true, message: `${path} ${label} point in control box at ${point}` };
    }
    const text = (hit.textContent ?? "").trim().slice(0, 40);
    return { ok: false, message: `${path} ${label} center (${point}) hit ${hit.tagName} ${text}` };
  });
  expect(result.ok, result.message).toBe(true);
}

export async function expectNoIdentityLeak(page: Page): Promise<void> {
  const html = await page.content();
  for (const secret of ["B11223344", "Avenida Marítima", "Lucía Herrera", "Duna Servicios"]) {
    expect(html, `leaked ${secret}`).not.toContain(secret);
  }
}
