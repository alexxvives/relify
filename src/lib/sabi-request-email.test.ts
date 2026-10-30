import { describe, expect, it } from "vitest";
import { sabiRequestEmail } from "./sabi-request-email";

describe("sabiRequestEmail", () => {
  it("addresses info@ and carries the company, CIF, owner and admin link", () => {
    const mail = sabiRequestEmail({
      companyName: "Cumbres <SL>",
      cif: "B12345678",
      ownerName: "Ana",
      ownerEmail: "ana@example.com",
      adminUrl: "https://example.com/admin/empresas/x",
    });
    expect(mail.to).toBe("info@itsrelify.com");
    expect(mail.subject).toBe("SABI pendiente: Cumbres <SL> (B12345678)");
    expect(mail.text).toContain("CIF: B12345678");
    expect(mail.text).toContain("ana@example.com");
    expect(mail.text).toContain("hora de Madrid");
    expect(mail.html).toContain("Cumbres &lt;SL&gt;");
    expect(mail.html).toContain("https://example.com/admin/empresas/x");
  });

  it("falls back when the registry has no name", () => {
    expect(sabiRequestEmail({ companyName: " ", cif: "B1", ownerName: "", ownerEmail: "a@b.c", adminUrl: "u" }).subject).toContain(
      "Empresa sin razón social",
    );
  });
});
