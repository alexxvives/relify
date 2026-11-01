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
      expect(mail.text.toLowerCase()).not.toContain("inversor ");
      expect(mail.html).toContain("https://itsrelify.com/");
    }
    expect(welcomeEmail("investor", "Ana", site).text).toContain("Comprador");
  });
});
