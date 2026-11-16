import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { stepCtaClass, stepSecondaryClass } from "@/components/investor/step-cta";
import { notificationPanelMaxPx } from "@/components/shell/notification-bell";
import { identityOnSign } from "@/lib/identity-declaration";
import { platformTermsCopy } from "@/lib/platform-terms";
import { isValidSpanishPersonId } from "@/lib/spanish-cif";

const read = (file: string) => readFileSync(join(process.cwd(), file), "utf8");

describe("S29 1: short activity labels", () => {
  it("uses Solicitudes and Visitas so every label fits one line", () => {
    expect(read("src/components/shell/activity-summary.tsx")).toMatch(/label: "Solicitudes", value: funnel\.requests/);
    expect(read("src/components/shell/activity-summary.tsx")).not.toMatch(/Solicitudes enviadas/);
    expect(read("src/components/seller/seller-activity-summary.tsx")).toMatch(/label: "Visitas", value: funnel\.views/);
    expect(read("src/components/seller/seller-activity-summary.tsx")).toMatch(/label: "Días en venta"/);
  });
});

describe("S29 2: one green step CTA", () => {
  it("is a compact green pill shared by NDA, LOI and Contrato", () => {
    expect(stepCtaClass).toMatch(/h-9/);
    expect(stepCtaClass).toMatch(/bg-\[#17663a\]/);
    expect(stepSecondaryClass).toMatch(/h-9/);
    const pipeline = read("src/components/investor/deal-pipeline.tsx");
    // S29b: Seguir a documentación left with the Revisión step; Firmar NDA / Proceder al LOI / Firmar LOI remain.
    expect(pipeline.match(/className=\{stepCtaClass\}/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
    expect(pipeline).not.toMatch(/h-9 shrink-0 items-center rounded-full bg-\[#17663a\]/);
    const contract = read("src/components/investor/contract-stage.tsx");
    expect(contract).toMatch(/className=\{signed \? stepSecondaryClass : stepCtaClass\}/);
    expect(contract).not.toMatch(/h-11 shrink-0 items-center justify-center gap-2 rounded-full px-4/);
  });
});

describe("S29 4: narrower Avisos panel", () => {
  it("is 360 px wide from 640 px up and spans the viewport on phones", () => {
    expect(notificationPanelMaxPx).toBe(360);
    const bell = read("src/components/shell/notification-bell.tsx");
    expect(bell).toMatch(/window\.innerWidth < 640 \? full : Math\.min\(notificationPanelMaxPx, full\)/);
    expect(bell).not.toMatch(/36rem|36 \* 16/);
  });
});

describe("S29 6-7: DNI/NIE and the identity checkbox", () => {
  it("asks only when no DNI/NIE is stored and otherwise names the stored one, masked", () => {
    expect(identityOnSign({ nationalIdMissing: true, collectIdentity: false })).toBe("ask");
    expect(identityOnSign({ nationalIdMissing: false, collectIdentity: false })).toBe("skip");
    const pad = read("src/components/investor/signature-pad.tsx");
    expect(pad).toMatch(/showStored = !askId && nationalIdMasked !== null/);
    expect(pad).toMatch(/data-stored-national-id/);
  });
  it("the standalone /acuerdo page passes the signer, so the stored DNI/NIE shows masked there too", () => {
    expect(read("src/app/acuerdo/page.tsx")).toMatch(/<SignerProvider nationalIdMissing=\{user\.nationalIdMissing\}/);
  });
  it("has no Declaro que los datos son míos y correctos checkbox or server gate", () => {
    expect(existsSync(join(process.cwd(), "src/components/auth/identity-declaration.tsx"))).toBe(false);
    for (const file of [
      "src/components/auth/onboarding-form.tsx",
      "src/components/investor/signature-pad.tsx",
      "src/app/onboarding/actions.ts",
      "src/app/proyectos/[slug]/actions.ts",
      "src/app/(app)/mandatos/encargos/actions.ts",
      "src/lib/auth-copy.ts",
    ]) {
      expect(read(file), file).not.toMatch(/identityDeclar|IdentityDeclaration|Declaro que los datos/);
    }
  });
  it("moves that commitment into the signed agreement", () => {
    const clause = platformTermsCopy.clauses.find((item) => item.title === "Tus datos");
    expect(clause?.text).toMatch(/DNI\/NIE/);
  });
  it("the INT seed gives synthetic accounts a DNI with a valid control letter", () => {
    const sql = read("prisma/int-s29-national-ids.sql");
    expect(sql).toMatch(/email LIKE '%@test\.local'/);
    expect(sql).toMatch(/substr\('TRWAGMYFPDXBNJZSQVHLCKE', \(m\.n % 23\)::int \+ 1, 1\)/);
    const letters = "TRWAGMYFPDXBNJZSQVHLCKE";
    for (const n of [90000001, 90000002, 90000023]) {
      expect(isValidSpanishPersonId(String(n).padStart(8, "0") + letters[n % 23])).toBe(true);
    }
  });
});

describe("S29 8: landing activity card tags", () => {
  it("shows only the industry tag, on the Interés / Conexión line", () => {
    const feed = read("src/components/landing/activity-feed.tsx");
    expect(feed).not.toMatch(/\{item\.revenue\}|EBITDA \{item\.ebitda\}/);
    expect(feed).toMatch(/flex items-start justify-between gap-2">\s*<p className="flex min-w-0[\s\S]*?data-sector-tag/);
  });
});

describe("S29 e2e isolation", () => {
  it("platform-agreement restores the agreement state even when the run fails", () => {
    const spec = read("tests/e2e/playwright/platform-agreement.spec.ts");
    expect(spec).toMatch(/terms_accepted_at = coalesce\(terms_accepted_at, \$3\)/);
    expect(spec).toMatch(/signature_png = coalesce\(signature_png, \$4\)/);
  });
});
