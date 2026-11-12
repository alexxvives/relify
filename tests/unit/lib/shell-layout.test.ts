import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf8");

describe("signed-in shell layout CSS", () => {
  it("keeps the slide transform off the base sidebar so desktop is not translated away", () => {
    const base = css.slice(css.indexOf(".shell-sidebar {"), css.indexOf(".shell-sidebar[data-open=\"true\"]"));
    expect(base).not.toMatch(/transform:\s*translateX\(-100%\)/);
    expect(css).toMatch(/@media \(max-width: 1023px\)[\s\S]*?transform:\s*translateX\(-100%\)/);
    expect(css).toMatch(
      /@media \(min-width: 1024px\)[\s\S]*?\.shell-sidebar\[data-open="false"\][\s\S]*?transform:\s*none/,
    );
  });

  it("pads shell content for the mobile tab bar in CSS, not a competing utility", () => {
    expect(css).toMatch(/--shell-tabbar:\s*0px/);
    expect(css).toMatch(
      /padding-bottom:\s*calc\(var\(--layout-pad\) \+ var\(--shell-tabbar\) \+ var\(--shell-sticky\)\)/,
    );
    expect(css).toMatch(/--shell-tabbar:\s*calc\(3\.5rem \+ 0\.75rem \+ env\(safe-area-inset-bottom/);
    expect(css).toMatch(/--shell-sticky:\s*0px/);
    expect(css).toMatch(/\.shell:has\(\.shell-sticky-cta\)/);
    expect(css).toMatch(
      /scroll-padding-bottom:\s*calc\(var\(--shell-tabbar\) \+ var\(--shell-sticky\)\)/,
    );
    expect(css).toMatch(/@media \(max-width: 1023px\)[\s\S]*?--shell-header:\s*3\.5rem/);
    expect(css).toMatch(/scroll-padding-top:\s*calc\(var\(--shell-header\) \+ var\(--shell-page-tabs\)/);
    expect(css).toMatch(/\.shell:has\(\.shell-page-tabs\)/);
    expect(css).toMatch(/\.shell-anchor \{[\s\S]*?scroll-margin-top:\s*calc\(var\(--shell-header\) \+ var\(--shell-page-tabs\)/);
    expect(css).toMatch(/\.report-section-title \{[\s\S]*?overflow-wrap:\s*normal/);
    expect(css).toMatch(/\.report-section-title \{[\s\S]*?overflow-wrap:\s*anywhere/);
    expect(css).not.toMatch(/\.report-section-title \{[\s\S]*?word-break:\s*break-all/);
    expect(css).toMatch(/@media \(min-width: 640px\) and \(max-width: 1023px\)[\s\S]*?--shell-tabbar:\s*calc\(4rem/);
    expect(css).toMatch(/\.shell\[data-keyboard="true"\] \.shell-tabbar/);
    expect(css).toMatch(/\.shell-main \{[\s\S]*?min-height:\s*100svh/);
  });
});

const layout = readFileSync(path.join(process.cwd(), "src/app/layout.tsx"), "utf8");
const badge = readFileSync(path.join(process.cwd(), "src/components/shell/int-badge.tsx"), "utf8");

describe("INT environment badge", () => {
  it("is an inline pill, not a fixed top-right overlay over Abrir avisos", () => {
    expect(layout).not.toMatch(/fixed top-2 right-2/);
    expect(badge).toMatch(/data-int-badge/);
    expect(badge).toMatch(/inline-flex/);
    expect(badge).not.toMatch(/fixed /);
  });
});

const modal = readFileSync(path.join(process.cwd(), "src/components/shell/use-modal.ts"), "utf8");
const draftForm = readFileSync(path.join(process.cwd(), "src/components/seller/company-draft-form.tsx"), "utf8");
const authScreen = readFileSync(path.join(process.cwd(), "src/components/auth/auth-screen.tsx"), "utf8");
const teaserCard = readFileSync(path.join(process.cwd(), "src/components/seller/company-pdf-card.tsx"), "utf8");
const companyCopySource = readFileSync(path.join(process.cwd(), "src/lib/company-copy.ts"), "utf8");
const cuentaPage = readFileSync(path.join(process.cwd(), "src/app/(app)/cuenta/page.tsx"), "utf8");

describe("S13b scroll lock and seller surfaces", () => {
  it("does not lock html overflow while a stay-mounted sheet is closed", () => {
    expect(modal).toMatch(/open = true/);
    expect(modal).toMatch(/if \(!open\) \{\s*return;/);
    expect(draftForm).toMatch(/useModal\(panel, \(\) => setOpen\(false\), open\)/);
  });

  it("keeps the price bar inside the asking-price sheet, not on the tile", () => {
    expect(draftForm).toMatch(/data-price-bar/);
    expect(draftForm).toMatch(/data-asking-price-sheet/);
    expect(draftForm).toMatch(/data-price-dot/);
    expect(draftForm).toMatch(/priceBarGradient/);
    const sheet = draftForm.slice(draftForm.indexOf("data-asking-price-sheet"));
    expect(sheet).toMatch(/<PriceBar /);
    expect(sheet).toMatch(/data-recommended-chip/);
    expect(sheet).toMatch(/data-asking-includes/);
    expect(draftForm).toMatch(/data-price-standing/);
    expect(draftForm).not.toMatch(/suggestedPrice/);
    expect(draftForm).not.toMatch(/applySuggested[^I]/);
  });

  it("does not render Perfil ciego on Ficha", () => {
    expect(draftForm).not.toMatch(/data-teaser-card/);
    expect(draftForm).not.toMatch(/SellerPdfCard/);
    expect(draftForm).not.toMatch(/teaserDesk/);
  });

  it("puts Perfil ciego on /cuenta for sellers", () => {
    expect(cuentaPage).toMatch(/SellerPdfCard/);
    expect(cuentaPage).toMatch(/sellerTeaserDesk/);
    expect(cuentaPage).toMatch(/middle=\{teaser\}/);
  });

  it("renders auth as a single surface below md", () => {
    expect(authScreen).toMatch(/md:overflow-hidden md:rounded-\[1\.75rem\] md:bg-\[#f4f8fb\]/);
    expect(authScreen).not.toMatch(/overflow-hidden rounded-2xl sm:rounded-\[1\.75rem\] bg-\[#f4f8fb\]/);
    expect(authScreen).toMatch(/md:rounded-\[1\.75rem\] md:border md:border-white\/80 md:bg-white\/95/);
  });

  it("keeps Perfil ciego as a compact row with overflow actions", () => {
    expect(teaserCard).toMatch(/data-teaser-card/);
    expect(teaserCard).toMatch(/Más acciones|moreActions/);
    expect(teaserCard).toMatch(/previewOnDemand/);
    expect(teaserCard).not.toMatch(/lg:grid lg:grid-cols-\[7\.5rem/);
  });

  it("does not render the 50% EBITDA adjustment warning", () => {
    expect(companyCopySource).not.toMatch(/adjustmentLargeShare/);
    expect(companyCopySource).not.toMatch(/supera el 50 % del EBITDA/);
    expect(draftForm).not.toMatch(/supera el 50 % del EBITDA/);
  });

  it("keeps section card headers on one row", () => {
    expect(draftForm).toMatch(/flex min-w-0 flex-nowrap items-center gap-2/);
    expect(draftForm).toMatch(/min-w-0 truncate/);
    expect(draftForm).toMatch(/flex shrink-0 flex-nowrap items-center/);
  });
});
