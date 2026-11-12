import { describe, expect, it } from "vitest";
import { passwordResetEmail, welcomeEmail } from "@/lib/email/messages";

const site = new URL("https://itsrelify.com");

describe("email messages", () => {
  it("reset email carries the link and the 1 h expiry", () => {
    const mail = passwordResetEmail(
      "https://itsrelify.com/restablecer-contrasena?token=abc",
    );
    expect(mail.html).toContain("restablecer-contrasena?token=abc");
    expect(mail.text).toContain("1 hora");
  });

  it("welcome emails speak of comprador, never inversor", () => {
    for (const role of ["seller", "investor", "advisor"] as const) {
      const mail = welcomeEmail(role, "Ana", site);
      expect(
        mail.text.replace(/https:\/\/\S+/g, "").toLowerCase(),
      ).not.toContain("inversor");
      expect(mail.html).toContain("https://itsrelify.com/");
    }
    expect(welcomeEmail("investor", "Ana", site).text).toContain(
      "cuenta de comprador",
    );
  });
});

describe("reportReadyEmail (t85)", () => {
  it("is a clean notice with logo and CTA, no chart", async () => {
    const { reportReadyEmail } = await import("@/lib/email/messages");
    const mail = reportReadyEmail("Ana", "Acme SL", "https://example.com/mi-empresa");
    expect(mail.html).toContain("https://example.com/brand/email-logo-white.png");
    expect(mail.html).toContain("Ver mi ficha");
    expect(mail.html).not.toMatch(/<svg|<script|Ventas por ejercicio/i);
    expect(mail.text).not.toMatch(/inversor/i);
  });
});
