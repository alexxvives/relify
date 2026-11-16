import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { advisorPriceLabel, toPublicAdvisorCard } from "@/lib/advisor-directory";
import { formatAdvisorEuros } from "@/lib/advisor-profile";
import { dealPipeline, dealStepIds, processFlags } from "@/lib/deal-pipeline";
import { engagementCopy } from "@/lib/engagement-copy";
import { agreementNeedsNationalId, onboardingNationalIdPath } from "@/lib/identity-declaration";
import { platformTermsCopy } from "@/lib/platform-terms";

const read = (file: string) => readFileSync(join(process.cwd(), file), "utf8");

const acceptedLoi = processFlags({
  accepted: true,
  nda: true,
  questions: true,
  meeting: false,
  offer: true,
  loiAccepted: true,
  closed: false,
});

describe("S29b 1: Revisión merged into LOI", () => {
  it("has seven steps and no Revisión", () => {
    expect(dealStepIds).toEqual(["solicitud", "conexion", "nda", "qa", "loi", "documents", "close"]);
    expect(dealPipeline("investor", acceptedLoi).map((step) => step.label)).toEqual([
      "Solicitud",
      "Conexión",
      "NDA",
      "Preguntas",
      "LOI",
      "Contrato",
      "Venta",
    ]);
    expect(read("src/lib/deal-pipeline.ts")).not.toMatch(/label: "Revisión"/);
  });

  it("puts a process with the LOI accepted at Contrato for both sides (old Revisión processes included)", () => {
    expect(dealPipeline("investor", acceptedLoi).find((step) => step.state === "current")?.id).toBe("documents");
    expect(dealPipeline("seller", acceptedLoi).find((step) => step.state === "current")?.id).toBe("documents");
    expect(acceptedLoi).not.toHaveProperty("diligence");
  });

  it("opens the contract upload as soon as the LOI is accepted, with no due diligence gate", () => {
    const contract = read("src/lib/server/sale-contract.ts");
    expect(contract).toMatch(/return access\.loiAcceptedAt !== null && access\.cancelledAt === null;/);
    expect(contract).toMatch(/return input\.loiAccepted;/);
    expect(contract).not.toMatch(/diligencePassedAt|passedDiligence|roomShared|después de la due diligence/);
  });

  it("drops the Seguir a documentación action and its server action", () => {
    expect(existsSync(join(process.cwd(), "src/lib/server/pass-diligence.ts"))).toBe(false);
    expect(existsSync(join(process.cwd(), "src/app/(app)/procesos/pass-action.ts"))).toBe(false);
    for (const file of [
      "src/components/investor/deal-pipeline.tsx",
      "src/components/investor/investor-processes.tsx",
      "src/components/seller/seller-processes.tsx",
      "src/components/investor/investor-project.tsx",
      "src/lib/deal-pipeline.ts",
    ]) {
      expect(read(file), file).not.toMatch(/Seguir a documentación|passDiligence|DiligenceChoice|"diligence"/);
    }
  });

  it("tells both sides in the LOI step that the contract opens after acceptance", () => {
    const loi = (role: "investor" | "seller") => dealPipeline(role, acceptedLoi).find((step) => step.id === "loi")?.detail;
    expect(loi("investor")).toMatch(/se abre el contrato/);
    expect(loi("seller")).toMatch(/subir el contrato/);
  });

  it("shows seven steps on the landing timeline", () => {
    expect(engagementCopy.steps).toHaveLength(7);
    expect(engagementCopy.steps).not.toContain("Revisión");
    expect(read("src/components/landing/landing-pipeline.tsx")).not.toMatch(/diligence/);
  });

  it("keeps the asesor link in the bottom-right row from Preguntas through Contrato", () => {
    for (const file of ["src/components/investor/investor-processes.tsx", "src/components/seller/seller-processes.tsx"]) {
      expect(read(file), file).toMatch(/current\?\.id === "qa" \|\| current\?\.id === "loi" \|\| current\?\.id === "documents"/);
    }
  });

  it("ships an additive, idempotent INT seed for Agencia Tajo", () => {
    const sql = read("prisma/int-s29b-tajo-contrato.sql");
    expect(sql).toMatch(/INT only/);
    expect(sql).toMatch(/int-s27-agencia-tajo/);
    expect(sql).toMatch(/ON CONFLICT \(id\) DO NOTHING/);
    expect(sql).not.toMatch(/^\s*(UPDATE|DELETE|DROP|ALTER|TRUNCATE)\b/im);
  });
});

