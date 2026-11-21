import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import manifest from "@/app/manifest";
import { blogCopy } from "@/lib/blog";
import { landingCopy } from "@/lib/landing-copy";
import { ORGANIZATION_LOGO_PATH, rootIcons, siteJsonLd } from "@/lib/seo-head";

describe("S32 Google result", () => {
  it("keeps the home title and description within search-result limits", () => {
    expect(landingCopy.home.title.length).toBeLessThanOrEqual(60);
    expect(landingCopy.home.title).toContain("Relify");
    expect(landingCopy.home.description.length).toBeGreaterThanOrEqual(110);
    expect(landingCopy.home.description.length).toBeLessThanOrEqual(160);
  });

  it("names the blog Blog instead of Diario", () => {
    expect(blogCopy.title).toBe("Blog");
    expect(JSON.stringify(landingCopy)).not.toContain("Diario");
  });

  it("publishes Organization and WebSite structured data with an absolute logo", () => {
    const data = siteJsonLd(new URL("https://itsrelify.com"), "Descripción");
    const [org, site] = data["@graph"];
    expect(org).toMatchObject({ "@type": "Organization", name: "Relify", url: "https://itsrelify.com/" });
    expect(org?.logo).toMatchObject({ url: `https://itsrelify.com${ORGANIZATION_LOGO_PATH}` });
    expect(site).toMatchObject({ "@type": "WebSite", name: "Relify", publisher: { "@id": "https://itsrelify.com/#organization" } });
  });

  it("declares icons and manifest entries that exist in public/", () => {
    const urls = [
      ...rootIcons().icon.map((icon) => icon.url),
      ...rootIcons().apple.map((icon) => icon.url),
      ...(manifest().icons ?? []).map((icon) => icon.src),
      ORGANIZATION_LOGO_PATH,
    ];
    for (const url of urls) {
      expect(existsSync(join(process.cwd(), "public", url)), url).toBe(true);
    }
    expect(manifest().icons?.some((icon) => icon.purpose === "maskable")).toBe(true);
  });
});

import { readFileSync } from "node:fs";
import { adjustmentsForBuyer, approvedAdjustments, formRowsFromJson, mergePostedAdjustments, storedEbitdaAdjustments } from "@/lib/ebitda-adjustments";
import { adjustmentDecisionNotice } from "@/lib/server/decide-ebitda-adjustment";
const rejectedAdjustmentNotice = (note: string | null) => adjustmentDecisionNotice("rejected", note);
import { corporateMissing } from "@/lib/advisor-profile";
import { advisorCopy } from "@/lib/advisor-copy";
import { estimatePriceRange } from "@/lib/valuation-multiples";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const rejectedRow = { id: "11111111-1111-4111-8111-111111111111", type: "other", amountCents: 500000, reason: "Gasto puntual", status: "rejected", reviewNote: "Falta justificante", documentId: null, documentName: null };

describe("S32 denied EBITDA adjustment", () => {
  it("keeps rejected rows and their note, never counts or shows them to buyers", () => {
    const rows = storedEbitdaAdjustments([rejectedRow]) ?? [];
    expect(rows[0]).toMatchObject({ status: "rejected", reviewNote: "Falta justificante" });
    expect(approvedAdjustments(rows)).toEqual([]);
    expect(adjustmentsForBuyer(rows, true)).toEqual([]);
    expect(formRowsFromJson(JSON.stringify([{ ...rejectedRow, amount: "5000" }]))[0]?.status).toBe("rejected");
  });

  it("sends an edited rejected row back to review and drops the note", () => {
    const rows = storedEbitdaAdjustments([rejectedRow]) ?? [];
    const posted = { id: rejectedRow.id, type: "other" as const, amountCents: 600000, reason: "Gasto puntual", documentId: null, documentName: null };
    const [next] = mergePostedAdjustments([posted], rows);
    expect(next?.status).toBe("pending");
    expect(next?.reviewNote).toBeUndefined();
    const [same] = mergePostedAdjustments([{ ...posted, amountCents: 500000 }], rows);
    expect(same).toMatchObject({ status: "rejected", reviewNote: "Falta justificante" });
  });

  it("puts the admin note in the seller's aviso", () => {
    expect(rejectedAdjustmentNotice("Falta justificante").body).toContain("Motivo: Falta justificante");
    expect(rejectedAdjustmentNotice(null).body).not.toContain("Motivo");
  });
});

describe("S32 small items", () => {
  it("lists what Datos corporativos still needs", () => {
    expect(corporateMissing({ businessName: "Asesores Norte S.L.", nif: "", postalCode: "28001", description: "corta", sectors: [] })).toEqual([
      "NIF",
      "descripción (mín. 50 caracteres)",
      "sectores",
    ]);
  });

  it("uses one-line advisor labels", () => {
    expect(advisorCopy.stepRequest).toBe("Solicitudes");
    expect(advisorCopy.stepDeposit).toBe("Depósito");
  });

  it("returns the EBITDA the range was built on", () => {
    expect(estimatePriceRange({ cnae: "56.10", ebitdaCents: 10_000_000 })?.ebitdaCents).toBe(10_000_000);
  });

  it("wires the remaining UI items", () => {
    const form = read("src/components/seller/company-draft-form.tsx");
    expect(form).toMatch(/align="center"/);
    expect(form).toMatch(/<MarginValue value=\{shownAdjustedMargin\}/);
    expect(form).toMatch(/<PlaceAutocomplete/);
    expect(read("src/components/investor/favorite-button.tsx")).toMatch(/relify-heart-burst/);
    expect(read("src/app/globals.css")).toMatch(/prefers-reduced-motion: reduce\)[\s\S]*relify-heart-pop/);
    expect(read("src/components/auth/platform-terms-dialog.tsx")).toMatch(/fireSideCannons\(dialogRef\.current/);
    expect(read("src/components/advisor/advisor-processes.tsx")).toMatch(/MutedAdvisorBoards/);
  });
});
