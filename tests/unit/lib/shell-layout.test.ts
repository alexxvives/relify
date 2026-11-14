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
    expect(draftForm).toMatch(/data-price-recommend/);
    expect(draftForm).toMatch(/priceBarGradient/);
    const sheet = draftForm.slice(draftForm.indexOf("data-asking-price-sheet"));
    expect(sheet).toMatch(/<PriceBar[\s>]/);
    expect(sheet).toMatch(/data-use-recommended/);
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

  it("puts Perfil ciego on Mis documentos, not /cuenta", () => {
    const documentosPage = readFileSync(path.join(process.cwd(), "src/app/(app)/mi-empresa/documentos/page.tsx"), "utf8");
    expect(cuentaPage).not.toMatch(/SellerPdfCard/);
    expect(cuentaPage).not.toMatch(/sellerTeaserDesk/);
    expect(documentosPage).toMatch(/SellerPdfCard/);
    expect(documentosPage).toMatch(/sellerTeaserDesk/);
  });

  it("renders auth as a single surface below md", () => {
    expect(authScreen).toMatch(/md:overflow-hidden md:rounded-\[1\.75rem\] md:bg-\[#f4f8fb\]/);
    expect(authScreen).not.toMatch(/overflow-hidden rounded-2xl sm:rounded-\[1\.75rem\] bg-\[#f4f8fb\]/);
    expect(authScreen).toMatch(/md:rounded-\[1\.75rem\] md:border md:border-white\/80 md:bg-white\/95/);
  });

  it("keeps Perfil ciego as a preview card with a copy-link icon and no Regenerar", () => {
    expect(teaserCard).toMatch(/data-teaser-card/);
    expect(teaserCard).toMatch(/data-teaser-preview/);
    expect(teaserCard).toMatch(/Link2/);
    expect(teaserCard).not.toMatch(/previewOnDemand/);
    expect(teaserCard).not.toMatch(/moreActions/);
    expect(teaserCard).not.toMatch(/regenerateShare/);
    expect(teaserCard).not.toMatch(/onRegenerate/);
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

  it("finishes a section with Guardar instead of an up-arrow collapse", () => {
    expect(draftForm).toMatch(/savePanel/);
    expect(draftForm).toMatch(/cancelPanel/);
    expect(draftForm).not.toMatch(/ChevronUp/);
  });
});

const shellCopySource = readFileSync(path.join(process.cwd(), "src/lib/shell.ts"), "utf8");
const appFrame = readFileSync(path.join(process.cwd(), "src/components/shell/app-frame.tsx"), "utf8");
const banner = readFileSync(path.join(process.cwd(), "src/components/seller/company-banner.tsx"), "utf8");
const investorProject = readFileSync(path.join(process.cwd(), "src/components/investor/investor-project.tsx"), "utf8");
const companyReport = readFileSync(path.join(process.cwd(), "src/components/seller/company-report.tsx"), "utf8");
const investorProcesses = readFileSync(path.join(process.cwd(), "src/components/investor/investor-processes.tsx"), "utf8");
const sellerProcesses = readFileSync(path.join(process.cwd(), "src/components/seller/seller-processes.tsx"), "utf8");

describe("S17 buyer ficha and seller surfaces", () => {
  it("commits the asking-price bar on release, not on every pointer move", () => {
    expect(draftForm).toMatch(/onCommit\?: \(cents: number\) => void/);
    const sheetBar = draftForm.slice(draftForm.indexOf("data-asking-price-sheet"));
    expect(sheetBar).toMatch(/onChange=\{\(cents\) => \{\s*setDraft\(centsToAskingInput\(cents\)\);\s*\}\}/);
    expect(sheetBar).toMatch(/onCommit=\{\(cents\) => \{[\s\S]*?onChange\(next\);/);
  });

  it("explains the price range with an info tooltip, not the old sentence", () => {
    expect(draftForm).not.toMatch(/El rango orientativo usa el múltiplo sectorial sobre el EBITDA ajustado/);
    expect(draftForm).toMatch(/AskingPriceRangeHint/);
    expect(draftForm).toMatch(/EBITDA ajustado × múltiplo sectorial/);
  });

  it("orders Datos de la ficha without Resultado neto", () => {
    const metrics = draftForm.slice(draftForm.indexOf("function FichaMetrics"), draftForm.indexOf("function SellerFinancingField"));
    expect(metrics).toMatch(/askingPriceLabel[\s\S]*revenueLabel[\s\S]*ebitdaLabel[\s\S]*adjustedEbitdaLabel[\s\S]*ebitdaMarginLabel[\s\S]*adjustedEbitdaMarginLabel/);
    expect(metrics).not.toMatch(/netResult|Resultado neto/);
  });

  it("keeps seller help as Necesitas ayuda with Llámanos body and the phone only", () => {
    expect(shellCopySource).toMatch(/helpTitle: "¿Necesitas ayuda\?"/);
    expect(shellCopySource).toMatch(/helpBody: "Llámanos o escríbenos\."/);
    expect(shellCopySource).toMatch(/helpPhone: "\+34 689 99 43 85"/);
    expect(shellCopySource).not.toMatch(/Te acompañamos a rellenar la ficha/);
    expect(appFrame).toMatch(/shellCopy\.helpPhone/);
    expect(appFrame).not.toMatch(/shellCopy\.helpCall/);
    expect(appFrame).not.toMatch(/shellCopy\.helpEmail/);
    expect(appFrame).not.toMatch(/Llamar/);
  });

  it("puts the dossier download in the buyer banner and drops the LOI template link", () => {
    expect(investorProject).toMatch(/bannerAction=/);
    expect(banner).toMatch(/absolute top-5 left-5/);
    expect(banner).not.toMatch(/bannerAction \? <div className="mt-5 flex justify-center">/);
    expect(investorProject).toMatch(/dossierDownload/);
    expect(investorProject).not.toMatch(/BuyerDossierLink/);
    expect(investorProject).not.toMatch(/loiTemplateHref/);
    expect(investorProcesses).not.toMatch(/loiTemplateHref/);
    expect(sellerProcesses).not.toMatch(/loiTemplateHref/);
  });

  it("keeps collapsed report asides on one line and sticks the buyer section nav after it leaves flow", () => {
    expect(companyReport).toMatch(/report-section-aside[\s\S]*whitespace-nowrap/);
    expect(companyReport).toMatch(/report-section-aside[\s\S]*truncate/);
    expect(companyReport).toMatch(/report-section-title min-w-0 shrink-0/);
    expect(companyReport).toMatch(/inlineUntilSticky/);
  });
});

const heroSource = readFileSync(path.join(process.cwd(), "src/components/landing/hero.tsx"), "utf8");
const landingNav = readFileSync(path.join(process.cwd(), "src/components/landing/landing-nav.tsx"), "utf8");

describe("S17 landing hero title and header", () => {
  it("keeps one signup CTA, the rotating verb, and a gold shine on rentables", () => {
    expect(heroSource).toMatch(/El mercado inteligente para/);
    expect(heroSource).toMatch(/<SwapVerb \/> empresas/);
    expect(heroSource).toMatch(/releva-gold-shine">rentables/);
    expect(heroSource).toMatch(/href="\/registro"/);
    expect(heroSource).not.toMatch(/Comprar una empresa/);
    expect(heroSource).not.toMatch(/Vender tu empresa/);
    expect(heroSource).not.toMatch(/registro\?rol=/);
  });

  it("shows ghost Iniciar sesión and primary Prueba gratis on desktop and mobile", () => {
    expect(landingNav).toMatch(/landingCopy\.signInCta/);
    expect(landingNav).toMatch(/landingCopy\.tryFreeCta/);
    expect(landingNav).toMatch(/href="\/entrar"/);
    expect(landingNav).toMatch(/href="\/registro"/);
    expect(landingNav).toMatch(/ghostLink/);
  });

  it("animates rentables with a gold clip sweep and a static gold when motion is reduced", () => {
    expect(css).toMatch(/\.releva-gold-shine \{[\s\S]*background-clip:\s*text/);
    expect(css).toMatch(/@keyframes releva-gold-sweep/);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\) \{[\s\S]*\.releva-gold-shine \{[\s\S]*color:\s*#a47208/);
    expect(css).toMatch(/\.releva-gold-shine \{[\s\S]*#a47208[\s\S]*#b8860b[\s\S]*#e8c547/);
    expect(css).toMatch(/@media \(max-width: 1023px\) \{[\s\S]*text-align:\s*center/);
  });

  it("keeps the Prueba gratis CTA inside the hero overlay without growing the card", () => {
    expect(css).toMatch(/\.releva-hero-copy \{[\s\S]*position:\s*absolute/);
    expect(css).toMatch(/@media \(max-width: 1023px\) \{[\s\S]*\.releva-city-static \{[\s\S]*position:\s*relative/);
    expect(css).toMatch(/@media \(max-width: 1023px\) \{[\s\S]*\.releva-hero-copy \{[\s\S]*justify-content:\s*flex-start/);
    expect(heroSource).toMatch(/releva-hero-copy[\s\S]*releva-hero-actions/);
  });
});
