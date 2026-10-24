import { describe, expect, it } from "vitest";
import { relevaDraftPdf, relevaDraftText } from "./releva-drafts";

describe("releva drafts", () => {
  it("builds an NDA pdf that keeps the company identity out", () => {
    const text = relevaDraftText("releva-nda");
    const pdf = relevaDraftPdf("releva-nda");

    expect(text).toContain("El comprador");
    expect(text).toContain("el proyecto");
    expect(text).not.toContain("Horno");
    expect(pdf?.fileName).toBe("Acuerdo-de-confidencialidad.pdf");
    expect(Buffer.from(pdf?.bytes ?? []).subarray(0, 8).toString()).toBe("%PDF-1.4");
    expect(Buffer.from(pdf?.bytes ?? []).toString("latin1")).toContain("Helvetica-Bold");
    expect(Buffer.from(pdf?.bytes ?? []).toString("latin1")).toContain("Acuerdo de confidencialidad");
  });
});