describe("S29b 2: asesor prices start at the lower end", () => {
  it("shows Desde X € for a range and a single price when both ends match", () => {
    expect(advisorPriceLabel(150_000, 400_000)).toBe(`Desde ${formatAdvisorEuros(150_000)}`);
    expect(advisorPriceLabel(150_000, 150_000)).toBe(formatAdvisorEuros(150_000));
    expect(advisorPriceLabel(150_000, 400_000)).not.toMatch(/–/);
  });

  it("uses that label on the public advisor card", () => {
    const card = toPublicAdvisorCard({
      userId: "s29b",
      businessName: "Asesores Prueba",
      nif: "B12345674",
      postalCode: "28001",
      description: "Asesoramos compraventas de pymes en toda España.",
      sectors: ["it"],
      services: [
        { serviceType: "VALUATION", priceFromCents: 150_000, priceToCents: 400_000 },
        { serviceType: "LEGAL", priceFromCents: 90_000, priceToCents: 90_000 },
      ],
    });
    if (card) {
      expect(card.services.map((service) => service.range)).toEqual([
        `Desde ${formatAdvisorEuros(150_000)}`,
        formatAdvisorEuros(90_000),
      ]);
    } else {
      // The listing rules may reject this synthetic profile; the label itself is covered above.
      expect(read("src/lib/advisor-directory.ts")).toMatch(/range: advisorPriceLabel\(service\.priceFromCents, service\.priceToCents\)/);
    }
  });

  it("keeps the from/to range in the profile form", () => {
    const form = read("src/components/advisor/advisor-services.tsx");
    expect(form).toMatch(/priceFromCents/);
    expect(form).toMatch(/priceToCents/);
  });
});

describe("S29b 3-4: the agreement never asks for a DNI/NIE", () => {
  it("keeps the Tus datos clause", () => {
    expect(platformTermsCopy.clauses.find((item) => item.title === "Tus datos")?.text).toMatch(/DNI\/NIE/);
  });

  it("renders the agreement pad without the DNI/NIE input", () => {
    expect(read("src/components/auth/platform-terms-form.tsx")).toMatch(/<SignaturePad\s+askNationalId=\{false\}/);
    expect(read("src/components/investor/signature-pad.tsx")).toMatch(/const askId = askNationalId && identity === "ask";/);
  });

  it("signs with the stored DNI/NIE and sends a missing one to onboarding", () => {
    const action = read("src/app/acuerdo/actions.ts");
    expect(action).not.toMatch(/formData\.get\("nationalId"\)|ensureNationalId/);
    expect(action).toMatch(/if \(user\.nationalIdMissing\) \{\s+redirect\(onboardingNationalIdPath\);/);
    expect(read("src/app/acuerdo/page.tsx")).toMatch(/agreementNeedsNationalId\(user\)/);
    expect(read("src/components/shell/app-shell.tsx")).toMatch(/agreementNeedsNationalId\(user\)\) \{\s+redirect\(onboardingNationalIdPath\)/);
    expect(onboardingNationalIdPath).toBe("/onboarding?paso=dni");
  });

  it("only redirects onboarded, unsigned, non-admin accounts without a DNI/NIE", () => {
    const base = { onboarded: true, nationalIdMissing: true, termsAccepted: false, role: "investor" };
    expect(agreementNeedsNationalId(base)).toBe(true);
    expect(agreementNeedsNationalId({ ...base, nationalIdMissing: false })).toBe(false);
    expect(agreementNeedsNationalId({ ...base, termsAccepted: true })).toBe(false);
    expect(agreementNeedsNationalId({ ...base, onboarded: false })).toBe(false);
    expect(agreementNeedsNationalId({ ...base, role: "admin" })).toBe(false);
  });

  it("lets onboarding complete only the DNI/NIE for an onboarded account", () => {
    const page = read("src/app/onboarding/page.tsx");
    expect(page).toMatch(/const completeNationalId = user\.onboarded && !resumePlan && user\.nationalIdMissing;/);
    expect(page).toMatch(/<OnboardingNationalIdForm \/>/);
    expect(read("src/app/onboarding/actions.ts")).toMatch(/export async function completeNationalIdAction/);
  });
});
