import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { homeForRole } from "@/lib/auth-input";

const read = (path: string) => readFileSync(path, "utf8");

describe("Round S40 (Alex t181u)", () => {
  it("2/3/5/6: the advisor encargo uses the buyer tabs with a buyer filter; no quick links, no Contrato row", () => {
    const view = read("src/components/advisor/advisor-engagement-view.tsx");
    expect(view).toMatch(/<AdvisorProcessDesk/);
    expect(view).not.toMatch(/ContractStage|AdvisorQuickLinks/);
    const desk = read("src/components/advisor/advisor-process-desk.tsx");
    expect(desk).toMatch(/InvestorProjectTabs/);
    expect(desk).toMatch(/BuyerFilter/);
    expect(existsSync("src/components/advisor/advisor-quick-links.tsx")).toBe(false);
    expect(read("src/components/advisor/advisor-processes.tsx")).not.toMatch(/QuickLinks/);
  });

  it("4: the buyer page has no separate signed-LOI block", () => {
    expect(read("src/components/investor/investor-project.tsx")).not.toMatch(/<LoiCard/);
  });

  it("7/8/9: the buyer card folds back in reverse, with a minimise icon and side arrows", () => {
    const dock = read("src/components/advisor/advisor-rail-dock.tsx");
    expect(dock).toMatch(/Minimize2/);
    expect(dock).toMatch(/onExitComplete/);
    expect(read("src/components/advisor/buyer-card-slider.tsx")).toMatch(/top-1\/2[\s\S]*-translate-y-1\/2/);
  });

  it("10/11: Mis servicios saves on blur with inline NIF errors and one Guardado toast", () => {
    const services = read("src/components/advisor/advisor-services.tsx");
    expect(services).not.toMatch(/advisorCopy\.save\b/);
    expect(services).toMatch(/onBlur=\{\(\) => \{\s+setNifError/);
    expect(services).toMatch(/useSavedToast/);
    expect(read("src/components/account/account-settings.tsx")).toMatch(/useSavedToast/);
    expect(read("src/components/investor/investor-profile.tsx")).toMatch(/notifySaved\(\)/);
    expect(read("src/components/shell/use-saved-toast.tsx")).toMatch(/"Guardado"/);
  });

  it("12: the advisor checklist deep-links into Mis servicios with the marker", () => {
    expect(read("src/components/advisor/advisor-home.tsx")).toMatch(/\/mis-servicios\?ancla=advisor-description/);
    expect(read("src/components/advisor/advisor-services.tsx")).toMatch(/useDeepLinkMarker\(\)/);
  });

  it("13: the advisor home is /inicio and /mandatos redirects", () => {
    expect(homeForRole("advisor")).toBe("/inicio");
    expect(read("src/app/(app)/mandatos/page.tsx")).toMatch(/redirect\(qs \? `\/inicio\?\$\{qs\}` : "\/inicio"\)/);
  });

  it("14: Tu progreso opens expanded on a deep link unless complete", () => {
    expect(read("src/components/seller/detail-section-nav.tsx")).toMatch(/openOnEntry=\{progress\.done < progress\.total\}/);
  });

  it("15/16: compact seller turn cue, ficha tabs with buyer filter and the shared overlay", () => {
    expect(read("src/components/investor/deal-pipeline.tsx")).toMatch(/\|\| role === "seller"\);/);
    const list = read("src/components/seller/seller-processes.tsx");
    expect(list).toMatch(/AcceptLoiButton/);
    expect(list).not.toMatch(/id: "chat"|id: "meetings"/);
    const page = read("src/app/(app)/mi-empresa/procesos/[accessId]/page.tsx");
    expect(page).toMatch(/SellerProcessDesk/);
    // S41: the desk renders the overlay so it can fold it when the tab changes.
    expect(read("src/components/seller/seller-process-desk.tsx")).toMatch(/BuyerFilter[\s\S]*BuyerCardOverlay/);
  });
});
