import { describe, expect, it } from "vitest";
import { advisorNdaAgreement, loiAgreement, ndaAgreement, projectTitle, regionPlace, spanishDate } from "./deal-documents";

const sample = {
  buyerName: "Laura Vidal",
  codename: "Proyecto Duna",
  region: "Canarias",
  dateLabel: "7 de octubre de 2026",
};

describe("deal documents", () => {
  it("formats the Madrid date in Spanish", () => {
    expect(spanishDate(new Date("2026-10-07T10:00:00.000Z"))).toBe("7 de octubre de 2026");
  });

  it("names the buyer and the project and leaves the company identity out", () => {
    const nda = ndaAgreement(sample);
    const loi = loiAgreement({ ...sample, askingPrice: "1.200.000 €" });

    expect(nda).toContain("Laura Vidal");
    expect(nda).toContain("Proyecto Duna");
    expect(nda).toContain("Canarias");
    expect(loi).toContain("1.200.000 €");
    expect(loi).toContain("seis meses");
    expect(nda).toContain("No reserva la empresa");
    expect(nda).not.toContain("La reserva dura");
    expect(loi).not.toContain("B11223344");
    expect(nda).not.toContain("B11223344");
    expect(loi).not.toContain("Duna Servicios");
    expect(nda.length).toBeLessThan(2000);
    expect(loi.length).toBeLessThan(2000);
  });

  it("t92: opens with the parties and never says 'proyecto Proyecto'", () => {
    const input = { buyerName: "Martín Soler", codename: "Proyecto Olivo", region: "Comunitat Valenciana", dateLabel: "4 de noviembre de 2026" };
    const nda = ndaAgreement(input);
    expect(nda).toContain(
      "Martín Soler (el Comprador) y el titular de Proyecto Olivo, empresa ubicada en la Comunitat Valenciana (el Vendedor), acuerdan lo siguiente:",
    );
    for (const text of [nda, loiAgreement({ ...input, askingPrice: "1 €" }), advisorNdaAgreement({ ...input, advisorName: "Ana" })]) {
      expect(text.toLowerCase()).not.toContain("proyecto proyecto");
    }
    expect(projectTitle("Olivo")).toBe("Proyecto Olivo");
    expect(projectTitle("proyecto  Olivo")).toBe("Proyecto Olivo");
    expect(regionPlace("Canarias")).toBe("Canarias");
  });
});
