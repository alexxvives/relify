import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { advisoryCopy } from "@/lib/advisory";
import { authCopy } from "@/lib/auth-copy";
import { billingCopy } from "@/lib/billing-copy";
import { companyCopy } from "@/lib/company-copy";
import { engagementCopy } from "@/lib/engagement-copy";
import { marginExplain, marginShortLabel } from "@/lib/financial-metrics";
import { trendsGridClass } from "@/components/seller/seller-trends";
import { activityRowClass } from "@/components/shell/activity-tiles";

const read = (file: string) => readFileSync(join(process.cwd(), file), "utf8");

describe("S28 1: Mensual/Anual uses the GooeyNav switch", () => {
  it("premium plans render SegmentedTablist for the billing period", () => {
    const plans = read("src/components/investor/premium-plans.tsx");
    expect(plans).toMatch(/<SegmentedTablist[\s\S]*?id: "monthly"[\s\S]*?id: "yearly"/);
    expect(read("src/components/seller/seller-tabs.tsx")).toMatch(/export function SegmentedTablist/);
  });
});

describe("S28 2-3: Tendencias and card grids", () => {
  const trends = read("src/components/seller/seller-trends.tsx");
  it("has image cards from local covers, no lane tabs and no diary link", () => {
    expect(trends).toMatch(/from "next\/image"/);
    expect(trends).toMatch(/post\.cover\.src/);
    expect(trends).not.toMatch(/role="tablist"|trendsAll|trendsDiary|Abrir el diario/);
  });
  it("reaches three columns in a 44rem container and four at 72rem", () => {
    expect(trendsGridClass).toMatch(/@\[44rem\]\/trends:grid-cols-3/);
    expect(trendsGridClass).toMatch(/@\[72rem\]\/trends:grid-cols-4/);
  });
  it("asesoramiento cards auto-fill 18rem columns and the services dialog shows three at lg", () => {
    const picker = read("src/components/advisor/advisory-picker.tsx");
    expect(picker).toMatch(/repeat\(auto-fill,minmax\(min\(100%,18rem\),1fr\)\)/);
    expect(picker).toMatch(/sm:grid-cols-2 lg:grid-cols-3/);
    expect(picker).toMatch(/lg:max-w-5xl/);
  });
});

describe("S28 4: tooltips have no pinned state", () => {
  it("InfoHint and StepHint open on hover/focus and close on leave/blur", () => {
    const hint = read("src/components/ui/info-hint.tsx");
    expect(hint).not.toMatch(/setPinned|\bpinned\)/);
    expect(hint).toMatch(/onBlur=\{hide\}/);
    const pipeline = read("src/components/investor/deal-pipeline.tsx");
    expect(pipeline).not.toMatch(/setPinned/);
    expect(pipeline).toMatch(/pointerType === "mouse"\) return;/);
  });
});

