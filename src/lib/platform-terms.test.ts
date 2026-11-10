import { describe, expect, it } from "vitest";
import { platformTermsCopy } from "./platform-terms";

describe("platform terms 03 Comisiones", () => {
  it("keeps six clauses and the exact new commission body, without a 49 € advisor subscription", () => {
    expect(platformTermsCopy.clauses.map((clause) => clause.title)).toEqual([
      "Qué es este acuerdo",
      "Operaciones cerradas fuera de Relify",
      "Comisiones",
      "Confidencialidad",
      "Uso del chat",
      "Validez",
    ]);
    expect(platformTermsCopy.body[2]).toBe(
      "La comisión de cierre de Relify es el 5% del precio total para quien vende y el 2,5% para quien compra, o el 2% si el comprador tenía el plan Empresa cuando se hizo el match. Un asesor paga a Relify el 15% de lo que cobre por cada encargo, más el IVA de ese 15%. El precio total de la venta incluye la parte que se pague más tarde. La comisión de cierre se paga entera el día de la firma, sin mínimos, más el IVA.",
    );
    expect(platformTermsCopy.body.join(" ")).not.toContain("49");
    expect(platformTermsCopy.body.join(" ")).not.toContain("suscripción");
  });
});
