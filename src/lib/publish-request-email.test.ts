import { describe, expect, it } from "vitest";
import { publishRequestEmail } from "./publish-request-email";

describe("publishRequestEmail", () => {
  it("goes to info@ with the company, owner and admin link", () => {
    const mail = publishRequestEmail({ companyName: "Cumbres <SL>", ownerName: "Ana", ownerEmail: "ana@example.com", adminUrl: "https://example.com/admin/empresas/x", paid: true });
    expect(mail.to).toBe("info@itsrelify.com");
    expect(mail.subject).toBe("Empresa para revisar: Cumbres <SL>");
    expect(mail.text).toContain("Pagada");
    expect(mail.html).toContain("Cumbres &lt;SL&gt;");
    expect(mail.html).toContain("https://example.com/admin/empresas/x");
  });
});
