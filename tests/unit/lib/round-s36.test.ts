import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { advisorCopy } from "@/lib/advisor-copy";
import { engagementCopy } from "@/lib/engagement-copy";
import { stripeCatalog } from "@/lib/stripe-catalog";

const read = (path: string) => readFileSync(path, "utf8");

describe("S36 advisor encargo", () => {
  it("explains the deposit and the NDA, with no dead subscription copy", () => {
    expect(engagementCopy.depositFormula).toContain("{price}");
    expect(engagementCopy.ndaTurn).toMatch(/NDA/);
    for (const key of ["subscriptionFirst", "subscriptionFirstLink", "inboxLocked", "subscriptionPaidNote"]) {
      expect(Object.keys(engagementCopy)).not.toContain(key);
    }
  });

  it("puts deposit and NDA behind popups and the buyer card over the page", () => {
    const view = read("src/components/advisor/advisor-engagement-view.tsx");
    expect(view).toMatch(/lockAction=\{action\}/);
    expect(view).toMatch(/turn=\{turn\}/);
    expect(view).not.toMatch(/AdvisorNdaForm|AdvisorDepositForm/);
    expect(read("src/components/advisor/advisor-rail-dock.tsx")).toMatch(/data-advisor-buyer-overlay/);
  });
});

describe("S36 Mis servicios and Stripe", () => {
  it("drops the preview note and the Ver operación link", () => {
    expect(Object.keys(advisorCopy)).not.toContain("listingEmpty");
    expect(Object.keys(advisorCopy)).not.toContain("closeOpen");
  });

  it("names the advisor product Suscripción asesor", () => {
    expect(JSON.stringify(stripeCatalog)).toContain("Suscripción asesor");
    expect(JSON.stringify(stripeCatalog)).not.toContain("bandeja");
  });
});
