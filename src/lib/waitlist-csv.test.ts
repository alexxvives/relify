import { describe, expect, it } from "vitest";
import { waitlistCsv } from "./waitlist-csv";

describe("waitlistCsv", () => {
  it("quotes cells, escapes quotes and neutralises formulas", () => {
    const csv = waitlistCsv(
      [{ name: 'Ana "A"', email: "=cmd@x.es", roleLabel: "Empresa", city: "", createdAt: "2026-10-29T10:00:00.000Z" }],
      () => "29/10/2026",
    );
    expect(csv).toBe('\uFEFF"Nombre";"Correo";"Perfil";"Ciudad";"Fecha"\r\n"Ana ""A""";"\'=cmd@x.es";"Empresa";"";"29/10/2026"\r\n');
  });
});
