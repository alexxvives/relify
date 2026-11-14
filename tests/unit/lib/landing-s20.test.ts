import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (file: string) => readFileSync(path.join(root, file), "utf8");

describe("Round S20 landing and React Bits", () => {
  it("centers landing section titles on desktop and mobile", () => {
    expect(read("src/components/landing/paths.tsx")).toMatch(/mx-auto max-w-3xl text-center/);
    expect(read("src/components/landing/offer.tsx")).toMatch(/mx-auto max-w-3xl text-center/);
    expect(read("src/components/landing/confidentiality.tsx")).toMatch(/mx-auto max-w-3xl text-center/);
    expect(read("src/components/landing/activity-feed.tsx")).toMatch(/mx-auto max-w-3xl text-center/);
    expect(read("src/components/landing/process.tsx")).toMatch(/mx-auto max-w-3xl text-center/);
  });

  it("re-renders path steps with FadeContent blur on switch", () => {
    const flow = read("src/components/landing/path-and-flow.tsx");
    expect(flow).toMatch(/fade-content/);
    expect(flow).toMatch(/blur/);
    expect(flow).toMatch(/trigger="mount"/);
    expect(flow).toMatch(/duration=\{0\.8\}/);
  });

  it("keeps ElectricLogo as a v2 desktop trial with pause when the tab is hidden", () => {
    const mark = read("src/components/landing/landing-mark.tsx");
    expect(mark).toMatch(/ElectricLogo/);
    expect(mark).toMatch(/\/logo\.svg/);
    expect(mark).toMatch(/#10b949/);
    expect(mark).toMatch(/#00f2ac/);
    expect(mark).toMatch(/useLandingAurora/);
    expect(mark).toMatch(/visibilityState/);
    expect(read("src/components/ElectricLogo.tsx")).toMatch(/visibilitychange/);
    expect(read("src/components/landing/landing-page.tsx")).not.toMatch(/electricLogo/);
  });

  it("adds GlareHover to Empresas en venta cards and StarBorder to Prueba gratis", () => {
    expect(read("src/components/landing/offer.tsx")).toMatch(/OfferGlare/);
    expect(read("src/components/landing/offer-carousel.tsx")).toMatch(/OfferGlare/);
    expect(read("src/components/landing/try-free-button.tsx")).toMatch(/StarBorder/);
    expect(read("src/components/landing/try-free-button.tsx")).toMatch(/#2fc4b2/);
  });

  it("uses the Folder component only on the Relify folder", () => {
    const docs = read("src/components/seller/seller-documents.tsx");
    expect(docs).toMatch(/RelifyFolder/);
    expect(docs).toMatch(/FolderOpenIcon/);
    expect(read("src/components/seller/relify-folder.tsx")).toMatch(/import\("@\/components\/Folder"\)/);
  });

  it("wraps the featured investor plan in PixelCard", () => {
    const plans = read("src/components/investor/premium-plans.tsx");
    expect(plans).toMatch(/PixelCard/);
    expect(plans).toMatch(/item\.recommended/);
  });

  it("restores waitlist Gaze portraits from vendored SVGs", () => {
    expect(read("src/lib/gaze-avatar.ts")).toMatch(/\/waitlist\/\$\{safe\}\.svg/);
    expect(read("public/waitlist/alba.svg")).toMatch(/DiceBear/);
  });

  it("uses React Bits Counter on the waitlist clock", () => {
    const waitlist = read("src/components/landing/waitlist-form.tsx");
    expect(waitlist).toMatch(/from "@\/components\/Counter"/);
    expect(waitlist).toMatch(/stagger=\{0\.06\}/);
    expect(waitlist).toMatch(/direction="down"/);
    expect(waitlist).toMatch(/bounce=\{0\.3\}/);
  });

  it("styles app toasts as a bencho-like stack", () => {
    expect(read("src/components/shell/app-toast.tsx")).toMatch(/releva-toast-stack/);
    expect(read("src/app/globals.css")).toMatch(/\.releva-toast-stack-ghost/);
  });

  it("drops Verificado and seller financing tags from the process specimen", () => {
    const process = read("src/components/landing/process.tsx");
    expect(process).toMatch(/financingChip: null/);
    expect(process).toMatch(/verified: false/);
    expect(process).not.toMatch(/Financiación vendedor/);
  });

  it("keeps pipeline dots on the line when the current step scales", () => {
    const css = read("src/app/globals.css");
    expect(css).toMatch(/\.releva-land-pipe-dot \{[\s\S]*transform-origin:\s*center center/);
    expect(css).toMatch(/\.releva-land-pipe-current \.releva-land-pipe-dot \{[\s\S]*transform:\s*scale\(1\.35\)/);
    expect(css).not.toMatch(/\.releva-land-pipe-current \.releva-land-pipe-dot \{[\s\S]*width:\s*1\.35rem/);
    expect(read("src/components/landing/landing-pipeline.tsx")).toMatch(/releva-land-pipe-callout/);
  });
});
