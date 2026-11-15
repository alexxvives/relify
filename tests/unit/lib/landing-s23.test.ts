import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFileSync(file, "utf8");

describe("Round S23 landing, documents, and INT uploads", () => {
  it("puts Paso N inline left of the pipeline title and widens the callout", () => {
    const source = read("src/components/landing/landing-pipeline.tsx");
    const css = read("src/app/globals.css");
    expect(source).toMatch(/releva-land-pipe-title/);
    expect(source).toMatch(/releva-land-pipe-kicker/);
    expect(css).toMatch(/\.releva-land-pipe-callout \{[\s\S]*align-items: center/);
    expect(css).toMatch(/max-width: 42rem/);
  });

  it("draws a smooth CIF line chart with area fill, axes and a marker", () => {
    const source = read("src/components/landing/how-it-works.tsx");
    expect(source).toMatch(/function smoothLine/);
    expect(source).toMatch(/pathLength=\{1\}/);
    expect(source).toMatch(/className="mark"/);
    expect(source).toMatch(/className="axis"/);
    expect(read("src/app/globals.css")).toMatch(/releva-cif-line \.stroke/);
  });

  it("uses one how-it-works spine that lights only the selected step", () => {
    const source = read("src/components/landing/how-it-works.tsx");
    const css = read("src/app/globals.css");
    expect(source).toMatch(/releva-how-spine/);
    expect(source).not.toMatch(/releva-how-done/);
    expect(css).toMatch(/\.releva-how-on \.releva-how-rail-light/);
    expect(css).not.toMatch(/\.releva-how-done \.releva-how-rail-light/);
  });

  it("redesigns the publish and buyers step cards", () => {
    const source = read("src/components/landing/how-it-works.tsx");
    expect(source).toMatch(/releva-hv-publish/);
    expect(source).toMatch(/releva-hv-seal/);
    expect(source).toMatch(/releva-hv-buyers/);
    expect(source).toMatch(/releva-hv-chat/);
  });

  it("removes the Vista previa del mercado tag from the offer section", () => {
    const offer = read("src/components/landing/offer.tsx");
    expect(offer).not.toMatch(/copy\.preview/);
    expect(offer).not.toMatch(/absolute top-4 right-4/);
  });

  it("sweeps a diagonal gold shine across rentables", () => {
    const css = read("src/app/globals.css");
    expect(css).toMatch(/@keyframes releva-gold-sweep/);
    expect(css).toMatch(/#c48914/);
    expect(css).toMatch(/-webkit-background-clip: text/);
  });

  it("keeps the ficha section bar only as wide as its buttons", () => {
    const nav = read("src/components/seller/report-nav.tsx");
    expect(nav).toMatch(/flex w-fit max-w-full items-center rounded-2xl border border-\[#e6e9f0\] bg-white\/95 p-1\.5 shadow-/);
    expect(nav).toMatch(/mx-auto w-fit max-w-full/);
  });

  it("allows INT uploads on an isolated INT_UPLOADS bucket", () => {
    expect(read("src/lib/server/int-guards.ts")).toMatch(/Uploads are allowed in INT with isolated storage/);
    expect(read("src/lib/server/data-room-disk.ts")).toMatch(/INT_UPLOADS/);
    expect(read("src/lib/server/data-room-disk.ts")).toMatch(/int\//);
    expect(read("scripts/package-int-worker.mjs")).toMatch(/releva-int-uploads/);
    expect(read("src/app/(app)/mi-empresa/documentos/page.tsx")).not.toMatch(/uploadsDisabled=\{isIntEnvironment\(\)\}/);
  });

  it("plays GlareHover only on first hover-in", () => {
    expect(read("src/components/landing/offer-glare.tsx")).toMatch(/playOnce/);
    expect(read("src/components/GlareHover.tsx")).toMatch(/playOnce && state\.played/);
    expect(read("src/components/GlareHover.tsx")).toMatch(/state\.played = true/);
  });

  it("uses the same vertical padding on landing sections", () => {
    expect(read("src/components/landing/offer.tsx")).toMatch(/px-5 py-10 sm:px-8 sm:py-16/);
    expect(read("src/components/landing/process.tsx")).toMatch(/px-5 py-10 sm:px-8 sm:py-16/);
    expect(read("src/components/landing/paths.tsx")).toMatch(/px-5 py-10 sm:px-8 sm:py-16/);
    expect(read("src/components/landing/confidentiality.tsx")).toMatch(/px-5 py-10 sm:px-8 sm:py-16/);
    expect(read("src/components/landing/activity-feed.tsx")).toMatch(/px-5 py-10 sm:px-8 sm:py-16/);
  });

  it("fills completed pipeline segments and pulses the current step like Mis procesos", () => {
    const source = read("src/components/landing/landing-pipeline.tsx");
    const css = read("src/app/globals.css");
    expect(source).toMatch(/releva-land-pipe-fill/);
    expect(source).toMatch(/--pipe-fill/);
    expect(css).toMatch(/releva-land-pipe-advance/);
    expect(css).toMatch(/\.releva-land-pipe-current \.releva-land-pipe-dot::before/);
    expect(css).toMatch(/animation: deal-pulse/);
  });

  it("pins Prueba gratis to the bottom of the hero overlay", () => {
    const css = read("src/app/globals.css");
    expect(css).toMatch(/\.releva-hero-actions \{[\s\S]*margin-top: auto/);
    expect(read("src/components/landing/hero.tsx")).toMatch(/href="\/registro"/);
  });

  it("opens a documents folder on click and peeks papers on hover", () => {
    expect(read("src/components/seller/documents-folder.tsx")).toMatch(/openOn="hover"/);
    expect(read("src/components/seller/documents-folder.tsx")).toMatch(/onActivate=\{onActivate\}/);
    expect(read("src/components/seller/seller-documents.tsx")).toMatch(/sellerCopy\.foldersBack/);
    expect(read("src/components/seller/seller-documents.tsx")).toMatch(/onClick=\{onOpen\}/);
    expect(read("src/components/seller/seller-documents.tsx")).toMatch(/onActivate=\{onOpen\}/);
  });

  it("renders data-room files as A4 portrait sheets", () => {
    const docs = read("src/components/seller/seller-documents.tsx");
    expect(read("src/app/globals.css")).toMatch(/\.releva-doc-sheet \{[\s\S]*aspect-ratio: 1 \/ 1\.414/);
    expect(docs).toMatch(/releva-doc-sheet/);
    expect(docs).toMatch(/relative block w-full max-w-\[11\.5rem\]/);
  });

  it("unmounts detalle panels when collapsed so description can expand to full height", () => {
    const form = read("src/components/seller/company-draft-form.tsx");
    expect(form).toMatch(/\{open \? \(/);
    expect(form).toMatch(/min-h-\[9rem\]/);
    expect(form).not.toMatch(/\[field-sizing:content\]/);
    expect(form).toMatch(/style=\{\{ minHeight: "9rem" \}\}/);
    expect(read("src/app/globals.css")).toMatch(/#panel-description textarea \{[\s\S]*min-height: 9rem/);
  });

  it("uses GooeyNav for Información de empresa / Ficha pública", () => {
    const tabs = read("src/components/seller/seller-tabs.tsx");
    expect(tabs).toMatch(/gooey-nav\/GooeyNav/);
    expect(tabs).toMatch(/color="#1c2740"/);
  });
});
