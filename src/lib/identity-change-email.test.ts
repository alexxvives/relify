import { describe, expect, it } from "vitest";
import { identityChangeEmail, readIdentityChange } from "./identity-change-email";

describe("identity change request (t79)", () => {
  it("rejects an unknown field, an empty correct value and a missing reason", () => {
    expect(readIdentityChange({ field: "x", current: "", correct: "A", reason: "porque sí" }).ok).toBe(false);
    expect(readIdentityChange({ field: "cif", current: "B1", correct: " ", reason: "porque sí" }).ok).toBe(false);
    expect(readIdentityChange({ field: "cif", current: "B1", correct: "B2", reason: "no" }).ok).toBe(false);
  });

  it("emails the team inbox with current and correct values", () => {
    const parsed = readIdentityChange({ field: "legalName", current: "Vieja SL", correct: "Nueva SL", reason: "Cambio de denominación" });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const mail = identityChangeEmail({ request: parsed.request, codename: "Proyecto Ónix", ownerName: "Ana", ownerEmail: "a@b.es", adminUrl: "https://x/admin" });
    expect(mail.to).toBe("info@itsrelify.com");
    expect(mail.subject).toContain("nombre legal");
    expect(mail.text).toContain("Nueva SL");
    expect(mail.text).toContain("Vieja SL");
  });
});
