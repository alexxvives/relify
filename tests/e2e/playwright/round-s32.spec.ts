import { expect, test } from "@playwright/test";

test.describe("S32 Google result", () => {
  test("home head has the new title, icons, manifest and Organization data", async ({ request }) => {
    const html = await (await request.get("/")).text();
    expect(html).toContain("<title>Relify: comprar y vender empresas rentables en España</title>");
    expect(html).toMatch(/<link rel="manifest" href="\/manifest.webmanifest"/);
    expect(html).toMatch(/<link rel="icon" href="\/icon-32.png"[^>]*sizes="32x32"/);
    expect(html).toMatch(/"@type":"Organization"[^<]*"logo"/);
    const manifest = await (await request.get("/manifest.webmanifest")).json();
    expect(manifest.icons.some((icon: { purpose?: string }) => icon.purpose === "maskable")).toBe(true);
    expect((await request.get("/icon-512.png")).status()).toBe(200);
    expect((await request.get("/brand/logo-512.png")).status()).toBe(200);
  });

  test("child pages carry the Relify brand and the blog is Blog", async ({ page, request }) => {
    expect(await (await request.get("/empresas")).text()).toContain("<title>Vender tu empresa | Relify</title>");
    await page.goto("/blog");
    await expect(page.getByRole("heading", { level: 1, name: "Blog" })).toBeVisible();
  });
});
