import { describe, expect, it } from "vitest";
import { passwordResetEmail, welcomeEmail } from "./messages";

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

describe("reportReadyEmail visual (t84)", () => {
  it("draws real sales as table bars with no SVG or script", async () => {
    const { reportReadyEmail } = await import("./messages");
    const mail = reportReadyEmail("Ana", "Acme SL", "https://example.com/mi-empresa", {
      sales: [
        { year: 2022, cents: 100_000_000 },
        { year: 2023, cents: 150_000_000 },
      ],
    });
    expect(mail.html).toContain("Ventas por ejercicio");
    expect(mail.html).toContain('width="100%"');
    expect(mail.html).toContain("https://example.com/brand/email-logo-white.png");
    expect(mail.html).not.toMatch(/<svg|<script/i);
    expect(mail.text).toContain("2023:");
    expect(mail.text).not.toMatch(/inversor/i);
  });
});
