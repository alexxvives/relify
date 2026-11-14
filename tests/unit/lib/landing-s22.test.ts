import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFileSync(file, "utf8");

describe("Round S22 landing and product bits", () => {
  it("slows the path-switch blur and isolates it to the steps", () => {
    const source = read("src/components/landing/path-and-flow.tsx");
    expect(source).toMatch(/duration=\{1\.6\}/);
    expect(source).toMatch(/isolate overflow-hidden/);
    expect(source).not.toMatch(/duration=\{0\.8\}/);
  });

  it("wires Bencho UploadDropzone to real documents uploads", () => {
    expect(read("src/components/seller/upload-dropzone.tsx")).toMatch(/from "motion\/react"/);
    expect(read("src/components/seller/upload-dropzone.css")).toMatch(/--fill-on: #1c2740/);
    expect(read("src/components/seller/seller-documents.tsx")).toMatch(/UploadDropzone/);
    expect(read("src/app/(app)/mi-empresa/documentos/page.tsx")).toMatch(/uploadsDisabled=\{isIntEnvironment\(\)\}/);
  });

  it("opens every documents folder on click with bounce, Relify last and accented", () => {
    const folder = read("src/components/seller/documents-folder.tsx");
    expect(folder).toMatch(/openOn="click"/);
    expect(folder).toMatch(/bounce=\{0\.78\}/);
    expect(folder).toMatch(/#9aa3b2/);
    expect(folder).toMatch(/#465ab4/);
    const docs = read("src/components/seller/seller-documents.tsx");
    const relify = docs.lastIndexOf("featured");
    const create = docs.indexOf("sellerCopy.folderCreate");
    expect(relify).toBeGreaterThan(create);
  });

  it("puts Así se ve una operación title on the left", () => {
    expect(read("src/components/landing/activity-feed.tsx")).toMatch(/lg:grid-cols-\[1\.1fr_0\.9fr\]/);
    expect(read("src/lib/landing-copy.ts")).toMatch(/Así se ve una operación/);
  });

  it("keeps SwapVerb and enlarges the hero title because TextMorph is Pro", () => {
    const hero = read("src/components/landing/hero.tsx");
    expect(hero).toMatch(/function SwapVerb/);
    expect(hero).toMatch(/clamp\(2\.35rem,10\.5vw,3\.35rem\)/);
    expect(read("src/app/globals.css")).toMatch(/clamp\(2\.4rem, 5\.8cqi, 4\.65rem\)/);
  });

  it("uses lazy GooeyNav on the ficha section bar", () => {
    const nav = read("src/components/seller/report-nav.tsx");
    expect(nav).toMatch(/gooey-nav\/GooeyNav/);
    expect(nav).toMatch(/color="#1c2740"/);
    expect(nav).toMatch(/prefers-reduced-motion/);
    expect(read("src/components/ui/gooey-nav/GooeyNav.css")).toMatch(/gooey-nav__fallback/);
  });

  it("requires terms on sign-up and drops the plan checkout line", () => {
    expect(read("src/components/auth/sign-up-form.tsx")).toMatch(/acceptTerms/);
    expect(read("src/lib/server/sign-up.ts")).toMatch(/termsAcceptedAt/);
    expect(read("src/components/investor/premium-plans.tsx")).not.toMatch(/CheckoutLegalNote/);
    expect(read("src/components/auth/onboarding-form.tsx")).not.toMatch(/CheckoutLegalNote/);
    expect(read("src/components/auth/onboarding-plan-resume.tsx")).not.toMatch(/CheckoutLegalNote/);
  });

  it("removes the how-it-works flow subtitle", () => {
    expect(read("src/lib/landing-copy.ts")).not.toMatch(/Qué datos dejas, qué prepara Relify/);
    expect(read("src/components/landing/how-it-works.tsx")).not.toMatch(/copy\.intro/);
  });

  it("matches the ficha skeleton to banner, three tabs and section nav", () => {
    const skeleton = read("src/components/shell/page-skeletons.tsx");
    const block = skeleton.slice(skeleton.indexOf("export function ProjectSkeleton"));
    expect(block).toMatch(/Tabs count=\{3\}/);
    expect(block).toMatch(/rounded-\[1\.75rem\]/);
    expect(block).not.toMatch(/Tabs count=\{4\}/);
  });

  it("drops the buyer company-tab documentation block and renames Chat", () => {
    const buyer = read("src/components/investor/investor-project.tsx");
    const companyTab = buyer.slice(buyer.indexOf("company:"), buyer.indexOf("questions:"));
    expect(companyTab).not.toMatch(/ProcessRoom/);
    expect(buyer).toMatch(/ProcessRoom/);
    expect(read("src/lib/company-copy.ts")).toMatch(/questions: "Chat \/ Documentos"/);
  });

  it("labels the banner download Teaser", () => {
    expect(read("src/lib/company-pdf-copy.ts")).toMatch(/teaserDownload: "Teaser"/);
    expect(read("src/lib/company-pdf-copy.ts")).toMatch(/dossierDownload: "Teaser"/);
    expect(read("src/components/investor/investor-project.tsx")).toMatch(/<Download className="size-4"/);
  });

  it("fills landing nav hover pills to h-11", () => {
    expect(read("src/components/landing/landing-nav.tsx")).toMatch(/flex h-11 min-h-11 items-center rounded-full px-3/);
    expect(read("src/components/landing/landing-nav.tsx")).toMatch(/hover:bg-public-sand hover:text-public-ink/);
  });

  it("does not force landing subtitle wraps", () => {
    expect(read("src/components/landing/confidentiality.tsx")).not.toMatch(/text-pretty|text-balance|text-wrap/);
    expect(read("src/components/landing/process.tsx")).not.toMatch(/text-pretty/);
    expect(read("src/components/landing/landing-pipeline.tsx")).not.toMatch(/max-w-2xl/);
    const paths = read("src/components/landing/paths.tsx");
    expect(paths).toMatch(/hidden text-\[16px\] leading-7 text-public-muted sm:mt-4 sm:block/);
    expect(paths.indexOf("copy.intro")).toBeGreaterThan(paths.lastIndexOf("max-w-3xl"));
  });
});
