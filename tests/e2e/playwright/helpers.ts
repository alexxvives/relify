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
      if (el.closest("details:not([open])")) {
        return [];
      }
      if (el instanceof HTMLInputElement && el.type === "file") {
        return [];
      }
      if (el.matches("a[href^='#']")) {
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
    const label = (last.el.getAttribute("aria-label") || last.el.textContent || last.el.tagName).trim().slice(0, 48);
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
      if (el.closest("details:not([open])")) {
        return [];
      }
      if (el instanceof HTMLInputElement && el.type === "file") {
        return [];
      }
      if (el.matches("a[href^='#']")) {
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
    const label = (last.el.getAttribute("aria-label") || last.el.textContent || last.el.tagName).trim().slice(0, 48);
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

type FichaCheck = {
  ok: boolean;
  message: string;
};

export async function expectFichaCompactS13b(page: Page): Promise<void> {
  await page.locator(".shell-content").waitFor({ state: "visible" });
  // S25: report sections are always open (no <details>).
  const sections = page.locator("#ficha-detalles section.shell-anchor");
  await sections.first().waitFor({ state: "visible", timeout: 20_000 });
  await expectLastContentControlAboveChrome(page);
  const result = await page.evaluate((): FichaCheck => {
    const splitWord = (root: ParentNode, word: string): boolean => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();
      while (node) {
        const text = node.textContent ?? "";
        const index = text.indexOf(word);
        if (index >= 0) {
          const range = document.createRange();
          range.setStart(node, index);
          range.setEnd(node, index + word.length);
          return range.getClientRects().length > 1;
        }
        node = walker.nextNode();
      }
      return false;
    };
    const tabbar = document.querySelector(".shell-tabbar");
    const tabs = document.querySelector(".shell-page-tabs");
    const shown = (el: Element | null): DOMRect | null => {
      if (!(el instanceof HTMLElement)) {
        return null;
      }
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") {
        return null;
      }
      const rect = el.getBoundingClientRect();
      return rect.height >= 1 ? rect : null;
    };
    const tabTop = shown(tabbar)?.top ?? window.innerHeight;
    const stickyTabs = shown(tabs);
    const details = [...document.querySelectorAll<HTMLElement>("#ficha-detalles details")];
    const last = details.at(-1);
    if (last) {
      const copy = last.querySelector("p, li, td, h2, summary");
      const copyRect = copy instanceof HTMLElement ? copy.getBoundingClientRect() : last.getBoundingClientRect();
      const bottom = last.getBoundingClientRect().bottom;
      if (bottom > tabTop + 2) {
        return {
          ok: false,
          message: `last accordion bottom ${bottom.toFixed(1)} sits under tab bar at ${tabTop.toFixed(1)}`,
        };
      }
      const intros = [...last.querySelectorAll<HTMLElement>("h2, p")];
      if (stickyTabs) {
        for (const el of intros) {
          const rect = el.getBoundingClientRect();
          if (rect.bottom <= 0 || rect.top >= window.innerHeight) {
            continue;
          }
          const overlap = Math.min(rect.bottom, stickyTabs.bottom) - Math.max(rect.top, stickyTabs.top);
          if (overlap > 4) {
            const label = (el.textContent ?? "").trim().slice(0, 48);
            return { ok: false, message: `sticky tabs overlap “${label}” by ${overlap.toFixed(1)}px` };
          }
        }
      }
      if (copyRect.bottom > tabTop + 2) {
        return { ok: false, message: `trailing copy bottom ${copyRect.bottom.toFixed(1)} under tab bar ${tabTop.toFixed(1)}` };
      }
    }
    for (const title of document.querySelectorAll<HTMLElement>("#ficha-detalles h2.report-section-title")) {
      const wrap = getComputedStyle(title).overflowWrap;
      const breakStyle = getComputedStyle(title).wordBreak;
      if (breakStyle === "break-all" || wrap === "break-word") {
        return { ok: false, message: `${title.textContent?.trim()} uses ${breakStyle}/${wrap}` };
      }
      for (const word of ["Balance", "diligence"]) {
        if ((title.textContent ?? "").includes(word) && splitWord(title, word)) {
          return { ok: false, message: `“${word}” wraps mid-word in “${title.textContent?.trim()}”` };
        }
      }
    }
    const badge = document.querySelector("[data-int-badge]");
    const bell = document.querySelector<HTMLElement>('button[aria-label^="Abrir avisos"], button[aria-label*="avisos"]');
    if (badge instanceof HTMLElement && bell) {
      const a = badge.getBoundingClientRect();
      const b = bell.getBoundingClientRect();
      const overlapX = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (overlapX > 0 && overlapY > 0) {
        return { ok: false, message: `INT badge overlaps Abrir avisos by ${overlapX.toFixed(1)}×${overlapY.toFixed(1)}` };
      }
      const style = getComputedStyle(badge);
      // S28: the desktop corner tab stays inside the 24 px content padding.
      if (style.position === "fixed" && a.bottom > 24) {
        return { ok: false, message: "INT corner tab reaches into the content" };
      }
    }
    const overlay = [...document.querySelectorAll("body *")].find((el) => {
      if (!(el instanceof HTMLElement) || el.textContent?.trim() !== "INT") {
        return false;
      }
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return style.position === "fixed" && rect.top < 64 && rect.right > window.innerWidth - 80;
    });
    if (overlay) {
      return { ok: false, message: "fixed INT overlay still sits top-right over header controls" };
    }
    return { ok: true, message: "ficha compact clearance ok" };
  });
  expect(result.ok, result.message).toBe(true);
}

