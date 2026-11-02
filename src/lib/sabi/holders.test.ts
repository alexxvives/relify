import { describe, expect, it } from "vitest";
import { formatHolderName, formatHoldingPercent, holderTypeLabel } from "./holders";

describe("shareholder formatting", () => {
  it("cleans names", () => {
    expect(formatHolderName("MR GERARD GARCIA ESTEVE")).toBe("Gerard Garcia Esteve");
    expect(formatHolderName("BCLAN 8912 SL.")).toBe("Bclan 8912 SL");
    expect(formatHolderName("  JOSÉ  MARÍA O'NEIL ")).toBe("José María O'Neil");
  });

  it("formats percents and hides blanks", () => {
    expect(formatHoldingPercent(">50,00")).toBe("> 50 %");
    expect(formatHoldingPercent("8,10")).toBe("8,1 %");
    expect(formatHoldingPercent("-")).toBeNull();
    expect(formatHoldingPercent(null)).toBeNull();
  });

  it("labels known types and hides the rest", () => {
    expect(holderTypeLabel("I")).toBe("Persona física");
    expect(holderTypeLabel("c")).toBe("Sociedad");
    expect(holderTypeLabel("Z")).toBeNull();
    expect(holderTypeLabel(null)).toBeNull();
  });
});
