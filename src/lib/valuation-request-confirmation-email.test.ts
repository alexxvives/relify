import { describe, expect, it } from "vitest";
import { valuationCopy } from "./valuation-request";
import { valuationRequestConfirmationEmail } from "./valuation-request-confirmation-email";

describe("valuationRequestConfirmationEmail", () => {
  it("writes to the requester with the confirmation sentence and the CIF", () => {
    const mail = valuationRequestConfirmationEmail({
      contactName: "Ana Pérez",
      contactEmail: "Ana@Example.com",
      cif: "B12345674",
      siteUrl: "https://itsrelify.com",
    });
    expect(mail.to).toBe("ana@example.com");
    expect(mail.subject).toBe("Hemos recibido tu solicitud de valoración");
    expect(mail.text).toContain(valuationCopy.doneBody);
    expect(mail.text).toContain("B12345674");
    expect(mail.html).toContain("Hola, Ana");
    expect(mail.html).toContain("https://itsrelify.com/");
  });
});
