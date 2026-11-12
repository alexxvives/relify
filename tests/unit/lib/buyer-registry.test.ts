import { describe, expect, it } from "vitest";
import { auditStatusLabel, buyerRegistryView } from "@/lib/buyer-registry";
import type { SabiRegistry } from "@/lib/sabi/registry";

const registry: SabiRegistry = {
  directors: [{ name: "Don Ana Ruiz Gil", role: "Administrador", since: null, department: null, group: null }],
  shareholdings: [{ name: "HOLDING SECRETA SL", country: "ES", type: "Sociedad", direct: "100,00", total: null, infoDate: null }],
  subsidiaries: [{ name: "FILIAL SECRETA SL", country: "ES", type: null, direct: "100,00", total: null, infoDate: null }],
  audits: [
    { year: 2024, closingOn: null, opinion: "Sin datos de auditoría", auditorName: null, auditorCode: null, fields: {} },
    { year: 2023, closingOn: "2023-12-31", opinion: "Aprobado", auditorName: "AUDITORA SECRETA SLP", auditorCode: "S1", fields: {} },
    { year: 2022, closingOn: null, opinion: "Pendiente de tratamiento", auditorName: null, auditorCode: null, fields: {} },
  ],
  banks: ["0182 - BANCO SECRETO"],
  activityCodes: { cnae2009: { primary: [{ code: "4321", description: "Instalaciones eléctricas" }], secondary: [] }, iae: { primary: [{ code: "504", description: "x" }], secondary: [] } },
  years: [],
} as unknown as SabiRegistry;

describe("buyerRegistryView gating", () => {
  it("before the NDA carries only the audit summary and CNAE labels: no names of any kind", () => {
    const view = buyerRegistryView(registry, false)!;
    expect(view.auditLine).toBe("Cuentas auditadas en 2023 · opinión favorable");
    expect(view.activities).toEqual([{ code: "4321", title: "Instalaciones eléctricas", main: true }]);
    expect(view.audits).toBeNull();
    expect(view.directors).toBeNull();
    const text = JSON.stringify(view);
    for (const secret of ["SECRETA", "SECRETO", "Ana Ruiz", "S1", "BANCO"]) {
      expect(text).not.toContain(secret);
    }
  });

  it("after the NDA adds audits with auditor and the directors, never shareholders or banks", () => {
    const view = buyerRegistryView(registry, true)!;
    expect(view.audits?.map((audit) => [audit.year, audit.status, audit.auditor])).toEqual([
      [2024, "No auditada / sin dato", null],
      [2023, "Opinión favorable", "AUDITORA SECRETA SLP"],
      [2022, "En trámite en el registro", null],
    ]);
    expect(view.directors).toEqual([{ name: "Don Ana Ruiz Gil", role: "Administrador" }]);
    const text = JSON.stringify(view);
    expect(text).not.toContain("HOLDING SECRETA");
    expect(text).not.toContain("FILIAL");
    expect(text).not.toContain("BANCO");
  });

  it("returns nothing without registry data", () => {
    expect(buyerRegistryView(null, true)).toBeNull();
  });

  it("translates registry statuses to plain Spanish", () => {
    expect(auditStatusLabel(null)).toBe("No auditada / sin dato");
    expect(auditStatusLabel("Con salvedades")).toBe("Opinión con salvedades");
    expect(auditStatusLabel("Desfavorable")).toBe("Opinión desfavorable");
  });
});