async function closeOpenOverlays(page: Page): Promise<void> {
  for (let step = 0; step < 5; step += 1) {
    const overlay = page.locator("[data-bottom-sheet], [data-asking-price-sheet], [role='dialog'][aria-modal='true']").first();
    if (!(await overlay.isVisible().catch(() => false))) {
      break;
    }
    await page.keyboard.press("Escape");
    const closer = overlay.getByRole("button", { name: /^cerrar$/i }).first();
    if (await closer.isVisible().catch(() => false)) {
      await closer.click().catch(() => undefined);
    }
    await overlay.waitFor({ state: "hidden", timeout: 2_000 }).catch(() => undefined);
  }
}

export async function openAndClosePageSheets(page: Page): Promise<void> {
  await dismissCookieBanner(page);
  await closeOpenOverlays(page);
  const openers = page.locator(
    '.shell-content button[aria-haspopup="dialog"], .shell-content button[aria-label^="Abrir avisos"], .shell-content button[aria-label="Más acciones"]',
  );
  const limit = Math.min(await openers.count(), 10);
  for (let index = 0; index < limit; index += 1) {
    const opener = openers.nth(index);
    if (!(await opener.isVisible().catch(() => false))) {
      continue;
    }
    await opener.click({ timeout: 2_000 }).catch(() => undefined);
    await page.waitForTimeout(200);
    await closeOpenOverlays(page);
  }
  const hints = page.locator('.shell-content [role="button"][tabindex="0"]');
  const hintLimit = Math.min(await hints.count(), 6);
  for (let index = 0; index < hintLimit; index += 1) {
    const hint = hints.nth(index);
    if (!(await hint.isVisible().catch(() => false))) {
      continue;
    }
    await hint.click({ timeout: 2_000 }).catch(() => undefined);
    await page.waitForTimeout(200);
    await closeOpenOverlays(page);
  }
  await closeOpenOverlays(page);
}

async function swipeWindow(page: Page, start: number): Promise<number> {
  const viewport = page.viewportSize();
  const x = Math.round((viewport?.width ?? 390) / 2);
  const startY = Math.min(420, Math.round((viewport?.height ?? 844) * 0.55));
  const endY = Math.max(48, startY - 280);
  try {
    await page.touchscreen.tap(x, startY);
    const session = await page.context().newCDPSession(page);
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y: startY, id: 0 }],
    });
    const steps = 10;
    for (let step = 1; step <= steps; step += 1) {
      const y = startY + ((endY - startY) * step) / steps;
      await session.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x, y, id: 0 }],
      });
    }
    await session.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await page.waitForTimeout(160);
  } catch {
    return start;
  }
  return page.evaluate(() => window.scrollY);
}

export async function expectWindowScrolls(page: Page, label: string): Promise<void> {
  await page.evaluate(() => {
    const html = document.documentElement;
    html.style.setProperty("scroll-behavior", "auto", "important");
    document.body.style.setProperty("scroll-behavior", "auto", "important");
    const scroller = document.scrollingElement ?? html;
    if (scroller.scrollHeight <= scroller.clientHeight + 8) {
      const pad = document.createElement("div");
      pad.setAttribute("data-scroll-probe", "1");
      pad.style.height = "2400px";
      document.body.appendChild(pad);
    }
    window.scrollTo(0, 0);
  });
  await page.waitForFunction(() => {
    const scroller = document.scrollingElement ?? document.documentElement;
    return scroller.scrollHeight > scroller.clientHeight + 40;
  });
  const locked = await page.evaluate(() => ({
    htmlOverflow: getComputedStyle(document.documentElement).overflow,
    htmlOverflowY: getComputedStyle(document.documentElement).overflowY,
    bodyOverflow: getComputedStyle(document.body).overflow,
    bodyOverflowY: getComputedStyle(document.body).overflowY,
  }));
  expect(
    locked.htmlOverflow === "hidden" || locked.htmlOverflowY === "hidden" || locked.bodyOverflow === "hidden" || locked.bodyOverflowY === "hidden",
    `${label}: page scroll locked (html ${locked.htmlOverflow}/${locked.htmlOverflowY}, body ${locked.bodyOverflow}/${locked.bodyOverflowY})`,
  ).toBe(false);
  const start = await page.evaluate(() => window.scrollY);
  const viewport = page.viewportSize();
  const x = Math.round((viewport?.width ?? 360) / 2);
  const hasTouch = await page.evaluate(() => navigator.maxTouchPoints > 0);
  let end = start;
  if (hasTouch) {
    end = await swipeWindow(page, start);
  }
  if (end <= start) {
    await page.mouse.move(x, 320);
    await page.mouse.wheel(0, 1400);
    await page.waitForTimeout(120);
    end = await page.evaluate(() => window.scrollY);
  }
  if (end <= start) {
    await page.evaluate(() => {
      const y = Math.min(400, Math.floor(window.innerHeight / 2));
      const origin = document.elementFromPoint(window.innerWidth / 2, y) ?? document.body;
      origin.dispatchEvent(new WheelEvent("wheel", { deltaY: 1200, bubbles: true, cancelable: true }));
    });
    await page.waitForTimeout(80);
    end = await page.evaluate(() => window.scrollY);
  }
  if (end <= start) {
    const box = await page.locator("body").boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + Math.min(280, box.height / 3));
      await page.mouse.wheel(0, 1800);
      await page.waitForTimeout(120);
      end = await page.evaluate(() => window.scrollY);
    }
  }
  expect(end, `${label}: window.scrollY stayed at ${start} after ${hasTouch ? "touch swipe / " : ""}wheel (html overflow ${locked.htmlOverflow})`).toBeGreaterThan(start);
  await page.evaluate(() => {
    document.querySelector("[data-scroll-probe]")?.remove();
  });
}
