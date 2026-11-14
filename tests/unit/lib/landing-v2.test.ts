import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { landingCopy, offerDeals } from "@/lib/landing-copy";
import { parseShowcaseMoney } from "@/lib/showcase-card";

const root = process.cwd();
const read = (file: string) => readFileSync(path.join(root, file), "utf8");

describe("landing v2 React Bits upgrade", () => {
  it("registers the React Bits shadcn registry", () => {
    const registry = read("components.json");
    expect(registry).toMatch(/"@react-bits": "https:\/\/reactbits.dev\/r\/\{name\}\.json"/);
  });

  it("keeps the default landing on / and the upgrade behind ?v=2 with noindex", () => {
    const page = read("src/app/page.tsx");
    expect(page).toMatch(/v === "2"/);
    expect(page).toMatch(/LandingPageV2/);
    expect(page).toMatch(/return <LandingPage \/>/);
    expect(page).toMatch(/robots: \{ index: false, follow: false \}/);
    expect(read("src/components/landing/landing-page.tsx")).not.toMatch(/LandingAurora|LandingCifras|LandingReveal/);
  });

  it("uses FadeContent, CountUp and Aurora on v2 only", () => {
    const v2 = read("src/components/landing/landing-page-v2.tsx");
    expect(v2).toMatch(/LandingAurora/);
    expect(v2).toMatch(/LandingCifras/);
    expect(v2).toMatch(/LandingReveal/);
    expect(v2).not.toMatch(/landingCopy\.stats/);
    expect(read("src/components/landing/fade-content.tsx")).toMatch(/prefers-reduced-motion/);
    expect(read("src/components/landing/landing-motion.ts")).toMatch(/prefers-reduced-motion/);
    expect(read("src/components/landing/landing-aurora.tsx")).toMatch(/useLandingAurora/);
    expect(read("src/components/landing/landing-cifras.tsx")).toMatch(/useAllowsMotion/);
  });

  it("counts Proyecto Alba example cifras, not platform stats", () => {
    const copy = landingCopy.home.v2;
    expect(copy.cifrasKicker).toBe("Ejemplo de ficha");
    expect(copy.cifrasIntro).toMatch(/Proyecto Alba/);
    expect(copy.cifrasIntro).toMatch(/No son un recuento del mercado/);
    expect(offerDeals[0]?.codename).toBe("Proyecto Alba");
    expect(Math.round(parseShowcaseMoney(offerDeals[0].revenue) / 100_000)).toBe(240);
    expect(Math.round(parseShowcaseMoney(offerDeals[0].ebitda) / 100_000)).toBe(48);
    expect(Math.round(parseShowcaseMoney(offerDeals[0].price) / 100_000)).toBe(190);
    const cifras = read("src/components/landing/landing-cifras.tsx");
    expect(cifras).toMatch(/offerDeals\[0\]/);
    expect(cifras).not.toMatch(/landingCopy\.stats/);
  });
});
