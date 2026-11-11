import { describe, expect, it } from "vitest";
import {
  isValuationRequestStatus,
  valuationCopy,
  valuationRequestSchema,
  valuationRequestStatuses,
} from "./valuation-request";

describe("valuationRequestSchema", () => {
  it("accepts a checksummed CIF, name, email and optional phone", () => {
    const parsed = valuationRequestSchema.parse({
      cif: " b-12345674 ",
      contactName: "Ana Pérez",
      contactEmail: "Ana@Example.com",
      phone: "+34 689 99 43 85",
    });
    expect(parsed).toEqual({
      cif: "B12345674",
      contactName: "Ana Pérez",
      contactEmail: "ana@example.com",
      phone: "+34 689 99 43 85",
    });
  });

  it("rejects a bad CIF checksum", () => {
    const result = valuationRequestSchema.safeParse({
      cif: "B12345678",
      contactName: "Ana",
      contactEmail: "ana@example.com",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a short name or a bad email", () => {
    expect(
      valuationRequestSchema.safeParse({
        cif: "B12345674",
        contactName: "A",
        contactEmail: "ana@example.com",
      }).success,
    ).toBe(false);
    expect(
      valuationRequestSchema.safeParse({
        cif: "B12345674",
        contactName: "Ana",
        contactEmail: "not-an-email",
      }).success,
    ).toBe(false);
  });

  it("treats a blank phone as absent", () => {
    const parsed = valuationRequestSchema.parse({
      cif: "B12345674",
      contactName: "Ana",
      contactEmail: "ana@example.com",
      phone: "  ",
    });
    expect(parsed.phone).toBeUndefined();
  });
});

describe("valuation copy and statuses", () => {
  it("uses the approved confirmation sentence", () => {
    expect(valuationCopy.doneBody).toBe(
      "Hemos recibido tu solicitud; te enviaremos la valoración con explicación y gráficas.",
    );
  });

  it("explains the EV formula and labels sample figures as examples", () => {
    expect(valuationCopy.formulaEv).toMatch(/EBITDA ajustado × múltiplo sectorial/);
    expect(valuationCopy.formulaEquity).toMatch(/deuda financiera neta/);
    expect(valuationCopy.exampleLabel).toBe("Ejemplo");
    expect(valuationCopy.scenarios).toHaveLength(3);
    expect(valuationCopy.freeStamp).toBe("Sin cargo");
  });

  it("lists the five admin statuses", () => {
    expect(valuationRequestStatuses).toEqual(["received", "sabi_loaded", "drafted", "sent", "discarded"]);
    expect(isValuationRequestStatus("received")).toBe(true);
    expect(isValuationRequestStatus("pending")).toBe(false);
  });
});
