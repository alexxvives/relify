import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { identityOnSign } from "@/lib/identity-declaration";

describe("NDA then LOI identity reuse", () => {
  it("asks for DNI on NDA when missing, then skips it on LOI once stored", () => {
    expect(identityOnSign({ nationalIdMissing: true, collectIdentity: true })).toBe("ask");
    expect(identityOnSign({ nationalIdMissing: false, collectIdentity: true })).toBe("confirm");
    expect(identityOnSign({ nationalIdMissing: false, collectIdentity: false })).toBe("skip");
    expect(identityOnSign({ nationalIdMissing: true, collectIdentity: false })).toBe("ask");
  });

  it("writes national_id on NDA and does not collect identity on the LOI pad", () => {
    const ndaAction = readFileSync(path.join(process.cwd(), "src/app/proyectos/[slug]/actions.ts"), "utf8");
    const pad = readFileSync(path.join(process.cwd(), "src/components/investor/signature-pad.tsx"), "utf8");
    const pipeline = readFileSync(path.join(process.cwd(), "src/components/investor/deal-pipeline.tsx"), "utf8");
    const ensure = readFileSync(path.join(process.cwd(), "src/lib/server/ensure-national-id.ts"), "utf8");
    expect(ndaAction).toMatch(/export async function acceptNdaAction[\s\S]*ensureNationalId\(user\.id, formData\.get\("nationalId"\)\)/);
    expect(ensure).toMatch(/data: \{ nationalId: normalizeCif\(parsed\.data\) \}/);
    expect(pipeline).toMatch(/collectIdentity=\{kind === "nda"\}/);
    expect(pad).toMatch(/identityOnSign\(\{ nationalIdMissing, collectIdentity \}\)/);
  });

  it("seeds the INT buyer DNI so LOI reuse can be tested after a pre-S17 NDA", () => {
    const fixtures = readFileSync(path.join(process.cwd(), "prisma/int-consultoria-buyer-fixtures.sql"), "utf8");
    const seed = readFileSync(path.join(process.cwd(), "scripts/generate-corrected-seed.mjs"), "utf8");
    expect(fixtures).toMatch(/int-comprador@test\.local/);
    expect(fixtures).toMatch(/national_id = '12345678Z'/);
    expect(fixtures).toMatch(/cuentas-2024\.pdf/);
    expect(fixtures).toMatch(/modelo-200\.pdf/);
    expect(fixtures).toMatch(/pacto-socios\.pdf/);
    expect(fixtures).toMatch(/int-cs-share-cuentas/);
    expect(fixtures).toMatch(/int-cs-share-modelo/);
    expect(fixtures).not.toMatch(/int-cs-share-pacto/);
    expect(seed).toMatch(/national_id = '12345678Z'/);
    expect(seed).toMatch(/pacto-socios not shared/);
  });
});
