import { describe, expect, it } from "vitest";
import { waitlistConfirmationEmail } from "@/lib/waitlist-confirmation-email";

describe("waitlistConfirmationEmail", () => {
  it("writes to the person who signed up, without a fixed opening day", () => {
    const mail = waitlistConfirmationEmail({
      role: "company",
      name: "Alexandre Vives",
      email: "AlexxVives@gmail.com",
      city: "Barcelona",
      siteUrl: "https://itsrelify.com",
    });
    expect(mail.to).toBe("alexxvives@gmail.com");
    expect(mail.subject).toBe("Hemos recibido tu solicitud en Relify");
    expect(mail.text).toContain("Hola, Alexandre");
    expect(mail.text).toContain("empresa");
    expect(mail.text).toContain("Esto no abre una cuenta para entrar.");
    expect(mail.text).toContain("Te escribiremos a este correo cuando abramos.");
    expect(mail.text).not.toContain("21 de noviembre");
    expect(mail.text).toContain("https://itsrelify.com/");
    expect(mail.html).toContain("https://itsrelify.com/brand/email-logo-white.png");
  });

  it("escapes the name", () => {
    const mail = waitlistConfirmationEmail({
      role: "advisor",
      name: "Ana<b> Pérez",
      email: "ana@example.com",
      city: "",
      siteUrl: "https://itsrelify.com",
    });
    expect(mail.html).toContain("Ana&lt;b&gt;");
    expect(mail.html).not.toContain("<b>");
    expect(mail.text).toContain("asesor");
  });
});
