import { describe, expect, it } from "vitest";
import { waitlistLeadEmail } from "@/lib/waitlist-lead-email";

describe("waitlistLeadEmail", () => {
  it("addresses info@ with the name, role, email, city and admin link", () => {
    const mail = waitlistLeadEmail({
      role: "advisor",
      name: "Ana <Pérez>",
      email: "ana@example.com",
      city: "Valencia",
      adminUrl: "https://example.com/admin/lista-de-espera",
      at: new Date("2026-11-05T10:00:00.000Z"),
    });
    expect(mail.to).toBe("info@itsrelify.com");
    expect(mail.subject).toBe("Lista de espera: Ana <Pérez> (Asesor)");
    expect(mail.text).toContain("ana@example.com");
    expect(mail.text).toContain("Perfil: Asesor");
    expect(mail.text).toContain("Ciudad: Valencia");
    expect(mail.text).toContain("https://example.com/admin/lista-de-espera");
    expect(mail.html).toContain("Ana &lt;Pérez&gt;");
  });

  it("leaves the city blank as a dash", () => {
    const mail = waitlistLeadEmail({
      role: "company",
      name: "Elena",
      email: "elena@example.com",
      city: "  ",
      adminUrl: "https://example.com/admin/lista-de-espera",
    });
    expect(mail.subject).toContain("(Empresa)");
    expect(mail.text).toContain("Ciudad: —");
  });
});
