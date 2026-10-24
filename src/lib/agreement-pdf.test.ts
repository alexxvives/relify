import { describe, expect, it } from "vitest";
import { dealDocumentPdf, termsDocumentPdf } from "./agreement-pdf";
import { ndaAgreement } from "./deal-documents";

const decoder = new TextDecoder("latin1");
const signer = { fullName: "Lucía Fernández", nationalId: "12345678Z", role: "Comprador" };
const text = ndaAgreement({ buyerName: signer.fullName, codename: "Proyecto Atlas", region: "Cataluña", dateLabel: "24 de octubre de 2026" });

describe("signed agreement PDFs", () => {
  it("names both parties, the signer's DNI and numbers pages", () => {
    const pdf = decoder.decode(dealDocumentPdf({ kind: "nda", text, signer, dateLabel: "24 de octubre de 2026", reference: "NDA-1", signedAt: "24 de octubre de 2026", signature: null }));
    expect(pdf.startsWith("%PDF-")).toBe(true);
    expect(pdf).toContain("DNI/NIE: 12345678Z");
    expect(pdf).toContain("(Relify)");
    expect(pdf).toMatch(/P\\341gina 1 de 1/);
    expect(pdf.trimEnd().endsWith("%%EOF")).toBe(true);
  });

  it("marks unsigned documents as a draft", () => {
    const pdf = decoder.decode(dealDocumentPdf({ kind: "nda", text, signer, dateLabel: "x", reference: "Borrador" }));
    expect(pdf).toContain("BORRADOR");
  });

  it("titles the platform terms by role", () => {
    const pdf = decoder.decode(termsDocumentPdf({ signer: { ...signer, role: "Asesor" }, dateLabel: "x", reference: "TOS-1" }));
    expect(pdf).toContain("Acuerdo de uso de Relify \\267 Asesor");
  });
});
