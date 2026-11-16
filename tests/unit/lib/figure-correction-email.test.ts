import { describe, expect, it } from "vitest";
import { figureCorrectionEmail } from "@/lib/figure-correction-email";
import { SABI_NOTIFY_TO } from "@/lib/sabi-request-email";

describe("figureCorrectionEmail", () => {
  it("goes to the team inbox with the seller's note", () => {
    const mail = figureCorrectionEmail({
      companyName: "Acme SL",
      ownerName: "Ana",
      ownerEmail: "ana@example.com",
      message: "Las ventas de 2024 son 1,2 M€.",
      adminUrl: "https://example.com/admin/empresas/acme",
      at: new Date("2026-11-02T10:00:00Z"),
    });
    expect(mail.to).toBe(SABI_NOTIFY_TO);
    expect(mail.subject).toBe("Corrección de cifras: Acme SL");
    expect(mail.text).toContain("Las ventas de 2024 son 1,2 M€.");
    expect(mail.text).toContain("ana@example.com");
  });
});