describe("S28 5-6: locked figures note and EBITDA margin", () => {
  it("the NDA note is a tinted glass, not plain white", () => {
    const report = read("src/components/seller/company-report.tsx");
    expect(report).toMatch(/bg-\[#e6f4f2\]\/70[^"]*backdrop-blur-md/);
  });
  it("labels the percentage as a margin and explains the formula", () => {
    expect(marginShortLabel("Margen EBITDA ajustado")).toBe("Margen aj.");
    expect(marginShortLabel("Margen EBITDA")).toBe("Margen");
    expect(marginExplain("Margen EBITDA", "12 %")).toBe("Margen EBITDA: 12 % (EBITDA / facturación).");
    expect(marginExplain("Margen EBITDA ajustado", "12 %")).toBe("Margen EBITDA ajustado: 12 % (EBITDA ajustado / facturación).");
    expect(read("src/components/investor/market-card.tsx")).toMatch(/marginExplain\(/);
  });
});

describe("S28 7-8: one short toast at a time", () => {
  const toast = read("src/components/shell/app-toast.tsx");
  const css = read("src/app/globals.css");
  it("drops the ghost stack and its hover fan-out", () => {
    expect(toast).not.toMatch(/releva-toast-stack-ghost/);
    expect(css).not.toMatch(/releva-toast-stack-ghost|releva-toast-stack:hover/);
    expect(toast).toMatch(/ticket !== latest/);
  });
  it("is one line on desktop, sized to its text, and wraps on phones without truncation", () => {
    expect(toast).toMatch(/lg:whitespace-nowrap/);
    expect(toast).not.toMatch(/className="[^"]*(truncate|line-clamp|text-ellipsis)/);
    expect(css).toMatch(/\.releva-toast-stack \{[\s\S]*?width: max-content;[\s\S]*?max-width: min\(46rem/);
  });
  it("keeps every toast message short enough for one desktop line", () => {
    const messages = [
      advisoryCopy.saved,
      engagementCopy.advisorRequested,
      engagementCopy.stayOnPlatform,
      authCopy.emailChangeHeld,
      authCopy.emailChangeSent,
      companyCopy.descriptionPrivate,
      companyCopy.autosaveSaved,
      companyCopy.autosaveError,
      billingCopy.stripeMissing,
    ];
    for (const message of messages) {
      expect(message.length, message).toBeLessThanOrEqual(85);
    }
  });
});

describe("S28 9: Contacta con un asesor sits in the bottom-right actions", () => {
  it("the header cue no longer carries the asesor link", () => {
    const pipeline = read("src/components/investor/deal-pipeline.tsx");
    // S29b: the Revisión choice (the last header cue with an asesor link) is gone with its step.
    expect(pipeline).not.toMatch(/DiligenceChoice|advisorHref/);
  });
  for (const file of ["src/components/investor/investor-processes.tsx", "src/components/seller/seller-processes.tsx"]) {
    it(`${file} shows it from Preguntas through Contrato, after the right-hand actions`, () => {
      const source = read(file);
      expect(source).toMatch(/current\?\.id === "qa" \|\| current\?\.id === "loi" \|\| current\?\.id === "documents"/);
      expect(source).toMatch(/ml-auto flex flex-wrap items-center justify-end gap-2">[\s\S]{0,260}?(actions|processActions)\}[\s\S]{0,200}?wantsAdvisor/);
    });
  }
});

describe("S28 10-11: asesoramiento nudges and accurate copy", () => {
  it("cards stay clickable and point at the empresa field when none is chosen", () => {
    const card = read("src/components/advisor/advisor-listing-card.tsx");
    expect(card).toMatch(/onNeedCompany/);
    expect(card).not.toMatch(/disabled=\{[^}]*!projectSlug/);
    expect(read("src/components/advisor/advisory-picker.tsx")).toMatch(/data-company-ring/);
    expect(engagementCopy.pickCompanyFirst).toBe("Elige primero la empresa del encargo.");
  });
  it("does not promise a chat before the asesor accepts", () => {
    expect(engagementCopy.advisorRequested).toMatch(/Si el asesor la acepta/);
    expect(advisoryCopy.saved).not.toMatch(/Deal Managers/);
    expect(read("src/lib/server/fulfill-checkout.ts")).toMatch(/"\/mi-empresa\/procesos" : "\/procesos"/);
  });
});

describe("S28 12-13: INT tag and activity row", () => {
  it("the INT tag is top right", () => {
    const badge = read("src/components/shell/int-badge.tsx");
    expect(badge).toMatch(/fixed top-0 right-4/);
    expect(read("src/app/onboarding/page.tsx")).toMatch(/absolute top-6 right-6 z-20">\s*<IntBadge \/>/);
  });
  it("activity tiles share one row and only scroll when even compact tiles cannot fit", () => {
    expect(activityRowClass).toMatch(/grid-flow-col/);
    expect(activityRowClass).toMatch(/auto-cols-\[minmax\(8rem,1fr\)\]/);
    expect(activityRowClass).toMatch(/overflow-x-auto/);
    const tiles = read("src/components/shell/activity-tiles.tsx");
    expect(tiles).toMatch(/@container\/tile/);
    expect(tiles).not.toMatch(/flex-wrap/);
  });
});
