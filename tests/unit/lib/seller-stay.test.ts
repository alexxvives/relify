import { describe, expect, it } from "vitest";
import { sellerStayText, storedSellerStay } from "@/lib/seller-stay";

describe("seller stay (t93)", () => {
  it("reads only known answers", () => {
    expect(storedSellerStay(null)).toBeNull();
    expect(storedSellerStay("")).toBeNull();
    expect(storedSellerStay("5y")).toBeNull();
    expect(storedSellerStay("3m")).toBe("3m");
  });
  it("writes a short buyer sentence", () => {
    expect(sellerStayText("3m")).toBe("Se queda como asesor 3 meses");
    expect(sellerStayText("1y")).toBe("Se queda como asesor 1 año");
    expect(sellerStayText("1w")).toBe("Se queda como asesor 1 semana");
    expect(sellerStayText("no")).toBe("No se queda tras la venta");
  });
});
