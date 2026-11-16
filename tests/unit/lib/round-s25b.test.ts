import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  companyLocationComplete,
  formatCompanyLocation,
  parseCompanyLocationField,
  projectLocationComplete,
  resolveProjectLocation,
} from "@/lib/company-location";
import { companyDraftSchema, emptyCompanyDraft } from "@/lib/company-draft";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

/** Legacy rows keep the place only in the composed `address`; postal_code/city are null, region may be "". */
const addressOnly = { address: "08022, Barcelona", street: null, postalCode: null, city: null, region: "" };

describe("S25b Ubicación complete agrees with what the wizard shows", () => {
  it("shows an address-only row as 08022, Barcelona", () => {
    const location = resolveProjectLocation(addressOnly);
    expect(formatCompanyLocation(location.postalCode, location.city)).toBe("08022, Barcelona");
  });

  it("counts that row as complete for the checklist and the publish gate", () => {
    expect(projectLocationComplete(addressOnly)).toBe(true);
    // The pre-S25b check only read city + region columns and said "missing".
    expect(`${addressOnly.city ?? ""}${addressOnly.region}`.trim().length > 0).toBe(false);
  });

  it("reads other legacy address shapes the same way as the field", () => {
    expect(projectLocationComplete({ address: "Carrer Demo 8, 08001 Barcelona", postalCode: null, city: null, region: "" })).toBe(true);
    expect(projectLocationComplete({ address: "", street: "Calle Mayor 1", postalCode: "28013", city: "Madrid", region: "" })).toBe(true);
    expect(projectLocationComplete({ address: "", postalCode: null, city: null, region: "Andalucía" })).toBe(true);
    expect(projectLocationComplete({ address: "", postalCode: null, city: null, region: "" })).toBe(false);
  });

  it("uses one rule in the wizard for what the seller typed", () => {
    const typed = (value: string) => companyLocationComplete({ ...parseCompanyLocationField(value), region: "" });
    expect(typed("08022, Barcelona")).toBe(true);
    expect(typed("Barcelona")).toBe(true);
    expect(typed("08022")).toBe(true);
    expect(typed("")).toBe(false);
    // A partial code is dropped on save (S25), so it must not count as filled.
    expect(typed("0802")).toBe(false);
  });

  it("keeps 08022, Barcelona through the save schema", () => {
    const parsed = companyDraftSchema.safeParse({ ...emptyCompanyDraft(), ...parseCompanyLocationField("08022, Barcelona") });
    expect(parsed.success && [parsed.data.postalCode, parsed.data.city]).toEqual(["08022", "Barcelona"]);
  });

  it("wires the wizard, the Inicio checklist and the publish checks to the shared rule", () => {
    expect(read("src/components/seller/company-draft-form.tsx")).toMatch(/location: companyLocationComplete\(\{ postalCode, city, region \}\)/);
    for (const file of ["src/lib/server/publish-checks.ts", "src/lib/server/get-seller-overview.ts"]) {
      const source = read(file);
      expect(source).toMatch(/location: projectLocationComplete\(project\)/);
      expect(source).toMatch(/address: true/);
    }
    expect(read("src/lib/server/get-company-draft.ts")).toMatch(/resolveProjectLocation\(draft\)/);
  });
});
