import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { advisorCopy } from "@/lib/advisor-copy";
import { advisorEngagementHref } from "@/lib/advisor-processes";
import { companyCopy } from "@/lib/company-copy";
import { engagementCopy } from "@/lib/engagement-copy";
import { investorCopy } from "@/lib/investor-copy";
import { destinationIsCurrent } from "@/lib/shell";

const read = (path: string) => readFileSync(path, "utf8");

describe("S37 copy", () => {
  it("uses stage-aware, shorter texts", () => {
    expect(investorCopy.sectorsPlaceholder).toBe("Añade los sectores que te interesan");
    expect(companyCopy.figuresLocked).toMatch(/conexión/);
    expect(companyCopy.figuresLocked).not.toMatch(/NDA/);
    expect(companyCopy.figuresLockedNda).toMatch(/NDA/);
    expect(companyCopy.figuresLockedNda).not.toMatch(/conexión/);
    expect(engagementCopy.depositBody).toBe("Pagarlo acepta la solicitud y te reserva el encargo.");
    expect(engagementCopy.ndaTurn).toBe("Firma tu NDA para ver las cifras y la sala de datos.");
    expect(advisorCopy.profileSubscription).toBe("Suscripción de asesor");
    for (const key of ["subscribe", "subscribeNote", "documentsEmpty", "documentsDrop"]) {
      expect(Object.keys(advisorCopy)).not.toContain(key);
    }
    expect(Object.keys(engagementCopy)).not.toContain("depositVat");
  });
});

describe("S37 advisor routes", () => {
  it("opens paid encargos under Mis procesos", () => {
    expect(advisorEngagementHref("e1", true)).toBe("/mandatos/venta/e1");
    expect(advisorEngagementHref("e1", false)).toBe("/mandatos/encargos/e1");
    expect(destinationIsCurrent("/mandatos/venta", "/mandatos/venta/e1")).toBe(true);
    expect(destinationIsCurrent("/mandatos/encargos", "/mandatos/venta/e1")).toBe(false);
    expect(destinationIsCurrent("/mandatos/encargos", "/mandatos/encargos/e1")).toBe(true);
  });

  it("shares one signing popup and starts the buyer card open", () => {
    expect(read("src/components/advisor/advisor-engagement-forms.tsx")).toMatch(/SignAgreementDialog/);
    expect(read("src/components/investor/deal-pipeline.tsx")).toMatch(/SignAgreementDialog/);
    expect(read("src/components/advisor/advisor-rail-dock.tsx")).toMatch(/open === null \? "hidden lg:block"/);
  });
});
