import { describe, expect, it } from "vitest";
import { valuationRequestEmail } from "./valuation-request-email";

describe("valuationRequestEmail", () => {
  it("addresses info@ and carries CIF, contact and the admin link", () => {
    const mail = valuationRequestEmail({
      cif: "B12345674",
      contactName: "Ana <Pérez>",
      contactEmail: "ana@example.com",
      phone: "+34 600 00 00 00",
      linkedAccount: true,
      adminUrl: "https://example.com/admin/valoraciones",
      at: new Date("2026-11-10T10:00:00.000Z"),
    });
    expect(mail.to).toBe("info@itsrelify.com");
    expect(mail.subject).toBe("Valoración solicitada: Ana <Pérez> (B12345674)");
    expect(mail.text).toContain("CIF: B12345674");
    expect(mail.text).toContain("ana@example.com");
    expect(mail.text).toContain("Cuenta: Vinculada");
    expect(mail.text).toContain("https://example.com/admin/valoraciones");
    expect(mail.html).toContain("Ana &lt;Pérez&gt;");
    expect(mail.html).toContain("https://example.com/admin/valoraciones");
  });

  it("marks a visitor and blanks the phone", () => {
    const mail = valuationRequestEmail({
      cif: "B12345674",
      contactName: "Elena",
      contactEmail: "elena@example.com",
      linkedAccount: false,
      adminUrl: "https://example.com/admin/valoraciones",
    });
    expect(mail.text).toContain("Teléfono: —");
    expect(mail.text).toContain("Cuenta: Visitante");
  });
});
